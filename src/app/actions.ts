"use server";

import prisma from "@/lib/prisma";
import { optimizeSchedule } from "@/lib/optimization/schedulers";
import { revalidatePath } from "next/cache";
import { startOfDay } from "date-fns";

export async function runOptimizationAction() {
  console.log("Running optimization action...");
  
  // 1. Fetch data
  const household = await prisma.household.findFirst();
  if (!household) throw new Error("No household found");
  
  const appliances = await prisma.appliance.findMany();
  
  const tariff = await prisma.tariff.findFirst({
    where: { householdId: household.id, isActive: true },
    include: { periods: true }
  });
  
  if (!tariff) throw new Error("No active tariff found");

  // 2. Run Optimization algorithm
  const date = startOfDay(new Date());
  const schedules = optimizeSchedule(
    appliances,
    date,
    tariff.periods,
    household.powerLimitKw,
    0.5 // baseLoadKw
  );

  // 3. Save to database
  
  // Create optimization run record
  const run = await prisma.optimizationRun.create({
    data: {
      householdId: household.id,
      horizonHours: 24,
      status: "success",
      mode: household.optimizationMode,
      explanation: `Optimized ${schedules.length} appliances successfully.`
    }
  });

  // Delete future pending schedules (simplified)
  await prisma.schedule.deleteMany({
    where: {
      householdId: household.id,
      status: "scheduled"
    }
  });

  // Insert new schedules
  for (const s of schedules) {
    await prisma.schedule.create({
      data: {
        householdId: household.id,
        applianceId: s.applianceId,
        optimizationId: run.id,
        startTime: s.startTime,
        endTime: s.endTime,
        estimatedCost: s.cost,
        status: "scheduled"
      }
    });
  }

  // 4. Revalidate UI
  revalidatePath("/");
  revalidatePath("/schedules");
  
  return { success: true, count: schedules.length };
}
