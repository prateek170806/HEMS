import { Appliance, TariffPeriod } from '@prisma/client';
import { getPriceForTime } from '../domain/tariff';
import { addMinutes, format, parse, setHours, setMinutes, isAfter, isBefore } from 'date-fns';

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
    if (windowEnd <= windowStart) windowEnd = addMinutes(windowEnd, 24*60);

    const requiredSlots = Math.ceil((app.minRuntime * 60) / 15);
    
    let bestStartSlot = -1;
    let minCost = Infinity;

    const startSlotIdx = getSlotIndex(windowStart);
    let endSlotIdx = getSlotIndex(windowEnd);
    if (endSlotIdx <= startSlotIdx) endSlotIdx += 96; // Wrap for next day

    // Slide window to find cheapest valid slot
    for (let i = startSlotIdx; i <= endSlotIdx - requiredSlots; i++) {
      let valid = true;
      let currentCost = 0;

      for (let j = 0; j < requiredSlots; j++) {
        const slotIndex = (i + j) % 96; // Circular profile for overnight
        const slotTime = getSlotTime(date, slotIndex);
        const price = getPriceForTime(periods, slotTime);
        currentCost += price * (app.ratedPower * 0.25); // 15 mins = 0.25h

        if (powerProfile[slotIndex] + app.ratedPower > householdPowerLimitKw) {
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
        const slotIndex = (bestStartSlot + j) % 96;
        powerProfile[slotIndex] += app.ratedPower;
      }
      
      const startTime = getSlotTime(date, bestStartSlot % 96);
      
      let explanation = `Optimized schedule: Placed at ${format(startTime, 'HH:mm')}.`;
      if (bestStartSlot !== startSlotIdx) {
        const originalPrice = getPriceForTime(periods, windowStart);
        explanation = `${app.name} shifted from ${format(windowStart, 'HH:mm')} to ${format(startTime, 'HH:mm')}. Reason: avoided ₹${originalPrice.toFixed(2)}/kWh peak tariff while satisfying the overnight/operating window requirement.`;
      } else {
        explanation = `${app.name} kept at ${format(startTime, 'HH:mm')}. Reason: Preferred time is already optimal or constrained by household power limits.`;
      }

      results.push({
        applianceId: app.id,
        startTime,
        endTime: addMinutes(startTime, requiredSlots * 15),
        cost: minCost,
        explanation
      });
    } else {
      // Infeasible for this appliance (fallback to earliest possible ignoring limit to ensure execution, or mark infeasible)
      // For demo, we just place it at windowStart and accept limit violation
      results.push({
        applianceId: app.id,
        startTime: windowStart,
        endTime: addMinutes(windowStart, app.minRuntime * 60),
        cost: getPriceForTime(periods, windowStart) * app.minRuntime * app.ratedPower,
        explanation: `Fallback schedule: Power limit constraints made optimization infeasible. Reverted to earliest start at ${format(windowStart, 'HH:mm')}.`
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
