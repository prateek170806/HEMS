import { PrismaClient } from "@prisma/client";
import { executeOptimizationRun } from "../src/lib/optimization/execute";

const prisma = new PrismaClient();

async function runConcurrency(count: number) {
  // Determine expected schedule count by running one single optimization first
  const singleResult = await executeOptimizationRun();
  const expectedCount = singleResult.schedules.length;

  console.log(`\n--- Running ${count} Concurrent Optimizations ---`);
  
  const promises = [];
  for (let i = 0; i < count; i++) {
    promises.push(
      executeOptimizationRun().catch(e => {
        return { error: true, message: e.message };
      })
    );
  }

  const results = await Promise.all(promises);
  
  let successes = 0;
  let errors = 0;

  for (const r of results) {
    if ('error' in r) {
      errors++;
      console.log("Error:", r.message);
    } else {
      successes++;
    }
  }

  console.log(`Total Requests: ${count} | Successes: ${successes} | Errors: ${errors}`);

  // Check the DB for duplicated schedules
  const household = await prisma.household.findFirst();
  if (household) {
    const activeSchedules = await prisma.schedule.count({
      where: { householdId: household.id, status: "scheduled" }
    });
    
    console.log(`Expected scheduled slots: ${expectedCount}, Found slots: ${activeSchedules}`);
    if (activeSchedules !== expectedCount) {
      console.error(`❌ CONCURRENCY RACE CONDITION DETECTED! Expected ${expectedCount} schedules, found ${activeSchedules}`);
      process.exit(1);
    } else {
      console.log(`✅ Concurrency handled correctly.`);
    }
  }
}

async function main() {
  await runConcurrency(2);
  await runConcurrency(5);
  await runConcurrency(10);
  console.log("\nConcurrency tests complete.");
}

main().catch(console.error).finally(() => prisma.$disconnect());
