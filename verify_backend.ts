import { prisma } from './src/lib/server/db';
import { executeOptimizationRun } from './src/lib/optimization/execute';
import { simulateDay } from './src/lib/simulation/engine';
import { startOfDay } from 'date-fns';

async function verify() {
  console.log('--- START VERIFICATION ---');

  const household = await prisma.household.findFirst();
  if (!household) throw new Error('No household');

  // Test Settings Persistence & Optimization Link
  console.log('Original Power Limit:', household.powerLimitKw);
  console.log('Original Opt Mode:', household.optimizationMode);

  await prisma.household.update({
    where: { id: household.id },
    data: { powerLimitKw: 4.0, optimizationMode: 'economic' }
  });

  let runResult = await executeOptimizationRun();
  console.log('Run 1 Mode:', runResult.run.mode);
  
  await prisma.household.update({
    where: { id: household.id },
    data: { optimizationMode: 'comfort', batteryReserve: 50 }
  });

  runResult = await executeOptimizationRun();
  console.log('Run 2 Mode:', runResult.run.mode);
  
  const updatedHousehold = await prisma.household.findFirst();
  console.log('Updated Power Limit:', updatedHousehold?.powerLimitKw);
  console.log('Updated Reserve:', updatedHousehold?.batteryReserve);

  // Test Live Energy Dynamic Response
  const appliances = await prisma.appliance.findMany({ where: { householdId: household.id } });
  const schedules = await prisma.schedule.findMany({ where: { householdId: household.id } });
  
  const sim1 = simulateDay(startOfDay(new Date()), updatedHousehold!, appliances, schedules);
  const homeDemand1 = sim1[12].homeDemandKw; // 03:00 slot
  
  // Change an appliance power
  const washer = appliances.find(a => a.category === 'washing_machine');
  if (washer) {
    await prisma.appliance.update({
      where: { id: washer.id },
      data: { ratedPower: washer.ratedPower + 2.0 }
    });
  }

  const newAppliances = await prisma.appliance.findMany({ where: { householdId: household.id } });
  const sim2 = simulateDay(startOfDay(new Date()), updatedHousehold!, newAppliances, schedules);
  const homeDemand2 = sim2[12].homeDemandKw;

  console.log(`Live Demand 1 (Slot 12): ${homeDemand1}`);
  console.log(`Live Demand 2 (Slot 12): ${homeDemand2}`);

  // Trigger Notification Event
  const notif = await prisma.notification.create({
    data: {
      householdId: household.id,
      type: 'alert',
      message: 'Inverter Communication Failure',
      isRead: false
    }
  });
  console.log(`Notification created: ${notif.id}, read: ${notif.isRead}`);
  
  await prisma.notification.update({
    where: { id: notif.id },
    data: { isRead: true }
  });
  
  const checkNotif = await prisma.notification.findUnique({ where: { id: notif.id } });
  console.log(`Notification read state: ${checkNotif?.isRead}`);

  console.log('--- END VERIFICATION ---');
}

verify().catch(console.error).finally(() => prisma.$disconnect());
