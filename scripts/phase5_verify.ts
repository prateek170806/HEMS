/**
 * Phase 5 Determinism + Authenticity Test
 * Runs the full optimization pipeline twice from a fresh demo seed
 * and compares results to prove determinism.
 */
import { PrismaClient } from "@prisma/client";
import { executeOptimizationRun } from "../src/lib/optimization/execute";

const prisma = new PrismaClient();

async function seedDemoData() {
  // Exact mirror of resetDemoStateAction in actions.ts
  await prisma.schedule.deleteMany();
  await prisma.optimizationRun.deleteMany();
  await prisma.meterReading.deleteMany();
  await prisma.tariffPeriod.deleteMany();
  await prisma.tariff.deleteMany();
  await prisma.appliance.deleteMany();
  await prisma.household.deleteMany();

  const household = await prisma.household.create({
    data: {
      name: 'Green Valley Residence',
      timezone: 'Asia/Kolkata',
      currency: 'INR',
      powerLimitKw: 5.5,
      batteryReserve: 20,
      optimizationMode: 'economic',
      solarIrradiance: 800,
      baseLoad: 0.5,
    },
  });

  const applianceData = [
    { name: 'Washing Machine', category: 'washing_machine', ratedPower: 0.5, flexibility: 'shiftable', minRuntime: 2, maxRuntime: 2, earliestStart: '18:00', latestFinish: '23:00', priority: 'medium', householdId: household.id, automationEnabled: true },
    { name: 'Water Heater', category: 'water_heater', ratedPower: 2.0, flexibility: 'shiftable', minRuntime: 1, maxRuntime: 1, earliestStart: '10:00', latestFinish: '20:00', priority: 'high', householdId: household.id, automationEnabled: true },
    { name: 'EV Charger', category: 'ev', ratedPower: 3.3, flexibility: 'shiftable', minRuntime: 4, maxRuntime: 8, earliestStart: '18:00', latestFinish: '08:00', priority: 'high', householdId: household.id, automationEnabled: true },
  ];
  for (const app of applianceData) {
    await prisma.appliance.create({ data: app });
  }

  await prisma.tariff.create({
    data: {
      name: 'Demo TOU Tariff',
      isActive: true,
      householdId: household.id,
      periods: {
        create: [
          { name: 'Night Off-Peak',  startTime: '00:00', endTime: '06:00', pricePerKwh: 4.0, type: 'off_peak' },
          { name: 'Morning Normal',  startTime: '06:00', endTime: '10:00', pricePerKwh: 6.0, type: 'normal'   },
          { name: 'Solar Hours',     startTime: '10:00', endTime: '17:00', pricePerKwh: 4.5, type: 'solar'    },
          { name: 'Evening Peak',    startTime: '17:00', endTime: '22:00', pricePerKwh: 12.0, type: 'peak'    },
          { name: 'Night Off-Peak 2',startTime: '22:00', endTime: '23:59', pricePerKwh: 4.0, type: 'off_peak' },
        ]
      }
    }
  });

  console.log(`✓ Demo seeded: household=${household.id}`);
  return household;
}

async function runOnce(label: string) {
  const result = await executeOptimizationRun();
  const run = result.run;
  const schedules = result.schedules;

  console.log(`\n=== ${label} ===`);
  console.log(`Status:         ${run.status}`);
  console.log(`Mode:           ${run.mode}`);
  console.log(`runtimeMs:      ${run.runtimeMs}ms`);
  console.log(`Baseline Cost:  ₹${run.baselineCost?.toFixed(4)}`);
  console.log(`Baseline Peak:  ${run.baselinePeak?.toFixed(4)} kW`);
  console.log(`Opt Cost:       ₹${run.projectedCost?.toFixed(4)}`);
  console.log(`Opt Peak:       ${run.projectedPeak?.toFixed(4)} kW`);
  console.log(`Savings:        ₹${run.savings?.toFixed(4)}`);
  console.log(`Grid Import:    ${run.gridImport?.toFixed(4)} kWh`);
  console.log(`Solar Util:     ${run.solarUsage?.toFixed(4)}%`);
  console.log(`Baseline Grid:  ${run.baselineGridImport?.toFixed(4)} kWh`);
  console.log(`Baseline Solar: ${run.baselineSolarUsage?.toFixed(4)}%`);
  console.log(`\nDecision Log:`);
  for (const s of schedules) {
    console.log(`  [${s.reasonCategory}] ${s.startTime.toISOString().slice(11,16)}-${s.endTime.toISOString().slice(11,16)} | Impact: ${s.impact} | ${s.reason?.slice(0,80)}`);
  }

  return {
    baselineCost: run.baselineCost,
    baselinePeak: run.baselinePeak,
    projectedCost: run.projectedCost,
    projectedPeak: run.projectedPeak,
    savings: run.savings,
    gridImport: run.gridImport,
    solarUsage: run.solarUsage,
    schedules: schedules.map(s => ({
      reasonCategory: s.reasonCategory,
      start: s.startTime.toISOString().slice(11,16),
      end: s.endTime.toISOString().slice(11,16),
      impact: s.impact,
    }))
  };
}

async function main() {
  console.log("=== PHASE 5 AUTHENTICITY & DETERMINISM TEST ===\n");

  // RUN 1
  console.log("→ Seeding demo data (Run 1)...");
  await seedDemoData();
  const r1 = await runOnce("RUN 1");

  // RUN 2 — same seed, fresh run
  console.log("\n→ Seeding demo data (Run 2)...");
  await seedDemoData();
  const r2 = await runOnce("RUN 2");

  // COMPARE
  console.log("\n=== DETERMINISM COMPARISON ===");
  const fields: (keyof typeof r1)[] = ['baselineCost','baselinePeak','projectedCost','projectedPeak','savings','gridImport','solarUsage'];
  let allMatch = true;
  for (const f of fields) {
    const v1 = r1[f] as number;
    const v2 = r2[f] as number;
    const match = Math.abs(v1 - v2) < 0.0001;
    if (!match) allMatch = false;
    console.log(`${f.padEnd(18)}: Run1=${v1?.toFixed(4)}  Run2=${v2?.toFixed(4)}  ${match ? '✓ MATCH' : '✗ DIFFER'}`);
  }

  console.log("\nSchedule decision categories:");
  for (let i = 0; i < Math.max(r1.schedules.length, r2.schedules.length); i++) {
    const s1 = r1.schedules[i];
    const s2 = r2.schedules[i];
    const match = s1?.reasonCategory === s2?.reasonCategory && s1?.start === s2?.start;
    if (!match) allMatch = false;
    console.log(`  Slot ${i+1}: Run1=[${s1?.reasonCategory} @ ${s1?.start}]  Run2=[${s2?.reasonCategory} @ ${s2?.start}]  ${match ? '✓' : '✗ DIFFER'}`);
  }

  console.log(`\nFINAL: ${allMatch ? '✓ DETERMINISTIC' : '✗ NON-DETERMINISTIC — results differ!'}`);

  await prisma.$disconnect();
}

main().catch(e => { console.error(e); process.exit(1); });
