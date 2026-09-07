import { prisma } from "../db";
import { Prisma } from "@prisma/client";

export class ScheduleRepository {
  static async findAll(householdId: string) {
    return prisma.schedule.findMany({
      where: { householdId },
      include: { appliance: true }
    });
  }

  static async create(data: Prisma.ScheduleUncheckedCreateInput) {
    return prisma.schedule.create({ data });
  }

  static async update(id: string, data: Prisma.ScheduleUpdateInput) {
    return prisma.schedule.update({
      where: { id },
      data
    });
  }

  static async deleteMany(where: Prisma.ScheduleWhereInput) {
    return prisma.schedule.deleteMany({ where });
  }
}
