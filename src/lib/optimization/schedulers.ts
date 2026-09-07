import { Appliance, TariffPeriod } from '@prisma/client';
import { getPriceForTime } from '../domain/tariff';
import { addMinutes, format, parse, setHours, setMinutes, isAfter, isBefore } from 'date-fns';

export interface ScheduleResult {
  applianceId: string;
  startTime: Date;
  endTime: Date;
  cost: number;
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
      cost
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
      if (app.latestFinish === '00:00') windowEnd = addMinutes(windowEnd, 24*60); // next midnight

      // Check slots every 30 mins
      let current = windowStart;
      while (isBefore(addMinutes(current, app.minRuntime * 60), windowEnd)) {
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
      cost
    });
  }

  return results;
}

/**
 * Optimization: Greedy heuristic approximating MILP to find the lowest cost schedule
 * while respecting the household power limit.
 */
export function optimizeSchedule(
  appliances: Appliance[],
  date: Date,
  periods: TariffPeriod[],
  householdPowerLimitKw: number,
  baseLoadKw: number = 0.5
): ScheduleResult[] {
  const results: ScheduleResult[] = [];
  
  // Track power usage for each 15-minute slot of the day (96 slots)
  const powerProfile = new Array(96).fill(baseLoadKw);

  // Sort appliances by flexibility and priority
  // Critical non-flexible first, then high priority, then longest runtime
  const sorted = [...appliances].sort((a, b) => {
    if (a.flexibility === 'critical' && b.flexibility !== 'critical') return -1;
    if (b.flexibility === 'critical' && a.flexibility !== 'critical') return 1;
    return b.ratedPower * b.minRuntime - a.ratedPower * a.minRuntime;
  });

  for (const app of sorted) {
    if (!app.automationEnabled) continue;

    const windowStart = parseTime(date, app.earliestStart || '00:00');
    let windowEnd = parseTime(date, app.latestFinish || '23:59');
    if (app.latestFinish === '00:00') windowEnd = addMinutes(parseTime(date, '00:00'), 24*60);

    const requiredSlots = Math.ceil((app.minRuntime * 60) / 15);
    
    let bestStartSlot = -1;
    let minCost = Infinity;

    const startSlotIdx = getSlotIndex(windowStart);
    const endSlotIdx = getSlotIndex(windowEnd);

    // Slide window to find cheapest valid slot
    for (let i = startSlotIdx; i <= endSlotIdx - requiredSlots; i++) {
      let valid = true;
      let currentCost = 0;

      for (let j = 0; j < requiredSlots; j++) {
        const slotTime = getSlotTime(date, i + j);
        const price = getPriceForTime(periods, slotTime);
        currentCost += price * (app.ratedPower * 0.25); // 15 mins = 0.25h

        if (powerProfile[i + j] + app.ratedPower > householdPowerLimitKw) {
          valid = false;
          break;
        }
      }

      if (valid && currentCost < minCost) {
        minCost = currentCost;
        bestStartSlot = i;
      }
    }

    if (bestStartSlot !== -1) {
      // Commit to schedule
      for (let j = 0; j < requiredSlots; j++) {
        powerProfile[bestStartSlot + j] += app.ratedPower;
      }
      
      const startTime = getSlotTime(date, bestStartSlot);
      results.push({
        applianceId: app.id,
        startTime,
        endTime: addMinutes(startTime, requiredSlots * 15),
        cost: minCost
      });
    } else {
      // Infeasible for this appliance (fallback to earliest possible ignoring limit to ensure execution, or mark infeasible)
      // For demo, we just place it at windowStart and accept limit violation
      results.push({
        applianceId: app.id,
        startTime: windowStart,
        endTime: addMinutes(windowStart, app.minRuntime * 60),
        cost: getPriceForTime(periods, windowStart) * app.minRuntime * app.ratedPower
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
