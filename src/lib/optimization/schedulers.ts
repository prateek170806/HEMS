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
  reasonCategory?: string;
  impact?: string;
  affectedMetric?: string;
  originalStart?: Date;
  originalEnd?: Date;
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
        explanation: `Appliance skipped: EV is disconnected.`,
        reasonCategory: 'INFEASIBLE',
        impact: 'EV schedule ignored',
        affectedMetric: 'None',
        originalStart: parseTime(date, app.earliestStart || '00:00'),
        originalEnd: addMinutes(parseTime(date, app.earliestStart || '00:00'), app.minRuntime * 60)
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
      let baselineMetrics = { cost: 0, peakPenalty: 0, solarAbsorbed: 0 };
      let bestMetrics = { cost: 0, peakPenalty: 0, solarAbsorbed: 0 };
      
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
          reasonCategory: null,
          impact: null,
          affectedMetric: null,
          originalStart: null,
          originalEnd: null,
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
        let solarAbsorbed = 0;

        for (const slot of simResult) {
          const price = getPriceForTime(periods, slot.timestamp);
          cost += slot.gridImportKw * 0.25 * price;
          solarAbsorbed += Math.max(0, slot.solarKw - slot.gridExportKw) * 0.25;
          
          if (slot.homeDemandKw > household.powerLimitKw) {
            peakPenalty += (slot.homeDemandKw - household.powerLimitKw) * 1000;
          }
          if (slot.batterySoc < household.batteryReserve) {
            reservePenalty += (household.batteryReserve - slot.batterySoc) * 100;
          }
        }

        const currentMetrics = { cost, peakPenalty, solarAbsorbed };
        
        if (i === startSlotIdx) {
          baselineMetrics = currentMetrics;
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
          bestMetrics = currentMetrics;
          
          // Re-calculate the isolated appliance cost for the explanation
          let isoCost = 0;
          for (let j = 0; j < requiredSlots; j++) {
            const sTime = getSlotTime(date, (i + j) % 96);
            isoCost += getPriceForTime(periods, sTime) * app.ratedPower * 0.25;
          }
          bestCost = isoCost;
        }
      }
      
      // Store these metrics on the app object temporarily so the outer block can use them
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (app as any)._baselineMetrics = baselineMetrics;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (app as any)._bestMetrics = bestMetrics;
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
        reasonCategory: null,
        impact: null,
        affectedMetric: null,
        originalStart: null,
        originalEnd: null,
        estimatedCost: bestCost,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      committedSchedules.push(finalSchedule);
      
      let explanation = `Optimized schedule: Placed at ${format(startTime, 'HH:mm')}.`;
      let reasonCategory = 'NO_CHANGE_NEEDED';
      let impact = 'Optimal baseline maintained';
      let affectedMetric = 'Cost/Peak';
      
      if (bestStartSlot !== startSlotIdx) {
        let originalCost = 0;
        for (let j = 0; j < requiredSlots; j++) {
          originalCost += getPriceForTime(periods, getSlotTime(date, (startSlotIdx + j) % 96)) * app.ratedPower * 0.25;
        }
        const savedCost = Math.max(0, originalCost - bestCost);
        
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const baselineMetrics = (app as any)._baselineMetrics || { cost: 0, peakPenalty: 0, solarAbsorbed: 0 };
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const bestMetrics = (app as any)._bestMetrics || { cost: 0, peakPenalty: 0, solarAbsorbed: 0 };

        const costDiff = baselineMetrics.cost - bestMetrics.cost;
        const peakDiff = baselineMetrics.peakPenalty - bestMetrics.peakPenalty;
        const solarDiff = bestMetrics.solarAbsorbed - baselineMetrics.solarAbsorbed;

        if (peakDiff > 0.01) {
          reasonCategory = 'PEAK_AVOIDANCE';
          impact = 'Avoided power limit violation';
          affectedMetric = 'Peak';
          explanation = `${app.name} shifted from ${format(windowStart, 'HH:mm')} to ${format(startTime, 'HH:mm')}. Reason: Shifted to prevent exceeding the household power limit.`;
        } else if (solarDiff > 0.01) {
          reasonCategory = 'SOLAR_UTILIZATION';
          impact = 'Increased solar usage';
          affectedMetric = 'Solar';
          explanation = `${app.name} shifted from ${format(windowStart, 'HH:mm')} to ${format(startTime, 'HH:mm')}. Reason: Shifted to align with available solar generation.`;
        } else if (savedCost > 0.01 || costDiff > 0.01) {
          reasonCategory = 'LOWER_TARIFF';
          impact = `Saved ₹${savedCost.toFixed(2)}`;
          affectedMetric = 'Cost';
          explanation = `${app.name} shifted from ${format(windowStart, 'HH:mm')} to ${format(startTime, 'HH:mm')}. Reason: Shifted to a lower cost period (savings of ₹${savedCost.toFixed(2)}).`;
        } else {
          reasonCategory = 'NO_CHANGE_NEEDED';
          explanation = `${app.name} shifted from ${format(windowStart, 'HH:mm')} to ${format(startTime, 'HH:mm')} due to minor comfort/flexibility weights.`;
        }
      } else {
        explanation = `${app.name} kept at ${format(startTime, 'HH:mm')}. Reason: Preferred time is already optimal given current tariffs and generation.`;
      }

      results.push({
        applianceId: app.id,
        startTime,
        endTime,
        cost: bestCost,
        explanation,
        reasonCategory,
        impact,
        affectedMetric,
        originalStart: windowStart,
        originalEnd: addMinutes(windowStart, app.minRuntime * 60)
      });
    } else {
      results.push({
        applianceId: app.id,
        startTime: windowStart,
        endTime: addMinutes(windowStart, app.minRuntime * 60),
        cost: getPriceForTime(periods, windowStart) * app.minRuntime * app.ratedPower,
        explanation: `Fallback schedule: Constraints made optimization infeasible. Reverted to earliest start at ${format(windowStart, 'HH:mm')}.`,
        reasonCategory: 'INFEASIBLE',
        impact: 'Constraint collision, fallback schedule used',
        affectedMetric: 'Constraint',
        originalStart: windowStart,
        originalEnd: addMinutes(windowStart, app.minRuntime * 60)
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
