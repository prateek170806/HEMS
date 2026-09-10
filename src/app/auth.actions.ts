"use server";

import { signIn, signOut } from "../../auth";
import { AuthError } from "next-auth";
import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { TariffRepository } from "@/lib/server/repositories/tariff.repository";

export async function loginAction(formData: FormData) {
  try {
    const rawEmail = (formData.get("email") || formData.get("identifier")) as string;
    const password = formData.get("password") as string;

    if (!rawEmail || !password) {
      return { error: "Please enter your email and password." };
    }

    const email = rawEmail.trim().toLowerCase();

    await signIn("credentials", {
      email,
      password,
      redirectTo: "/",
    });
  } catch (error) {
    if (error instanceof AuthError) {
      switch (error.type) {
        case "CredentialsSignin":
          return { error: "Invalid email or password." };
        default:
          return { error: "Something went wrong during sign in." };
      }
    }
    throw error;
  }
}

export async function registerAction(formData: FormData) {
  try {
    const name = (formData.get("name") as string)?.trim();
    const rawEmail = formData.get("email") as string;
    const password = formData.get("password") as string;
    const confirmPassword = formData.get("confirmPassword") as string;

    if (!name || !rawEmail || !password || !confirmPassword) {
      return { error: "All fields are required." };
    }

    const email = rawEmail.trim().toLowerCase();

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return { error: "Please enter a valid email address." };
    }

    if (password !== confirmPassword) {
      return { error: "Passwords do not match. Please verify." };
    }

    if (password.length < 8) {
      return { error: "Password must be at least 8 characters long." };
    }

    const existingUser = await prisma.user.findFirst({
      where: { email },
    });

    if (existingUser) {
      return { error: "An account with this email address already exists." };
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const initials = name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);
    const customerId = "WW-" + Math.random().toString(16).slice(2, 8).toUpperCase();

    const user = await prisma.user.create({
      data: {
        name,
        email,
        passwordHash,
        avatarInitials: initials || "WW",
        customerId,
      },
    });

    // Create default household for the new customer
    const household = await prisma.household.create({
      data: {
        name: `${name}'s Household`,
        userId: user.id,
        timezone: "Asia/Kolkata",
        currency: "INR",
        powerLimitKw: 5.5,
        batteryReserve: 20,
      },
    });

    // Create default active Time-of-Use tariff for the household
    await TariffRepository.createDefault(household.id, "Standard TOU Tariff");

    await signIn("credentials", {
      email,
      password,
      redirectTo: "/",
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return { error: "Something went wrong during registration sign in." };
    }
    throw error;
  }
}

export async function logoutAction() {
  await signOut({ redirectTo: "/login" });
}
