import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('Seeding demo database...')

  // Clean up
  await prisma.schedule.deleteMany()
  await prisma.optimizationRun.deleteMany()
  await prisma.meterReading.deleteMany()
  await prisma.tariffPeriod.deleteMany()
  await prisma.tariff.deleteMany()
  await prisma.appliance.deleteMany()
  await prisma.household.deleteMany()

  await prisma.user.deleteMany()

  const user = await prisma.user.create({
    data: {
      customerId: 'demo-123',
      name: 'Demo User',
      email: 'demo@wattwise.local',
      passwordHash: 'dummy',
    }
  })

  // 1. Create Household
  const household = await prisma.household.create({
    data: {
      userId: user.id,
      name: 'Green Valley Residence',
      timezone: 'Asia/Kolkata',
      currency: 'INR',
      powerLimitKw: 5.5,
      batteryReserve: 20,
      optimizationMode: 'economic',
    },
  })
  console.log('Created Household:', household.name)

  // 2. Create Appliances
  const appliances = [
    {
      name: 'Washing Machine',
      category: 'washing_machine',
      ratedPower: 0.5,
      flexibility: 'shiftable',
      minRuntime: 2,
      maxRuntime: 2,
      earliestStart: '13:00',
      latestFinish: '20:00',
      priority: 'medium',
      householdId: household.id,
    },
    {
      name: 'Water Heater',
      category: 'water_heater',
      ratedPower: 2.0,
      flexibility: 'shiftable',
      minRuntime: 1,
      maxRuntime: 1,
      earliestStart: '14:00',
      latestFinish: '20:00',
      priority: 'high',
      householdId: household.id,
    },
    {
      name: 'EV Charger',
      category: 'ev',
      ratedPower: 3.3,
      flexibility: 'shiftable',
      minRuntime: 4,
      maxRuntime: 8,
      earliestStart: '22:00',
      latestFinish: '07:00',
      priority: 'high',
      householdId: household.id,
    },
    {
      name: 'Refrigerator',
      category: 'refrigerator',
      ratedPower: 0.2,
      flexibility: 'critical',
      minRuntime: 24,
      maxRuntime: 24,
      earliestStart: '00:00',
      latestFinish: '23:59',
      priority: 'high',
      householdId: household.id,
    }
  ]

  for (const app of appliances) {
    await prisma.appliance.create({ data: app })
  }
  console.log('Created 4 Appliances')

  // 3. Create Tariff
  const tariff = await prisma.tariff.create({
    data: {
      name: 'Demo TOU Tariff',
      isActive: true,
      householdId: household.id,
      periods: {
        create: [
          { name: 'Night Off-Peak', startTime: '00:00', endTime: '06:00', pricePerKwh: 4.0, type: 'off_peak' },
          { name: 'Morning Normal', startTime: '06:00', endTime: '10:00', pricePerKwh: 6.0, type: 'normal' },
          { name: 'Solar Hours', startTime: '10:00', endTime: '17:00', pricePerKwh: 4.5, type: 'solar' },
          { name: 'Evening Peak', startTime: '17:00', endTime: '22:00', pricePerKwh: 8.0, type: 'peak' },
          { name: 'Night Normal', startTime: '22:00', endTime: '23:59', pricePerKwh: 5.0, type: 'normal' },
        ]
      }
    }
  })
  console.log('Created Tariff:', tariff.name)

  console.log('Seeding finished.')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
