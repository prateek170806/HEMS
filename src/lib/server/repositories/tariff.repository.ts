import { prisma } from "../db";

export const DEFAULT_TARIFF_PERIODS = [
  { name: 'Night Off-Peak', startTime: '00:00', endTime: '06:00', pricePerKwh: 4.0, type: 'off_peak' },
  { name: 'Morning Normal', startTime: '06:00', endTime: '10:00', pricePerKwh: 6.0, type: 'normal' },
  { name: 'Solar Hours', startTime: '10:00', endTime: '17:00', pricePerKwh: 4.5, type: 'solar' },
  { name: 'Evening Peak', startTime: '17:00', endTime: '22:00', pricePerKwh: 12.0, type: 'peak' },
  { name: 'Night Off-Peak 2', startTime: '22:00', endTime: '23:59', pricePerKwh: 4.0, type: 'off_peak' },
];

export class TariffRepository {
  static async getActive(householdId: string) {
    return prisma.tariff.findFirst({
      where: { householdId, isActive: true },
      include: { periods: { orderBy: { startTime: 'asc' } } }
    });
  }

  static async createDefault(householdId: string, name: string = "Standard TOU Tariff") {
    // Check if an active tariff already exists
    const existing = await prisma.tariff.findFirst({
      where: { householdId, isActive: true },
      include: { periods: { orderBy: { startTime: 'asc' } } }
    });
    if (existing) return existing;

    // Deactivate any inactive orphan tariffs for safety
    await prisma.tariff.updateMany({
      where: { householdId, isActive: true },
      data: { isActive: false }
    });

    return prisma.tariff.create({
      data: {
        name,
        isActive: true,
        householdId,
        periods: {
          create: DEFAULT_TARIFF_PERIODS
        }
      },
      include: { periods: { orderBy: { startTime: 'asc' } } }
    });
  }

  static async activateTariff(tariffId: string, householdId: string) {
    await prisma.$transaction([
      prisma.tariff.updateMany({
        where: { householdId, isActive: true },
        data: { isActive: false }
      }),
      prisma.tariff.update({
        where: { id: tariffId, householdId },
        data: { isActive: true }
      })
    ]);
  }
}
