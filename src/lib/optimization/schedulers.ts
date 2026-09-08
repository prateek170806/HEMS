import { Appliance, TariffPeriod, Household, Schedule } from '@prisma/client';
import { getPriceForTime } from '../domain/tariff';
import { simulateDay } from '../simulation/engine';
import { addMinutes, format, setHours, setMinutes, isBefore } from 'date-fns';

export interface ScheduleResult {
  applianceId: string;
  startTime: Date;
  endTime: Date;
  cost: number;
  explanation: string;
}

/**
 * Baseline: Schedules appliances as early as possible within their allowed window.
 */
export function generateBaselineSchedule(
  appliances: Appliance[],
  date: Date,
  periods: TariffPeriod[]
): ScheduleResult[] {
  const results: ScheduleResult[] = [];

  for (const app of appliances) {
    if (!app.automationEnabled) continue;

    const start = parseTime(date, app.earliestStart || '00:00');
    const end = addMinutes(start, app.minRuntime * 60);

    // Calculate cost (simplified: average price * runtime * power)
    const price = getPriceForTime(periods, start);
    const cost = price * app.minRuntime * app.ratedPower;

    results.push({
      applianceId: app.id,
      startTime: start,
      endTime: end,
      cost,
      explanation: `Baseline schedule: Started as soon as possible at ${format(start, 'HH:mm')}.`
    });
  }

  return results;
}

/**
 * Rule-Based: Shifts flexible appliances away from peak periods if possible.
 */
export function generateRuleBasedSchedule(
  appliances: Appliance[],
  date: Date,
  periods: TariffPeriod[]
): ScheduleResult[] {
  const results: ScheduleResult[] = [];

  for (const app of appliances) {
    if (!app.automationEnabled) continue;

    let bestStart = parseTime(date, app.earliestStart || '00:00');
    
    if (app.flexibility === 'shiftable') {
      // Find the first non-peak slot in the allowed window
      const windowStart = parseTime(date, app.earliestStart || '00:00');
      let windowEnd = parseTime(date, app.latestFinish || '23:59');
      if (windowEnd <= windowStart) windowEnd = addMinutes(windowEnd, 24*60);

      // Check slots every 30 mins
      let current = windowStart;
      while (isBefore(addMinutes(current, app.minRuntime * 60), windowEnd) || current.getTime() + app.minRuntime*60000 === windowEnd.getTime()) {
        const period = getPriceForTime(periods, current);
        // Avoid peak (assuming peak is the highest price)
        const isPeak = period >= Math.max(...periods.map(p => p.pricePerKwh));
        
        if (!isPeak) {
          bestStart = current;
          break;
        }
        current = addMinutes(current, 30);
      }
    }

    const end = addMinutes(bestStart, app.minRuntime * 60);
    const price = getPriceForTime(periods, bestStart);
    const cost = price * app.minRuntime * app.ratedPower;

    results.push({
      applianceId: app.id,
      startTime: bestStart,
      endTime: end,
      cost,
      explanation: app.flexibility === 'shiftable' 
        ? `Rule-Based schedule: Shifted to ${format(bestStart, 'HH:mm')} to avoid peak period.`
        : `Rule-Based schedule: Fixed to ${format(bestStart, 'HH:mm')} due to constraints.`
    });
  }

  return results;
}

/**
 * Optimization: Dynamic Objective Function using simulation to find the lowest cost schedule
 * respecting solar generation, battery, and household power limits.
 */
export function optimizeSchedule(
  appliances: Appliance[],
  date: Date,
  periods: TariffPeriod[],
  household: Household & {
    solarIrradiance?: number;
    baseLoad?: number;
    forecastError?: number;
    inverterFault?: boolean;
    evDisconnected?: boolean;
    smartMeterOffline?: boolean;
  }
): ScheduleResult[] {
  const committedSchedules: Schedule[] = [];
  const results: ScheduleResult[] = [];
  
  // Sort appliances by flexibility and priority
  const sorted = [...appliances].sort((a, b) => {
    if (a.flexibility === 'critical' && b.flexibility !== 'critical') return -1;
    if (b.flexibility === 'critical' && a.flexibility !== 'critical') return 1;
    return b.ratedPower * b.minRuntime - a.ratedPower * a.minRuntime;
  });

  for (const app of sorted) {
    if (!app.automationEnabled) continue;
    if (app.category === 'ev' && household.evDisconnected) {
      results.push({
        applianceId: app.id,
        startTime: parseTime(date, app.earliestStart || '00:00'),
        endTime: addMinutes(parseTime(date, app.earliestStart || '00:00'), app.minRuntime * 60),
        cost: 0,
        explanation: `Appliance skipped: EV is disconnected.`
      });
      continue;
    }

    const windowStart = parseTime(date, app.earliestStart || '00:00');
    let windowEnd = parseTime(date, app.latestFinish || '23:59');
    if (windowEnd <= windowStart) windowEnd = addMinutes(windowEnd, 24*60);

    const requiredSlots = Math.ceil((app.minRuntime * 60) / 15);
    
    let bestStartSlot = -1;
    let minScore = Infinity;
    let bestCost = 0;

    const startSlotIdx = getSlotIndex(windowStart);
    let endSlotIdx = getSlotIndex(windowEnd);
    if (endSlotIdx <= startSlotIdx) endSlotIdx += 96; // Wrap for next day

    if (app.flexibility === 'non_flexible' || app.flexibility === 'critical') {
      // Must start exactly at earliestStart
      bestStartSlot = startSlotIdx;
    } else {
      // Slide window to find optimal slot
      for (let i = startSlotIdx; i <= endSlotIdx - requiredSlots; i++) {
        const candidateStartTime = getSlotTime(date, i % 96);
        const candidateEndTime = addMinutes(candidateStartTime, app.minRuntime * 60);

        const tempSchedule: Schedule = {
          id: "temp",
          householdId: household.id,
          applianceId: app.id,
          optimizationId: null,
          startTime: candidateStartTime,
          endTime: candidateEndTime,
          status: "scheduled",
          reason: null,
          estimatedCost: null,
          createdAt: new Date(),
          updatedAt: new Date()
        };

        const testSchedules = [...committedSchedules, tempSchedule];
        
        // Simulate day
        const simResult = simulateDay(date, household, appliances, testSchedules);

        // Calculate Objective Score
        let cost = 0;
        let peakPenalty = 0;
        let reservePenalty = 0;

        for (const slot of simResult) {
          const price = getPriceForTime(periods, slot.timestamp);
          cost += slot.gridImportKw * 0.25 * price;
          
          if (slot.homeDemandKw > household.powerLimitKw) {
            peakPenalty += (slot.homeDemandKw - household.powerLimitKw) * 1000;
          }
          if (slot.batterySoc < household.batteryReserve) {
            reservePenalty += (household.batteryReserve - slot.batterySoc) * 100;
          }
        }

        // Comfort Penalty: slight preference for earlier times to avoid unnecessary shifting
        const shiftMins = (candidateStartTime.getTime() - windowStart.getTime()) / 60000;
        const comfortPenalty = Math.max(0, shiftMins) * 0.05;

        // Weights
        let totalScore = cost;
        if (household.optimizationMode === 'economic') {
          totalScore = (cost * 2) + peakPenalty + comfortPenalty + reservePenalty;
        } else if (household.optimizationMode === 'comfort') {
          totalScore = cost + peakPenalty + (comfortPenalty * 5) + reservePenalty;
        } else {
          totalScore = (cost * 1.5) + peakPenalty + (comfortPenalty * 2) + reservePenalty;
        }

        if (totalScore < minScore) {
          minScore = totalScore;
          bestStartSlot = i;
          
          // Re-calculate the isolated appliance cost for the explanation
          let isoCost = 0;
          for (let j = 0; j < requiredSlots; j++) {
            const sTime = getSlotTime(date, (i + j) % 96);
            isoCost += getPriceForTime(periods, sTime) * app.ratedPower * 0.25;
          }
          bestCost = isoCost;
        }
      }
    }

    if (bestStartSlot !== -1) {
      const startTime = getSlotTime(date, bestStartSlot % 96);
      const endTime = addMinutes(startTime, app.minRuntime * 60);
      
      const finalSchedule: Schedule = {
        id: `sched-${app.id}`,
        householdId: household.id,
        applianceId: app.id,
        optimizationId: null,
        startTime,
        endTime,
        status: "scheduled",
        reason: null,
        estimatedCost: bestCost,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      committedSchedules.push(finalSchedule);
      
      let explanation = `Optimized schedule: Placed at ${format(startTime, 'HH:mm')}.`;
      if (bestStartSlot !== startSlotIdx) {
        let originalCost = 0;
        for (let j = 0; j < requiredSlots; j++) {
          originalCost += getPriceForTime(periods, getSlotTime(date, (startSlotIdx + j) % 96)) * app.ratedPower * 0.25;
        }
        explanation = `${app.name} shifted from ${format(windowStart, 'HH:mm')} to ${format(startTime, 'HH:mm')}. Reason: shifted to lower cost period (savings of ₹${Math.max(0, originalCost - bestCost).toFixed(2)}) or utilized solar while satisfying power limits.`;
      } else {
        explanation = `${app.name} kept at ${format(startTime, 'HH:mm')}. Reason: Preferred time is already optimal given current tariffs and solar generation.`;
      }

      results.push({
        applianceId: app.id,
        startTime,
        endTime,
        cost: bestCost,
        explanation
      });
    } else {
      results.push({
        applianceId: app.id,
        startTime: windowStart,
        endTime: addMinutes(windowStart, app.minRuntime * 60),
        cost: getPriceForTime(periods, windowStart) * app.minRuntime * app.ratedPower,
        explanation: `Fallback schedule: Constraints made optimization infeasible. Reverted to earliest start at ${format(windowStart, 'HH:mm')}.`
      });
    }
  }

  return results;
}

// Helpers
function parseTime(baseDate: Date, timeStr: string): Date {
  const [hours, minutes] = timeStr.split(':').map(Number);
  return setMinutes(setHours(baseDate, hours), minutes);
}

function getSlotIndex(time: Date): number {
  return time.getHours() * 4 + Math.floor(time.getMinutes() / 15);
}

function getSlotTime(baseDate: Date, slotIndex: number): Date {
  const hours = Math.floor(slotIndex / 4);
  const minutes = (slotIndex % 4) * 15;
  return setMinutes(setHours(baseDate, hours), minutes);
}
