import { Appliance, Schedule, Household, TariffPeriod } from "@prisma/client";
import { BatteryState, calculateBatterySOC, canAcceptEnergy, canProvideEnergy } from "../domain/battery";
import { getPriceForTime } from "../domain/tariff";

export interface TickResult {
  timestamp: Date;
  homeDemandKw: number;
  solarKw: number;
  batterySoc: number;
  batteryPowerKw: number;
  gridImportKw: number;
  gridExportKw: number;
  baseLoadKw: number;
  applianceLoadKw: number;
  currentCost: number;
}

// Pseudo-random generator seeded by date for determinism
function pseudoRandom(seed: number): number {
  const x = Math.sin(seed++) * 10000;
  return x - Math.floor(x);
}

export function evaluateTick(
  virtualTime: Date,
  household: Household,
  appliances: Appliance[],
  schedules: Schedule[],
  tariffPeriods: TariffPeriod[],
  intervalHours: number // duration this tick represents (e.g. 0.25 for 15m, or smaller)
): TickResult {
  let currentSoc = household.currentBatterySoc;
  const batteryState: BatteryState = {
    socPercentage: currentSoc,
    capacityKwh: 10,
    maxChargeKw: 5,
    maxDischargeKw: 5,
    reserveSocPercentage: household.batteryReserve,
    efficiency: 0.95
  };

  const seedBase = virtualTime.getTime();
  
  const solarFactor = (household.solarIrradiance ?? 50) / 50;
  const baseLoadSetting = household.baseLoad ?? 10;
  const baseLoadBaseKw = (baseLoadSetting / 10) * 0.5;
  const forecastError = household.forecastError ?? 0;
  const inverterFault = household.inverterFault ?? false;
  const evDisconnected = household.evDisconnected ?? false;

  const hour = virtualTime.getHours() + virtualTime.getMinutes() / 60 + virtualTime.getSeconds() / 3600;

  // 1. Base Load
  let baseLoadKw = baseLoadBaseKw * 0.6;
  if (hour >= 6 && hour < 9) baseLoadKw += Math.sin((hour - 6) * Math.PI / 3) * (baseLoadBaseKw * 1.6);
  if (hour >= 17 && hour < 23) baseLoadKw += Math.sin((hour - 17) * Math.PI / 6) * (baseLoadBaseKw * 3.0);
  
  const noiseFactor = 0.2 + (forecastError / 100);
  const noise = (pseudoRandom(seedBase) - 0.5) * noiseFactor * baseLoadBaseKw;
  baseLoadKw = Math.max(0.1, baseLoadKw + noise);

  // 2. Appliance Load
  let applianceLoadKw = 0;
  for (const schedule of schedules) {
    if (virtualTime >= schedule.startTime && virtualTime < schedule.endTime) {
      const appliance = appliances.find(a => a.id === schedule.applianceId);
      if (appliance) {
        if (appliance.category === 'ev' && evDisconnected) continue;
        applianceLoadKw += appliance.ratedPower;
      }
    }
  }

  const totalHomeDemandKw = baseLoadKw + applianceLoadKw;

  // 3. Solar Generation
  let solarKw = 0;
  if (!inverterFault && hour > 6 && hour < 18) {
    const peakSolar = 5.0 * solarFactor;
    solarKw = peakSolar * (1 - Math.pow((hour - 12) / 6, 2));
    const solarNoise = 0.4 + (forecastError / 50);
    solarKw *= (1.0 - solarNoise / 2 + solarNoise * pseudoRandom(seedBase + 1000)); 
  }
  solarKw = Math.max(0, solarKw);

  // 4. Energy Balance & Battery Logic
  let netKw = totalHomeDemandKw - solarKw;
  let batteryPowerKw = 0;
  let gridImportKw = 0;
  let gridExportKw = 0;

  if (netKw > 0) {
    if (canProvideEnergy(batteryState, netKw, intervalHours)) {
      batteryPowerKw = netKw;
      currentSoc = calculateBatterySOC(batteryState, 0, batteryPowerKw, intervalHours);
      netKw = 0;
    } else {
      const availableDischargeKw = Math.min(
        batteryState.maxDischargeKw,
        ((currentSoc - batteryState.reserveSocPercentage) / 100 * batteryState.capacityKwh) / intervalHours
      );
      if (availableDischargeKw > 0) {
        batteryPowerKw = availableDischargeKw;
        currentSoc = calculateBatterySOC(batteryState, 0, batteryPowerKw, intervalHours);
        netKw -= batteryPowerKw;
      }
      gridImportKw = netKw;
    }
  } else if (netKw < 0) {
    const excessKw = Math.abs(netKw);
    if (canAcceptEnergy(batteryState, excessKw, intervalHours)) {
      batteryPowerKw = -excessKw;
      currentSoc = calculateBatterySOC(batteryState, excessKw, 0, intervalHours);
    } else {
      const availableChargeKw = Math.min(
        batteryState.maxChargeKw,
        ((100 - currentSoc) / 100 * batteryState.capacityKwh) / intervalHours / batteryState.efficiency
      );
      if (availableChargeKw > 0) {
        batteryPowerKw = -availableChargeKw;
        currentSoc = calculateBatterySOC(batteryState, availableChargeKw, 0, intervalHours);
      }
      gridExportKw = excessKw - Math.abs(batteryPowerKw);
    }
  }

  const currentPrice = getPriceForTime(tariffPeriods, virtualTime);
  const currentCost = gridImportKw * intervalHours * currentPrice;

  return {
    timestamp: virtualTime,
    homeDemandKw: totalHomeDemandKw,
    solarKw,
    batterySoc: currentSoc,
    batteryPowerKw,
    gridImportKw,
    gridExportKw,
    baseLoadKw,
    applianceLoadKw,
    currentCost
  };
}
