import { startOfDay, addMinutes } from "date-fns";
import { Appliance, Schedule, Household, TariffPeriod } from "@prisma/client";
import { evaluateTick, TickResult } from "./tick";

export type SimulationResult = TickResult;

export function simulateDay(
  date: Date,
  household: Household & { 
    solarIrradiance?: number; 
    baseLoad?: number; 
    forecastError?: number; 
    inverterFault?: boolean; 
    evDisconnected?: boolean;
    smartMeterOffline?: boolean;
    currentBatterySoc?: number;
  },
  appliances: Appliance[],
  schedules: Schedule[],
  tariffPeriods: TariffPeriod[] = []
): SimulationResult[] {
  const results: SimulationResult[] = [];
  const start = startOfDay(date);
  const slots = 96; // 15-min intervals
  const intervalHours = 0.25;

  // Clone household so we can iteratively mutate its SOC during the day simulation
  const simHousehold = { 
    ...household, 
    currentBatterySoc: household.currentBatterySoc ?? household.batteryReserve 
  } as Household;

  for (let i = 0; i < slots; i++) {
    const slotTime = addMinutes(start, i * 15);
    
    // Evaluate the tick using shared deterministic logic
    const tick = evaluateTick(
      slotTime,
      simHousehold,
      appliances,
      schedules,
      tariffPeriods,
      intervalHours
    );

    results.push(tick);

    // Update battery SOC for the next interval
    simHousehold.currentBatterySoc = tick.batterySoc;
  }

  return results;
}
