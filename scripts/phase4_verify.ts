import { Appliance, Household } from "@prisma/client";
import { optimizeSchedule } from "../src/lib/optimization/schedulers";

async function runTests() {
  console.log("=== PHASE 4 VERIFICATION TEST SCENARIOS ===");

  const date = new Date("2026-09-08T00:00:00Z");

  const household = {
    id: "test-hh",
    name: "Test",
    timezone: "Asia/Kolkata",
    currency: "INR",
    powerLimitKw: 5.5,
    batteryReserve: 20,
    optimizationMode: "economic",
    solarIrradiance: 800,
    baseLoad: 0.5,
    forecastError: 0,
    inverterFault: false,
    evDisconnected: false,
    smartMeterOffline: false,
    createdAt: new Date(),
    updatedAt: new Date()
  } as Household;

  const periods = [
    { id: "1", tariffId: "1", name: 'Night Off-Peak', startTime: '00:00', endTime: '06:00', pricePerKwh: 4.0, type: 'off_peak', createdAt: new Date(), updatedAt: new Date() },
    { id: "2", tariffId: "1", name: 'Morning Normal', startTime: '06:00', endTime: '10:00', pricePerKwh: 6.0, type: 'normal', createdAt: new Date(), updatedAt: new Date() },
    { id: "3", tariffId: "1", name: 'Solar Hours', startTime: '10:00', endTime: '17:00', pricePerKwh: 4.5, type: 'solar', createdAt: new Date(), updatedAt: new Date() },
    { id: "4", tariffId: "1", name: 'Evening Peak', startTime: '17:00', endTime: '22:00', pricePerKwh: 12.0, type: 'peak', createdAt: new Date(), updatedAt: new Date() },
    { id: "5", tariffId: "1", name: 'Night Off-Peak 2', startTime: '22:00', endTime: '23:59', pricePerKwh: 4.0, type: 'off_peak', createdAt: new Date(), updatedAt: new Date() },
  ];

  const runScenario = (name: string, hhOverrides: Partial<Household>, apps: Partial<Appliance>[]) => {
    console.log(`\n--- Scenario: ${name} ---`);
    const hh = { ...household, ...hhOverrides };
    const appliances = apps.map((a, i) => ({
      id: `app-${i}`,
      householdId: hh.id,
      name: a.name || "Test App",
      category: a.category || "other",
      ratedPower: a.ratedPower || 1.0,
      status: "offline",
      flexibility: a.flexibility || "shiftable",
      minRuntime: a.minRuntime || 1,
      maxRuntime: a.maxRuntime || 1,
      earliestStart: a.earliestStart || "00:00",
      latestFinish: a.latestFinish || "23:59",
      priority: "medium",
      automationEnabled: true,
      createdAt: new Date(),
      updatedAt: new Date(),
      ...a
    })) as Appliance[];

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const results = optimizeSchedule(appliances, date, periods, hh as any);
    
    for (const r of results) {
      console.log(`Appliance: ${appliances.find(a => a.id === r.applianceId)?.name}`);
      console.log(`Baseline Slot: ${r.originalStart?.toLocaleTimeString('en-US', { hour12: false, timeZone: 'UTC' })} - ${r.originalEnd?.toLocaleTimeString('en-US', { hour12: false, timeZone: 'UTC' })}`);
      console.log(`Optimized Slot: ${r.startTime.toLocaleTimeString('en-US', { hour12: false, timeZone: 'UTC' })} - ${r.endTime.toLocaleTimeString('en-US', { hour12: false, timeZone: 'UTC' })}`);
      console.log(`Category: ${r.reasonCategory}`);
      console.log(`Impact: ${r.impact}`);
      console.log(`Explanation: ${r.explanation}`);
    }
  };

  runScenario("A. Tariff-driven shift", {}, [{
    name: "EV Charger",
    category: "ev",
    ratedPower: 3.3,
    minRuntime: 4,
    earliestStart: "17:00",
    latestFinish: "08:00"
  }]);

  runScenario("B. Solar-driven shift", { solarIrradiance: 1000 }, [{
    name: "Washing Machine",
    category: "washing_machine",
    ratedPower: 1.0,
    minRuntime: 2,
    earliestStart: "06:00",
    latestFinish: "16:00"
  }]);

  runScenario("C. Peak/power-limit-driven shift", { powerLimitKw: 3.5, baseLoad: 20 }, [
    { name: "Fixed Heater", ratedPower: 2.0, minRuntime: 2, earliestStart: "12:00", latestFinish: "14:00", flexibility: "critical" },
    { name: "Flexible Load", ratedPower: 1.0, minRuntime: 2, earliestStart: "12:00", latestFinish: "18:00", flexibility: "shiftable" }
  ]);

  runScenario("D. No-shift case", {}, [{
    name: "Night Load",
    ratedPower: 1.0,
    minRuntime: 2,
    earliestStart: "02:00",
    latestFinish: "05:00"
  }]);

  runScenario("E. EV disconnected", { evDisconnected: true }, [{
    name: "EV Charger",
    category: "ev",
    ratedPower: 3.3,
    minRuntime: 4,
    earliestStart: "17:00",
    latestFinish: "08:00"
  }]);

  runScenario("F. Impossible runtime window", {}, [{
    name: "Impossible Load",
    ratedPower: 1.0,
    minRuntime: 4,
    earliestStart: "10:00",
    latestFinish: "12:00"
  }]);
}

runTests().catch(console.error);
