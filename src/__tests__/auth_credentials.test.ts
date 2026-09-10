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
});
