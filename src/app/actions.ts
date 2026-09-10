"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";

import { executeOptimizationRun } from "@/lib/optimization/execute";
import { getCurrentHousehold, getCurrentUser } from "@/lib/server/auth";
import { z } from "zod";

export async function runOptimizationAction() {
  try {
    const result = await executeOptimizationRun();

    // Revalidate UI
    revalidatePath("/");
    revalidatePath("/schedules");
    revalidatePath("/analytics");
    revalidatePath("/demo");
    revalidatePath("/optimization/settings");
    
    return { success: true, count: result.schedules.length };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Optimization failed";
    return { error: message };
  }
}

export async function overrideScheduleAction(applianceId: string) {
  const household = await getCurrentHousehold();
  if (!household) throw new Error("No household found");

  const appliance = await prisma.appliance.findFirst({
    where: { id: applianceId, householdId: household.id }
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

  const user = await getCurrentUser();
  if (!user || user.email !== "demo@wattwise.local") {
     throw new Error("Demo reset is only available for the authorized Demo account.");
  }

  const household = await prisma.household.findFirst({ where: { userId: user.id } });
  if (!household) throw new Error("No household found for demo account");

  // Safely delete ONLY data belonging to THIS household
  await prisma.schedule.deleteMany({ where: { householdId: household.id } });
  await prisma.optimizationRun.deleteMany({ where: { householdId: household.id } });
  await prisma.meterReading.deleteMany({ where: { householdId: household.id } });
  await prisma.notification.deleteMany({ where: { householdId: household.id } });
  
  const tariffs = await prisma.tariff.findMany({ where: { householdId: household.id } });
  const tariffIds = tariffs.map(t => t.id);
  await prisma.tariffPeriod.deleteMany({ where: { tariffId: { in: tariffIds } } });
  await prisma.tariff.deleteMany({ where: { householdId: household.id } });
  await prisma.appliance.deleteMany({ where: { householdId: household.id } });

  // Update Household back to canonical demo state
  await prisma.household.update({
    where: { id: household.id },
    data: {
      name: 'Green Valley Residence',
      timezone: 'Asia/Kolkata',
      currency: 'INR',
      powerLimitKw: 5.5,
      batteryReserve: 20,
      optimizationMode: 'economic',
      solarIrradiance: 50,
      baseLoad: 10,
      simulationStatus: 'LIVE',
      simulationSpeed: 1,
      simulationTime: new Date(),
      simulationLastTick: new Date(),
      currentBatterySoc: 20
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

const updateSimulationStateSchema = z.object({
  solarIrradiance: z.number().optional(),
  baseLoad: z.number().optional(),
  forecastError: z.number().optional(),
  smartMeterOffline: z.boolean().optional(),
  evDisconnected: z.boolean().optional(),
  inverterFault: z.boolean().optional(),
}).strict();

export async function updateSimulationStateAction(data: {
  solarIrradiance?: number;
  baseLoad?: number;
  forecastError?: number;
  smartMeterOffline?: boolean;
  evDisconnected?: boolean;
  inverterFault?: boolean;
}) {
  const household = await getCurrentHousehold();
  if (!household) throw new Error("No household found");

  const parsed = updateSimulationStateSchema.safeParse(data);
  if (!parsed.success) {
    throw new Error("Invalid simulation state data");
  }

  await prisma.household.update({
    where: { id: household.id },
    data: parsed.data,
  });

  revalidatePath("/");
  revalidatePath("/simulation");
  revalidatePath("/analytics");
  
  return { success: true };
}

export async function getNotificationsAction() {
  const household = await getCurrentHousehold();
  if (!household) return [];
  
  return await prisma.notification.findMany({
    where: { householdId: household.id },
    orderBy: { timestamp: "desc" },
    take: 10,
  });
}

export async function markNotificationReadAction(notificationId: string) {
  const household = await getCurrentHousehold();
  if (!household) throw new Error("No household found");
  
  await prisma.notification.update({
    where: { id: notificationId, householdId: household.id },
    data: { isRead: true },
  });
  
  revalidatePath("/");
  revalidatePath("/notifications");
  return { success: true };
}

export async function markAllNotificationsReadAction() {
  const household = await getCurrentHousehold();
  if (!household) throw new Error("No household found");
  
  await prisma.notification.updateMany({
    where: { householdId: household.id, isRead: false },
    data: { isRead: true },
  });
  
  revalidatePath("/");
  revalidatePath("/notifications");
  return { success: true };
}
