import { prisma } from "../db";

export class TariffRepository {
  static async getActive(householdId: string) {
    return prisma.tariff.findFirst({
      where: { householdId, isActive: true },
      include: { periods: true }
    });
  }
}
