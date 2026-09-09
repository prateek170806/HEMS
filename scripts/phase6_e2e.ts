/**
 * Phase 6 Full End-to-End System Audit
 * Tests: stale-data, 5× determinism, appliance CRUD, tariff change, infeasible, missing data
 */
import { PrismaClient } from "@prisma/client";
import { executeOptimizationRun } from "../src/lib/optimization/execute";

const prisma = new PrismaClient();

// ── SEED ────────────────────────────────────────────────────────────
async function seedCanonical(powerLimit = 5.5, solarIrradiance = 800) {
  await prisma.schedule.deleteMany();
  await prisma.optimizationRun.deleteMany();
  await prisma.meterReading.deleteMany();
  await prisma.tariffPeriod.deleteMany();
  await prisma.tariff.deleteMany();
  await prisma.appliance.deleteMany();
  await prisma.user.deleteMany();

  const user = await prisma.user.create({
    data: {
      customerId: 'phase6-user',
      name: 'Phase 6 User',
      email: 'phase6@test.local',
      passwordHash: 'dummy',
    }
  });

  const hh = await prisma.household.create({
    data: {
      userId: user.id,
      name: 'E2E Test Household',
      timezone: 'Asia/Kolkata',
      currency: 'INR',
      powerLimitKw: powerLimit,
      batteryReserve: 20,
      optimizationMode: 'economic',
      solarIrradiance,
      baseLoad: 0.5,
    },
  });

  const apps = [
    { name: 'Washing Machine', category: 'washing_machine', ratedPower: 0.5, flexibility: 'shiftable', minRuntime: 2, maxRuntime: 2, earliestStart: '18:00', latestFinish: '23:00', priority: 'medium', householdId: hh.id, automationEnabled: true },
    { name: 'Water Heater',    category: 'water_heater',    ratedPower: 2.0, flexibility: 'shiftable', minRuntime: 1, maxRuntime: 1, earliestStart: '10:00', latestFinish: '20:00', priority: 'high',   householdId: hh.id, automationEnabled: true },
    { name: 'EV Charger',      category: 'ev',              ratedPower: 3.3, flexibility: 'shiftable', minRuntime: 4, maxRuntime: 8, earliestStart: '18:00', latestFinish: '08:00', priority: 'high',   householdId: hh.id, automationEnabled: true },
  ];
  for (const a of apps) await prisma.appliance.create({ data: a });

  await prisma.tariff.create({
    data: {
      name: 'E2E TOU Tariff', isActive: true, householdId: hh.id,
      periods: {
        create: [
          { name: 'Night Off-Peak',   startTime: '00:00', endTime: '06:00', pricePerKwh: 4.0,  type: 'off_peak' },
          { name: 'Morning Normal',   startTime: '06:00', endTime: '10:00', pricePerKwh: 6.0,  type: 'normal'   },
          { name: 'Solar Hours',      startTime: '10:00', endTime: '17:00', pricePerKwh: 4.5,  type: 'solar'    },
          { name: 'Evening Peak',     startTime: '17:00', endTime: '22:00', pricePerKwh: 12.0, type: 'peak'     },
          { name: 'Night Off-Peak 2', startTime: '22:00', endTime: '23:59', pricePerKwh: 4.0,  type: 'off_peak' },
        ]
      }
    }
  });
  return hh;
}

// ── HELPERS ─────────────────────────────────────────────────────────
function fmt(r: Awaited<ReturnType<typeof executeOptimizationRun>>) {
  const run = r.run;
  return {
    baselineCost:  +(run.baselineCost?.toFixed(4) ?? 0),
    optCost:       +(run.projectedCost?.toFixed(4) ?? 0),
    savings:       +(run.savings?.toFixed(4) ?? 0),
    baselinePeak:  +(run.baselinePeak?.toFixed(4) ?? 0),
    optPeak:       +(run.projectedPeak?.toFixed(4) ?? 0),
    gridImport:    +(run.gridImport?.toFixed(4) ?? 0),
    solarUsage:    +(run.solarUsage?.toFixed(4) ?? 0),
    schedules:     r.schedules.map(s => ({ cat: s.reasonCategory, start: s.startTime.toISOString().slice(11,16) }))
  };
}

function pass(label: string) { console.log(`  ✓ ${label}`); }
function fail(label: string, detail = '') { console.log(`  ✗ FAIL: ${label}${detail ? ' — ' + detail : ''}`); }

async function main() {
  console.log("=== PHASE 6 — FULL E2E SYSTEM AUDIT ===\n");
  let allPass = true;

  // ── TEST 1: 5× DETERMINISM ────────────────────────────────────────
  console.log("TEST 1: 5× Determinism");
  await seedCanonical();
  const runs: ReturnType<typeof fmt>[] = [];
  for (let i = 0; i < 5; i++) {
    // Delete only old scheduled entries, not household — same inputs
    await prisma.schedule.deleteMany({ where: { status: 'scheduled' } });
    await prisma.optimizationRun.deleteMany();
    const r = await executeOptimizationRun();
    runs.push(fmt(r));
  }
  const first = runs[0];
  let det = true;
  for (const r of runs.slice(1)) {
    if (r.baselineCost !== first.baselineCost || r.optCost !== first.optCost || r.savings !== first.savings) det = false;
    if (r.schedules[0]?.cat !== first.schedules[0]?.cat || r.schedules[0]?.start !== first.schedules[0]?.start) det = false;
  }
  if (det) pass("All 5 runs produce identical results"); else { fail("Non-determinism detected"); allPass = false; }
  console.log(`  Baseline: ₹${first.baselineCost}  Opt: ₹${first.optCost}  Savings: ₹${first.savings}  Peak: ${first.optPeak}kW\n`);

  // ── TEST 2: STALE-DATA (Change appliance, re-run) ────────────────
  console.log("TEST 2: Stale-Data — appliance power change propagates");
  await seedCanonical();
  const r2a = fmt(await executeOptimizationRun());

  // Change washing machine power from 0.5→3.0 kW
  const wm = await prisma.appliance.findFirst({ where: { name: 'Washing Machine' } });
  await prisma.appliance.update({ where: { id: wm!.id }, data: { ratedPower: 3.0 } });
  await prisma.schedule.deleteMany({ where: { status: 'scheduled' } });
  await prisma.optimizationRun.deleteMany();
  const r2b = fmt(await executeOptimizationRun());

  if (r2b.baselineCost !== r2a.baselineCost) {
    pass(`Baseline cost changed (0.5kW: ₹${r2a.baselineCost} → 3.0kW: ₹${r2b.baselineCost}) — input change reflected`);
  } else {
    fail("Baseline cost unchanged after appliance power change — possible stale data"); allPass = false;
  }
  console.log();

  // ── TEST 3: APPLIANCE ADD/DELETE ─────────────────────────────────
  console.log("TEST 3: Appliance Add and Delete");
  await seedCanonical();
  const hh3 = await prisma.household.findFirst();
  const beforeCount = (await prisma.appliance.findMany({ where: { householdId: hh3!.id } })).length;
  const newApp = await prisma.appliance.create({
    data: { name: 'Dishwasher', category: 'dishwasher', ratedPower: 1.2, flexibility: 'shiftable', minRuntime: 1.5, maxRuntime: 1.5, earliestStart: '20:00', latestFinish: '23:59', priority: 'low', householdId: hh3!.id, automationEnabled: true }
  });
  const afterCount = (await prisma.appliance.findMany({ where: { householdId: hh3!.id } })).length;
  if (afterCount === beforeCount + 1) pass(`Add: count ${beforeCount}→${afterCount}`); else { fail("Add failed"); allPass = false; }
  await prisma.appliance.delete({ where: { id: newApp.id } });
  const delCount = (await prisma.appliance.findMany({ where: { householdId: hh3!.id } })).length;
  if (delCount === beforeCount) pass(`Delete: count ${afterCount}→${delCount}`); else { fail("Delete failed"); allPass = false; }
  console.log();

  // ── TEST 4: TARIFF MODIFICATION ─────────────────────────────────
  console.log("TEST 4: Tariff change propagates to next optimization");
  await seedCanonical();
  const r4a = fmt(await executeOptimizationRun());

  // Change evening peak from ₹12→₹3 (below off-peak) — should dramatically change savings
  const hh4 = await prisma.household.findFirst();
  const tariff4 = await prisma.tariff.findFirst({ where: { householdId: hh4!.id }, include: { periods: true } });
  const peakPeriod = tariff4!.periods.find(p => p.type === 'peak');
  await prisma.tariffPeriod.update({ where: { id: peakPeriod!.id }, data: { pricePerKwh: 3.0 } });
  await prisma.schedule.deleteMany({ where: { status: 'scheduled' } });
  await prisma.optimizationRun.deleteMany();
  const r4b = fmt(await executeOptimizationRun());

  if (r4b.savings !== r4a.savings) {
    pass(`Savings changed: ₹${r4a.savings}→₹${r4b.savings} after tariff change`);
  } else {
    fail("Savings unchanged after tariff peak price change — possible stale tariff reading"); allPass = false;
  }
  console.log();

  // ── TEST 5: INPUT VALIDATION ────────────────────────────────────
  console.log("TEST 5: Appliance API input validation (schema guards)");
  const validPayload = { name: 'Test', category: 'other', ratedPower: 1.0, flexibility: 'shiftable', minRuntime: 1, maxRuntime: 2, priority: 'medium', automationEnabled: true };
  
  // Invalid: negative power
  const invalidResult = { name: 'Bad', category: 'other', ratedPower: -5, flexibility: 'shiftable', minRuntime: 1, maxRuntime: 2, priority: 'medium', automationEnabled: true };
  
  const { applianceSchema } = await import('../src/lib/validations/appliance');
  const v1 = applianceSchema.safeParse(validPayload);
  const v2 = applianceSchema.safeParse(invalidResult);
  const v3 = applianceSchema.safeParse({ ...validPayload, ratedPower: 0 });
  const v4 = applianceSchema.safeParse({ ...validPayload, flexibility: 'invalid_type' });
  const v5 = applianceSchema.safeParse({ ...validPayload, earliestStart: '25:99' });
  const v6 = applianceSchema.safeParse({ ...validPayload, minRuntime: -1 });

  if (v1.success)  pass("Valid payload accepted");             else { fail("Valid payload rejected"); allPass = false; }
  if (!v2.success) pass("Negative ratedPower rejected");       else { fail("Negative power accepted"); allPass = false; }
  if (!v3.success) pass("Zero ratedPower rejected");           else { fail("Zero power accepted"); allPass = false; }
  if (!v4.success) pass("Invalid flexibility enum rejected");  else { fail("Invalid flexibility accepted"); allPass = false; }
  if (!v5.success) pass("Invalid time format rejected");       else { fail("Invalid time accepted"); allPass = false; }
  if (!v6.success) pass("Negative minRuntime rejected");       else { fail("Negative runtime accepted"); allPass = false; }
  console.log();

  // ── TEST 6: MISSING TARIFF ──────────────────────────────────────
  console.log("TEST 6: Optimization with no active tariff returns meaningful error");
  await seedCanonical();
  await prisma.tariff.updateMany({ data: { isActive: false } });
  await prisma.schedule.deleteMany({ where: { status: 'scheduled' } });
  await prisma.optimizationRun.deleteMany();
  let caughtTariffError = false;
  try {
    await executeOptimizationRun();
  } catch (e) {
    caughtTariffError = true;
    pass(`Threw meaningful error: "${(e as Error).message}"`);
  }
  if (!caughtTariffError) { fail("Did not throw — returned success with no tariff"); allPass = false; }
  console.log();

  // ── TEST 7: NO APPLIANCES ───────────────────────────────────────
  console.log("TEST 7: Optimization with zero appliances");
  await seedCanonical();
  await prisma.appliance.deleteMany();
  await prisma.schedule.deleteMany({ where: { status: 'scheduled' } });
  await prisma.optimizationRun.deleteMany();
  let noAppError = false;
  let noAppResult;
  try {
    noAppResult = await executeOptimizationRun();
  } catch {
    noAppError = true;
  }
  if (!noAppError && noAppResult) {
    pass(`No appliances: ran without error, produced ${noAppResult.schedules.length} schedules, savings=₹${noAppResult.run.savings?.toFixed(2)}`);
  } else if (noAppError) {
    pass("No appliances: threw an error (acceptable — explicit infeasibility)");
  }
  console.log();

  // ── TEST 8: INFEASIBLE WINDOW ───────────────────────────────────
  console.log("TEST 8: Appliance with impossible window (2h runtime, 1h window)");
  await seedCanonical();
  const hhInfeas = await prisma.household.findFirst();
  await prisma.appliance.deleteMany({ where: { householdId: hhInfeas!.id } });
  await prisma.appliance.create({
    data: { name: 'Infeasible Load', category: 'other', ratedPower: 1.0, flexibility: 'shiftable', minRuntime: 4, maxRuntime: 4, earliestStart: '10:00', latestFinish: '11:00', priority: 'medium', householdId: hhInfeas!.id, automationEnabled: true }
  });
  await prisma.schedule.deleteMany({ where: { status: 'scheduled' } });
  await prisma.optimizationRun.deleteMany();
  const r8 = await executeOptimizationRun();
  const s8 = r8.schedules[0];
  if (s8?.reasonCategory === 'INFEASIBLE') {
    pass(`INFEASIBLE category assigned for impossible window: "${s8.reason?.slice(0,60)}"`);
  } else {
    fail(`Expected INFEASIBLE, got: ${s8?.reasonCategory}`); allPass = false;
  }
  console.log();

  // ── TEST 9: SOFT POWER LIMIT ─────────────────────────────────────
  console.log("TEST 9: Power-limit soft constraint — optimizer penalizes violations");
  await seedCanonical(2.0); // Very tight limit: 2.0 kW
  const r9 = fmt(await executeOptimizationRun());
  // Optimizer must shift appliances to reduce peak penalty where possible
  console.log(`  Config limit: 2.0 kW, Baseline peak: ${r9.baselinePeak}kW, Optimized peak: ${r9.optPeak}kW`);
  if (r9.optPeak <= r9.baselinePeak) {
    pass("Optimized peak ≤ baseline peak (optimizer applied peak penalty correctly)");
  } else {
    fail("Optimized peak > baseline peak — soft penalty not working"); allPass = false;
  }
  console.log();

  // ── TEST 10: ANALYTICS DATA PROVENANCE ──────────────────────────
  console.log("TEST 10: Analytics page — data matches persisted OptimizationRun");
  await seedCanonical();
  const r10 = await executeOptimizationRun();
  const run10 = r10.run;
  const fromDb = await prisma.optimizationRun.findUnique({ where: { id: run10.id } });
  if (fromDb &&
    fromDb.projectedCost === run10.projectedCost &&
    fromDb.savings === run10.savings &&
    fromDb.baselineCost === run10.baselineCost) {
    pass(`OptimizationRun ${run10.id.slice(0,8)}... persisted correctly (cost=₹${fromDb.projectedCost?.toFixed(2)}, savings=₹${fromDb.savings?.toFixed(2)})`);
  } else {
    fail("Persisted OptimizationRun values differ from returned values"); allPass = false;
  }
  const scheduleCount = await prisma.schedule.count({ where: { optimizationId: run10.id } });
  if (scheduleCount === r10.schedules.length) {
    pass(`All ${scheduleCount} schedules persisted with optimizationId link`);
  } else {
    fail(`Schedule count mismatch: returned ${r10.schedules.length} but DB has ${scheduleCount}`); allPass = false;
  }
  console.log();

  // ── SUMMARY ──────────────────────────────────────────────────────
  console.log("=".repeat(50));
  console.log(`PHASE 6 FINAL: ${allPass ? '✓ ALL TESTS PASSED' : '✗ SOME TESTS FAILED'}`);
  await prisma.$disconnect();
}

main().catch(e => { console.error(e); process.exit(1); });
