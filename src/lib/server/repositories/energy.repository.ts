import { prisma } from "../db";
import { Prisma } from "@prisma/client";

export class EnergyRepository {
  static async createReading(data: Prisma.MeterReadingUncheckedCreateInput) {
    return prisma.meterReading.create({
      data
    });
  }

  static async getHistory(householdId: string, from: Date, to: Date) {
    return prisma.meterReading.findMany({
      where: {
        householdId,
        timestamp: {
          gte: from,
          lte: to
        }
      },
      orderBy: { timestamp: 'asc' }
    });
  }

  static async getLatest(householdId: string) {
    return prisma.meterReading.findFirst({
      where: { householdId },
      orderBy: { timestamp: 'desc' }
    });
  }
}
