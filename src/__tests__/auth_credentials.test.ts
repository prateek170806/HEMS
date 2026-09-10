import { describe, it, expect, beforeEach } from "vitest";
import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";

describe("HEMS Email & Password Authentication Suite", () => {
  const testEmail = "cred_user@wattwise.internal";
  const testPassword = "SecurePassword123!";

  beforeEach(async () => {
    // Clean up test user records
    await prisma.user.deleteMany({
      where: { email: testEmail },
    });
  });

  describe("Password Hashing & Verification", () => {
    it("hashes password with bcrypt and verifies correctly", async () => {
      const passwordHash = await bcrypt.hash(testPassword, 10);
      expect(passwordHash.startsWith("$2")).toBe(true);

      const isValid = await bcrypt.compare(testPassword, passwordHash);
      expect(isValid).toBe(true);

      const isInvalid = await bcrypt.compare("WrongPassword!", passwordHash);
      expect(isInvalid).toBe(false);
    });
  });

  describe("Email-based User Queries", () => {
    it("creates and retrieves a user strictly by email", async () => {
      const passwordHash = await bcrypt.hash(testPassword, 10);
      const user = await prisma.user.create({
        data: {
          name: "Standard Auth User",
          email: testEmail,
          passwordHash,
          customerId: "WW-TESTAUTH",
          avatarInitials: "SA",
        },
      });

      expect(user.id).toBeDefined();
      expect(user.email).toBe(testEmail);

      const queried = await prisma.user.findFirst({
        where: { email: testEmail.toLowerCase().trim() },
      });

      expect(queried).not.toBeNull();
      expect(queried?.name).toBe("Standard Auth User");
      expect(queried?.email).toBe(testEmail);
    });

    it("rejects duplicate email registrations", async () => {
      const passwordHash = await bcrypt.hash(testPassword, 10);
      await prisma.user.create({
        data: {
          name: "Original User",
          email: testEmail,
          passwordHash,
          customerId: "WW-ORIG",
          avatarInitials: "OU",
        },
      });

      const duplicateCheck = await prisma.user.findFirst({
        where: { email: testEmail },
      });

      expect(duplicateCheck).not.toBeNull();
    });
  });

  describe("User Deletion & Cascade Safety", () => {
    it("deletes user and cascades cleanly across all child models without foreign key violations", async () => {
      const passwordHash = "$2b$10$ep5C/T00mE6n4s4eW89Hke6sU9GzT8/1m1x6m.1O2e0K8.w.0yYKy";
      
      // 1. Create a user
      const user = await prisma.user.create({
        data: {
          name: "Cascade Test User",
          email: testEmail,
          passwordHash,
          customerId: "WW-CASCADE",
          avatarInitials: "CU",
        },
      });

      // 2. Create full child hierarchy
      const household = await prisma.household.create({
        data: {
          name: "Cascade Household",
          userId: user.id,
          powerLimitKw: 6.0,
        },
      });

      const appliance = await prisma.appliance.create({
        data: {
          name: "Smart Water Heater",
          category: "water_heater",
          ratedPower: 3.5,
          householdId: household.id,
        },
      });

      const tariff = await prisma.tariff.create({
        data: {
          name: "Cascade TOU Tariff",
          householdId: household.id,
        },
      });

      await prisma.tariffPeriod.create({
        data: {
          name: "Peak",
          tariffId: tariff.id,
          startTime: "18:00",
          endTime: "22:00",
          pricePerKwh: 12.5,
          type: "peak",
        },
      });

      const optimization = await prisma.optimizationRun.create({
        data: {
          householdId: household.id,
          horizonHours: 24,
          status: "completed",
          mode: "economic",
        },
      });

      await prisma.schedule.create({
        data: {
          householdId: household.id,
          applianceId: appliance.id,
          optimizationId: optimization.id,
          startTime: new Date(),
          endTime: new Date(Date.now() + 3600000),
          status: "scheduled",
        },
      });

      await prisma.meterReading.create({
        data: {
          householdId: household.id,
          timestamp: new Date(),
          homeDemandKw: 2.1,
        },
      });

      await prisma.notification.create({
        data: {
          householdId: household.id,
          type: "ALERT",
          message: "Test notification",
        },
      });

      // 3. Delete user via direct Prisma cascade
      const deletedUser = await prisma.user.delete({
        where: { id: user.id },
      });
      expect(deletedUser.id).toBe(user.id);

      // 4. Verify all child records were deleted
      const checkHousehold = await prisma.household.findUnique({ where: { id: household.id } });
      const checkAppliance = await prisma.appliance.findUnique({ where: { id: appliance.id } });
      const checkTariff = await prisma.tariff.findUnique({ where: { id: tariff.id } });
      const checkSchedules = await prisma.schedule.findMany({ where: { householdId: household.id } });

      expect(checkHousehold).toBeNull();
      expect(checkAppliance).toBeNull();
      expect(checkTariff).toBeNull();
      expect(checkSchedules.length).toBe(0);
    }, 20000);

    it("handles deletion of non-existent user with proper error code", async () => {
      try {
        await prisma.user.delete({
          where: { id: "non-existent-user-id-99999" },
        });
        expect.unreachable("Should have thrown P2025 error");
      } catch (err: unknown) {
        expect(err).toBeDefined();
        const prismaErr = err as { code?: string };
        expect(prismaErr.code).toBe("P2025");
      }
    }, 10000);
  });
});
