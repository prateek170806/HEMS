import { getCurrentHousehold } from "@/lib/server/auth";
import { prisma } from "@/lib/server/db";
import { optimizeSchedule, generateBaselineSchedule, generateRuleBasedSchedule } from "@/lib/optimization/schedulers";
import { startOfDay } from "date-fns";
import { simulateDay, SimulationResult } from "@/lib/simulation/engine";
import { getPriceForTime } from "@/lib/domain/tariff";
import { TariffPeriod, Schedule } from "@prisma/client";

export async function executeOptimizationRun() {
  const household = await getCurrentHousehold();
  if (!household) throw new Error("Household not found");

  const appliances = await prisma.appliance.findMany({ where: { householdId: household.id } });
  const tariff = await prisma.tariff.findFirst({
    where: { householdId: household.id, isActive: true },
    include: { periods: true }
  });
  if (!tariff) throw new Error("Active tariff not found");

  const date = startOfDay(new Date());
  const startOpt = Date.now();

  // Dynamic optimization!
  const schedules = optimizeSchedule(appliances, date, tariff.periods, household);
  
  const optTimeMs = Date.now() - startOpt;

  // Generate comparison schedules
  const baseline = generateBaselineSchedule(appliances, date, tariff.periods);
  const ruleBased = generateRuleBasedSchedule(appliances, date, tariff.periods);

  // Helper to map abstract ScheduleResult to what simulateDay expects
  const mapToSchedule = (s: import("@/lib/optimization/schedulers").ScheduleResult): Schedule => ({
    applianceId: s.applianceId,
    startTime: s.startTime,
    endTime: s.endTime,
    id: "",
    householdId: household.id,
    optimizationId: null,
    status: "scheduled",
    reason: s.explanation,
    reasonCategory: s.reasonCategory ?? null,
    impact: s.impact ?? null,
    affectedMetric: s.affectedMetric ?? null,
    originalStart: s.originalStart ?? null,
    originalEnd: s.originalEnd ?? null,
    estimatedCost: s.cost,
    createdAt: new Date(),
    updatedAt: new Date()
  });

  // Run full simulation for precise full-system metrics
  const simBaseline = simulateDay(date, household, appliances, baseline.map(mapToSchedule));
  const simRuleBased = simulateDay(date, household, appliances, ruleBased.map(mapToSchedule));
  const simOpt = simulateDay(date, household, appliances, schedules.map(mapToSchedule));

  const calculateMetrics = (simResults: SimulationResult[], periods: TariffPeriod[]) => {
    let cost = 0;
    let peak = 0;
    let solarSelfConsum = 0;
    let solarGenTotal = 0;
    let gridImport = 0;

    for (const slot of simResults) {
      if (slot.homeDemandKw > peak) peak = slot.homeDemandKw;
      cost += slot.gridImportKw * 0.25 * getPriceForTime(periods, slot.timestamp);
      solarGenTotal += slot.solarKw * 0.25;
      solarSelfConsum += (slot.solarKw - slot.gridExportKw) * 0.25;
      gridImport += slot.gridImportKw * 0.25;
    }

    return {
      cost,
      peak,
      gridImport,
      solarUtil: solarGenTotal > 0 ? (solarSelfConsum / solarGenTotal) * 100 : 0
    };
  };

  const metricsBaseline = calculateMetrics(simBaseline, tariff.periods);
  const metricsRuleBased = calculateMetrics(simRuleBased, tariff.periods);
  const metricsOpt = calculateMetrics(simOpt, tariff.periods);

  const savings = Math.max(0, metricsBaseline.cost - metricsOpt.cost);

  // Use an interactive transaction to prevent concurrency duplication
  const { run, schedules: persistedSchedules } = await prisma.$transaction(async (tx) => {
    // Lock the household row to serialize concurrent optimization requests
    await tx.$queryRaw`SELECT id FROM "Household" WHERE id = ${household.id} FOR UPDATE`;

    await tx.schedule.deleteMany({
      where: { householdId: household.id, status: "scheduled" }
    });

    const createdRun = await tx.optimizationRun.create({
      data: {
        householdId: household.id,
        horizonHours: 24,
        status: "success",
        mode: household.optimizationMode,
        projectedCost: metricsOpt.cost,
        projectedPeak: metricsOpt.peak,
        savings: savings,
        baselineCost    : metricsBaseline.cost,
        baselinePeak    : metricsBaseline.peak,
        baselineGridImport: metricsBaseline.gridImport,
        baselineSolarUsage: metricsBaseline.solarUtil,
        ruleBasedCost   : metricsRuleBased.cost,
        ruleBasedPeak   : metricsRuleBased.peak,
        ruleBasedGridImport: metricsRuleBased.gridImport,
        ruleBasedSolarUsage: metricsRuleBased.solarUtil,
        gridImport      : metricsOpt.gridImport,
        solarUsage      : metricsOpt.solarUtil,
        runtimeMs       : optTimeMs,
        explanation: `Dynamic Optimization completed in ${optTimeMs}ms. Analyzed ${appliances.length} appliances considering full system limits.`
      }
    });

    const createdSchedules = [];
    for (const s of schedules) {
      const persisted = await tx.schedule.create({
        data: {
          householdId: household.id,
          applianceId: s.applianceId,
          optimizationId: createdRun.id,
          startTime: s.startTime,
          endTime: s.endTime,
          estimatedCost: s.cost,
          reason: s.explanation,
          reasonCategory: s.reasonCategory,
          impact: s.impact,
          affectedMetric: s.affectedMetric,
          originalStart: s.originalStart,
          originalEnd: s.originalEnd,
          status: "scheduled"
        }
      });
      createdSchedules.push(persisted);
    }

    return { run: createdRun, schedules: createdSchedules };
  }, {
    maxWait: 5000,
    timeout: 20000
  });

  return { run, schedules: persistedSchedules };
}
