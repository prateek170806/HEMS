import { startOfDay, addMinutes, getHours } from "date-fns";
import { Appliance, Schedule, Household } from "@prisma/client";
import { BatteryState, calculateBatterySOC, canAcceptEnergy, canProvideEnergy } from "../domain/battery";

export interface SimulationResult {
  timestamp: Date;
  homeDemandKw: number; // Base load + appliances
  solarKw: number;
  batterySoc: number;
  batteryPowerKw: number; // + for discharging, - for charging
  gridImportKw: number;
  gridExportKw: number;
  baseLoadKw: number;
  applianceLoadKw: number;
}

// Pseudo-random generator seeded by date for determinism
function pseudoRandom(seed: number): number {
  const x = Math.sin(seed++) * 10000;
  return x - Math.floor(x);
}

export function simulateDay(
  date: Date,
  household: Household & { 
    solarIrradiance?: number; 
    baseLoad?: number; 
    forecastError?: number; 
    inverterFault?: boolean; 
    evDisconnected?: boolean;
    smartMeterOffline?: boolean;
  },
  appliances: Appliance[],
  schedules: Schedule[]
): SimulationResult[] {
  const results: SimulationResult[] = [];
  const start = startOfDay(date);
  const slots = 96; // 15-min intervals
  const intervalHours = 0.25;

  let currentSoc = household.batteryReserve; // Start at reserve for worst-case, or define a starting point
  const batteryState: BatteryState = {
    socPercentage: currentSoc,
    capacityKwh: 10, // Assuming 10kWh battery
    maxChargeKw: 5,
    maxDischargeKw: 5,
    reserveSocPercentage: household.batteryReserve,
    efficiency: 0.95
  };

  const seedBase = date.getTime();
  
  // Extract simulation properties from household (with defaults)
  const solarFactor = (household.solarIrradiance ?? 50) / 50;
  const baseLoadSetting = household.baseLoad ?? 10;
  const baseLoadBaseKw = (baseLoadSetting / 10) * 0.5;
  const forecastError = household.forecastError ?? 0;
  const inverterFault = household.inverterFault ?? false;
  const evDisconnected = household.evDisconnected ?? false;

  for (let i = 0; i < slots; i++) {
    const slotTime = addMinutes(start, i * 15);
    const hour = getHours(slotTime) + (i % 4) * 0.25;
    
    // 1. Base Load (Deterministic curve with noise)
    // Peaks in morning (7-9) and evening (18-22)
    let baseLoadKw = baseLoadBaseKw * 0.6; // Minimum nighttime load
    if (hour >= 6 && hour < 9) baseLoadKw += Math.sin((hour - 6) * Math.PI / 3) * (baseLoadBaseKw * 1.6);
    if (hour >= 17 && hour < 23) baseLoadKw += Math.sin((hour - 17) * Math.PI / 6) * (baseLoadBaseKw * 3.0);
    
    // Add noise based on forecastError
    const noiseFactor = 0.2 + (forecastError / 100);
    const noise = (pseudoRandom(seedBase + i) - 0.5) * noiseFactor * baseLoadBaseKw;
    baseLoadKw = Math.max(0.1, baseLoadKw + noise);

    // 2. Appliance Load
    let applianceLoadKw = 0;
    for (const schedule of schedules) {
      if (slotTime >= schedule.startTime && slotTime < schedule.endTime) {
        const appliance = appliances.find(a => a.id === schedule.applianceId);
        if (appliance) {
          if (appliance.category === 'ev' && evDisconnected) {
            // EV disconnected fault: EV draws no power
            continue;
          }
          applianceLoadKw += appliance.ratedPower;
        }
      }
    }

    const totalHomeDemandKw = baseLoadKw + applianceLoadKw;

    // 3. Solar Generation (Parabolic from 6:00 to 18:00)
    let solarKw = 0;
    if (!inverterFault && hour > 6 && hour < 18) {
      const peakSolar = 5.0 * solarFactor; // Max 5kW array
      // Parabola centered at 12:00
      solarKw = peakSolar * (1 - Math.pow((hour - 12) / 6, 2));
      // Cloud noise + forecast error
      const solarNoise = 0.4 + (forecastError / 50);
      solarKw *= (1.0 - solarNoise / 2 + solarNoise * pseudoRandom(seedBase + i * 2)); 
    }
    solarKw = Math.max(0, solarKw);

    // 4. Energy Balance & Battery Logic
    let netKw = totalHomeDemandKw - solarKw;
    let batteryPowerKw = 0; // Positive = discharging to home, Negative = charging from solar
    let gridImportKw = 0;
    let gridExportKw = 0;

    batteryState.socPercentage = currentSoc;

    if (netKw > 0) {
      // Need power: Try battery first
      if (canProvideEnergy(batteryState, netKw, intervalHours)) {
        batteryPowerKw = netKw;
        currentSoc = calculateBatterySOC(batteryState, 0, batteryPowerKw, intervalHours);
        netKw = 0;
      } else {
        // Battery can't cover all, take what we can
        const availableDischargeKw = Math.min(
          batteryState.maxDischargeKw,
          ((currentSoc - batteryState.reserveSocPercentage) / 100 * batteryState.capacityKwh) / intervalHours
        );
        if (availableDischargeKw > 0) {
          batteryPowerKw = availableDischargeKw;
          currentSoc = calculateBatterySOC(batteryState, 0, batteryPowerKw, intervalHours);
          netKw -= batteryPowerKw;
        }
        gridImportKw = netKw; // Rest from grid
      }
    } else if (netKw < 0) {
      // Excess solar: Try charging battery first
      const excessKw = Math.abs(netKw);
      if (canAcceptEnergy(batteryState, excessKw, intervalHours)) {
        batteryPowerKw = -excessKw; // Charging
        currentSoc = calculateBatterySOC(batteryState, excessKw, 0, intervalHours);
      } else {
        // Battery full or charge limit reached
        const availableChargeKw = Math.min(
          batteryState.maxChargeKw,
          ((100 - currentSoc) / 100 * batteryState.capacityKwh) / intervalHours / batteryState.efficiency
        );
        if (availableChargeKw > 0) {
          batteryPowerKw = -availableChargeKw;
          currentSoc = calculateBatterySOC(batteryState, availableChargeKw, 0, intervalHours);
        }
        gridExportKw = excessKw - Math.abs(batteryPowerKw); // Rest to grid
      }
    }

    results.push({
      timestamp: slotTime,
      homeDemandKw: totalHomeDemandKw,
      solarKw,
      batterySoc: currentSoc,
      batteryPowerKw,
      gridImportKw,
      gridExportKw,
      baseLoadKw,
      applianceLoadKw
    });
  }

  return results;
}
