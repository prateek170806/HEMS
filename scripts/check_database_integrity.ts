import { prisma } from '../src/lib/server/db';

async function checkDatabaseIntegrity() {
  console.log('=== CHECKING DATABASE FOR ORPHAN RECORDS ===');

  const users = await prisma.user.findMany();
  const userIds = new Set(users.map(u => u.id));

  const households = await prisma.household.findMany();
  const householdIds = new Set(households.map(h => h.id));

  const appliances = await prisma.appliance.findMany();
  const applianceIds = new Set(appliances.map(a => a.id));

  const tariffs = await prisma.tariff.findMany();
  const tariffIds = new Set(tariffs.map(t => t.id));

  const tariffPeriods = await prisma.tariffPeriod.findMany();
  const meterReadings = await prisma.meterReading.findMany();
  const notifications = await prisma.notification.findMany();
  const optimizationRuns = await prisma.optimizationRun.findMany();
  const optRunIds = new Set(optimizationRuns.map(o => o.id));
  const schedules = await prisma.schedule.findMany();

  console.log('Counts:', {
    users: users.length,
    households: households.length,
    appliances: appliances.length,
    tariffs: tariffs.length,
    tariffPeriods: tariffPeriods.length,
    meterReadings: meterReadings.length,
    notifications: notifications.length,
    optimizationRuns: optimizationRuns.length,
    schedules: schedules.length
  });

  const orphanHouseholds = households.filter(h => !userIdIds(h.userId, userIds));
  const orphanAppliances = appliances.filter(a => !householdIds.has(a.householdId));
  const orphanTariffs = tariffs.filter(t => !householdIds.has(t.householdId));
  const orphanTariffPeriods = tariffPeriods.filter(tp => !tariffIds.has(tp.tariffId));
  const orphanMeterReadings = meterReadings.filter(mr => !householdIds.has(mr.householdId));
  const orphanNotifications = notifications.filter(n => !householdIds.has(n.householdId));
  const orphanOptimizationRuns = optimizationRuns.filter(o => !householdIds.has(o.householdId));
  const orphanSchedulesHousehold = schedules.filter(s => !householdIds.has(s.householdId));
  const orphanSchedulesAppliance = schedules.filter(s => !applianceIds.has(s.applianceId));

  function userIdIds(id: string, set: Set<string>) { return set.has(id); }

  console.log('Orphan Audit:', {
    orphanHouseholds: orphanHouseholds.length,
    orphanAppliances: orphanAppliances.length,
    orphanTariffs: orphanTariffs.length,
    orphanTariffPeriods: orphanTariffPeriods.length,
    orphanMeterReadings: orphanMeterReadings.length,
    orphanNotifications: orphanNotifications.length,
    orphanOptimizationRuns: orphanOptimizationRuns.length,
    orphanSchedulesHousehold: orphanSchedulesHousehold.length,
    orphanSchedulesAppliance: orphanSchedulesAppliance.length
  });
}

checkDatabaseIntegrity().catch(console.error).finally(() => prisma.$disconnect());
