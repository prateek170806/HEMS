"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";

import { executeOptimizationRun } from "@/lib/optimization/execute";

export async function runOptimizationAction() {
  console.log("Running optimization action...");
  
  const result = await executeOptimizationRun();

  // 4. Revalidate UI
  revalidatePath("/");
  revalidatePath("/schedules");
  revalidatePath("/analytics");
  revalidatePath("/demo");
  
  return { success: true, count: result.schedules.length };
}

export async function overrideScheduleAction(applianceId: string) {
  const household = await prisma.household.findFirst();
  if (!household) throw new Error("No household found");

  const appliance = await prisma.appliance.findUnique({
    where: { id: applianceId }
  });
  if (!appliance) throw new Error("Appliance not found");

  // Delete any existing future schedule for this appliance
  await prisma.schedule.deleteMany({
    where: {
      householdId: household.id,
      applianceId: appliance.id,
      status: "scheduled"
    }
  });

  const now = new Date();
  const endTime = new Date(now.getTime() + appliance.minRuntime * 3600 * 1000);

  // Insert overridden schedule
  await prisma.schedule.create({
    data: {
      householdId: household.id,
      applianceId: appliance.id,
      startTime: now,
      endTime: endTime,
      status: "overridden",
      reason: "Manual user override: Forced immediate execution.",
    }
  });

  revalidatePath("/");
  revalidatePath("/appliances");
  revalidatePath("/analytics");
  
  return { success: true };
}

export async function resetDemoStateAction() {
  console.log("Running demo scenario reset...");

  // NOTE: This is a single-tenant application. There is exactly one household per
  // deployment. The deleteMany() calls below wipe ALL data intentionally — this is
  // a full demo reset, not a per-household filter. Calling this will destroy the
  // current household configuration and replace it with the canonical demo scenario.
  // Do NOT call this in a multi-tenant deployment without adding householdId filters.

  // Clean up — intentional full reset for single-tenant demo deployment
  await prisma.schedule.deleteMany();
  await prisma.optimizationRun.deleteMany();
  await prisma.meterReading.deleteMany();
  await prisma.tariffPeriod.deleteMany();
  await prisma.tariff.deleteMany();
  await prisma.appliance.deleteMany();
  await prisma.household.deleteMany();

  // Create Household
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

  // Create Appliances
  const appliances = [
    {
      name: 'Washing Machine',
      category: 'washing_machine',
      ratedPower: 0.5,
      flexibility: 'shiftable',
      minRuntime: 2,
      maxRuntime: 2,
      earliestStart: '18:00',
      latestFinish: '23:00',
      priority: 'medium',
      householdId: household.id,
      automationEnabled: true,
    },
    {
      name: 'Water Heater',
      category: 'water_heater',
      ratedPower: 2.0,
      flexibility: 'shiftable',
      minRuntime: 1,
      maxRuntime: 1,
      earliestStart: '10:00',
      latestFinish: '20:00',
      priority: 'high',
      householdId: household.id,
      automationEnabled: true,
    },
    {
      name: 'EV Charger',
      category: 'ev',
      ratedPower: 3.3,
      flexibility: 'shiftable',
      minRuntime: 4,
      maxRuntime: 8,
      earliestStart: '18:00',
      latestFinish: '08:00',
      priority: 'high',
      householdId: household.id,
      automationEnabled: true,
    }
  ];

  for (const app of appliances) {
    await prisma.appliance.create({ data: app });
  }

  // Create Tariff
  await prisma.tariff.create({
    data: {
      name: 'Demo TOU Tariff',
      isActive: true,
      householdId: household.id,
      periods: {
        create: [
          { name: 'Night Off-Peak', startTime: '00:00', endTime: '06:00', pricePerKwh: 4.0, type: 'off_peak' },
          { name: 'Morning Normal', startTime: '06:00', endTime: '10:00', pricePerKwh: 6.0, type: 'normal' },
          { name: 'Solar Hours', startTime: '10:00', endTime: '17:00', pricePerKwh: 4.5, type: 'solar' },
          { name: 'Evening Peak', startTime: '17:00', endTime: '22:00', pricePerKwh: 12.0, type: 'peak' },
          { name: 'Night Off-Peak 2', startTime: '22:00', endTime: '23:59', pricePerKwh: 4.0, type: 'off_peak' },
        ]
      }
    }
  });

  revalidatePath("/");
  revalidatePath("/appliances");
  revalidatePath("/analytics");
  revalidatePath("/schedules");
  revalidatePath("/demo");
  
  return { success: true };
}

export async function updateSimulationStateAction(data: {
  solarIrradiance?: number;
  baseLoad?: number;
  forecastError?: number;
  smartMeterOffline?: boolean;
  evDisconnected?: boolean;
  inverterFault?: boolean;
}) {
  const household = await prisma.household.findFirst();
  if (!household) throw new Error("No household found");

  await prisma.household.update({
    where: { id: household.id },
    data,
  });

  revalidatePath("/");
  revalidatePath("/simulation");
  revalidatePath("/analytics");
  
  return { success: true };
}

