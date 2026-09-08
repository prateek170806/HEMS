import { PrismaClient } from "@prisma/client";
import { executeOptimizationRun } from "../src/lib/optimization/execute";

const prisma = new PrismaClient();

async function createAppliances(count: number, householdId: string) {
  // Clear existing
  await prisma.schedule.deleteMany({ where: { householdId } });
  await prisma.appliance.deleteMany({ where: { householdId } });
  
  const appliances = [];
  for (let i = 0; i < count; i++) {
    appliances.push({
      householdId,
      name: `Test Appliance ${i}`,
      category: "test",
      ratedPower: 1 + (i % 3),
      flexibility: "shiftable",
      minRuntime: 1,
      maxRuntime: 4,
      priority: "medium",
      automationEnabled: true,
      status: "online"
    });
  }
  
  if (count > 0) {
    await prisma.appliance.createMany({ data: appliances });
  }
}

async function runPerformance(applianceCount: number, householdId: string) {
  await createAppliances(applianceCount, householdId);
  
  const start = Date.now();
  const result = await executeOptimizationRun();
  const totalMs = Date.now() - start;
  
  console.log(`\n--- Performance for ${applianceCount} appliances ---`);
  console.log(`Solver runtime (reported): ${result.run.runtimeMs}ms`);
  console.log(`Total execution time (including DB I/O): ${totalMs}ms`);
}

async function main() {
  const household = await prisma.household.findFirst();
  if (!household) return;

  // Save the old appliances to restore later
  const originalAppliances = await prisma.appliance.findMany({ where: { householdId: household.id } });

  console.log("Starting performance benchmark...");

  await runPerformance(0, household.id);
  await runPerformance(1, household.id);
  await runPerformance(5, household.id);
  await runPerformance(10, household.id);
  await runPerformance(20, household.id);

  // Restore
  await prisma.appliance.deleteMany({ where: { householdId: household.id } });
  if (originalAppliances.length > 0) {
    await prisma.appliance.createMany({
      data: originalAppliances.map(a => ({
        householdId: household.id,
        name: a.name,
        category: a.category,
        ratedPower: a.ratedPower,
        flexibility: a.flexibility,
        minRuntime: a.minRuntime,
        maxRuntime: a.maxRuntime,
        earliestStart: a.earliestStart,
        latestFinish: a.latestFinish,
        priority: a.priority,
        automationEnabled: a.automationEnabled,
        status: a.status
      }))
    });
  }
  
  console.log("\nPerformance testing complete. Original state restored.");
}

main().catch(console.error).finally(() => prisma.$disconnect());
