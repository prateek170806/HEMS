import { prisma } from "../db";
import { Prisma } from "@prisma/client";

export class ApplianceRepository {
  static async findAll(householdId: string) {
    return prisma.appliance.findMany({
      where: { householdId }
    });
  }

  static async findById(id: string) {
    return prisma.appliance.findUnique({
      where: { id }
    });
  }

  static async create(data: Prisma.ApplianceUncheckedCreateInput) {
    return prisma.appliance.create({
      data
    });
  }

  static async update(id: string, data: Prisma.ApplianceUpdateInput) {
    return prisma.appliance.update({
      where: { id },
      data
    });
  }

  static async delete(id: string) {
    return prisma.appliance.delete({
      where: { id }
    });
  }
}
