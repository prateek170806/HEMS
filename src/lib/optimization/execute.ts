import { prisma } from "@/lib/server/db";
import { optimizeSchedule, generateBaselineSchedule } from "@/lib/optimization/schedulers";
import { startOfDay } from "date-fns";

export async function executeOptimizationRun() {
  const household = await prisma.household.findFirst();
  if (!household) throw new Error("Household not found");

  const appliances = await prisma.appliance.findMany({ where: { householdId: household.id } });
  const tariff = await prisma.tariff.findFirst({
    where: { householdId: household.id, isActive: true },
    include: { periods: true }
  });
  if (!tariff) throw new Error("Active tariff not found");

  const date = startOfDay(new Date());

  // Dynamic optimization!
  const schedules = optimizeSchedule(appliances, date, tariff.periods, household);

  // Baseline for comparison (Cost savings calculation)
  const baseline = generateBaselineSchedule(appliances, date, tariff.periods);
  const baselineCost = baseline.reduce((sum, s) => sum + s.cost, 0);
  const optimizedCost = schedules.reduce((sum, s) => sum + s.cost, 0);
  const savings = Math.max(0, baselineCost - optimizedCost);

  // Clean up pending schedules
  await prisma.schedule.deleteMany({
    where: { householdId: household.id, status: "scheduled" }
  });

  const run = await prisma.optimizationRun.create({
    data: {
      householdId: household.id,
      horizonHours: 24,
      status: "success",
      mode: household.optimizationMode,
      projectedCost: optimizedCost,
      savings: savings,
      explanation: `Dynamic Optimization completed. Analyzed ${appliances.length} appliances considering solar and household limits.`
    }
  });

  const persistedSchedules = [];
  for (const s of schedules) {
    const persisted = await prisma.schedule.create({
      data: {
        householdId: household.id,
        applianceId: s.applianceId,
        optimizationId: run.id,
        startTime: s.startTime,
        endTime: s.endTime,
        estimatedCost: s.cost,
        reason: s.explanation,
        status: "scheduled"
      }
    });
    persistedSchedules.push(persisted);
  }

  return { run, schedules: persistedSchedules };
}
