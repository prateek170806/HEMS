import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function runOpt() {
  const res = await fetch('http://localhost:3000/api/optimization/run', { method: 'POST' });
  const data = await res.json();
  const run = await prisma.optimizationRun.findUnique({
    where: { id: data.runId },
    include: { schedules: { include: { appliance: true } } }
  });
  if (!run) throw new Error("Optimization Run not found");
  return run;
}

async function getHousehold() {
  return await prisma.household.findFirst();
}

async function runTests() {
  const hh = await getHousehold();
  if (!hh) throw new Error("Household not found");

  console.log("=== PHASE 1: POWER LIMIT AUDIT ===");

  // Setup: Multi-appliance scenario that easily exceeds limits
  await prisma.appliance.updateMany({
    where: { name: 'Water Heater' },
    data: { ratedPower: 2.0, minRuntime: 2, earliestStart: '10:00', latestFinish: '15:00' }
  });
  await prisma.appliance.updateMany({
    where: { name: 'Washing Machine' },
    data: { ratedPower: 1.5, minRuntime: 2, earliestStart: '10:00', latestFinish: '15:00' }
  });
  await prisma.appliance.updateMany({
    where: { name: 'EV Charger' },
    data: { ratedPower: 3.3, minRuntime: 4, earliestStart: '18:00', latestFinish: '08:00' }
  });

  const limits = [1.5, 2.0, 3.0, 10.0];
  
  for (const limit of limits) {
    await prisma.household.update({
      where: { id: hh.id },
      data: { powerLimitKw: limit }
    });
    
    const run = await runOpt();
    console.log(`\nConfigured Limit: ${limit} kW`);
    console.log(`Baseline Peak: ${run.baselinePeak} kW`);
    console.log(`Optimized Peak: ${run.projectedPeak} kW`);
    console.log(`Constraint Satisfied: ${run.projectedPeak! <= limit ? 'YES' : 'NO'}`);
    console.log(`Cost: ${run.projectedCost}, Grid Import: ${run.gridImport}`);
  }

  // Infeasible Scenario: Limit 1.0, required load is 2.0+1.5 = 3.5, window is so narrow they must overlap
  console.log("\n--- INFEASIBLE SCENARIO ---");
  await prisma.household.update({
    where: { id: hh.id },
    data: { powerLimitKw: 1.0 }
  });
  await prisma.appliance.updateMany({
    where: { name: 'Water Heater' },
    data: { ratedPower: 2.0, minRuntime: 2, earliestStart: '10:00', latestFinish: '12:00' }
  });
  await prisma.appliance.updateMany({
    where: { name: 'Washing Machine' },
    data: { ratedPower: 1.5, minRuntime: 2, earliestStart: '10:00', latestFinish: '12:00' }
  });
  
  const infeasibleRun = await runOpt();
  console.log(`Limit: 1.0 kW`);
  console.log(`Optimized Peak: ${infeasibleRun.projectedPeak} kW`);
  console.log(`Constraint Satisfied: NO (EXPECTED)`);
  
  // Clean up
  await prisma.household.update({
    where: { id: hh.id },
    data: { powerLimitKw: 5.5 }
  });

  console.log("\n=== TEST COMPLETE ===");
}

runTests().catch(console.error);
