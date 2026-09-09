"use server";

import { signIn, signOut } from "../../auth";
import { AuthError } from "next-auth";
import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function loginAction(formData: FormData) {
  try {
    await signIn("credentials", {
      email: formData.get("email"),
      password: formData.get("password"),
      redirectTo: "/",
    });
  } catch (error) {
    if (error instanceof AuthError) {
      switch (error.type) {
        case "CredentialsSignin":
          return { error: "Invalid credentials." };
        default:
          return { error: "Something went wrong." };
      }
    }
    throw error;
  }
}

export async function registerAction(formData: FormData) {
  try {
    const name = formData.get("name") as string;
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;
    const confirmPassword = formData.get("confirmPassword") as string;

    if (!name || !email || !password || password !== confirmPassword) {
      return { error: "Invalid form data or passwords do not match." };
    }

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return { error: "Email is already in use." };
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const initials = name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);
    const customerId = "WW-" + Math.random().toString(16).slice(2, 8).toUpperCase();

    const user = await prisma.user.create({
      data: {
        name,
        email,
        passwordHash,
        avatarInitials: initials,
        customerId,
      },
    });

    // Create default household for the new customer
    await prisma.household.create({
      data: {
        name: `${name}'s Household`,
        userId: user.id,
        timezone: "Asia/Kolkata",
        currency: "INR",
        powerLimitKw: 5.5,
        batteryReserve: 20,
      }
    });

    await signIn("credentials", {
      email,
      password,
      redirectTo: "/",
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return { error: "Something went wrong during sign in." };
    }
    throw error;
  }
}

export async function logoutAction() {
  await signOut({ redirectTo: "/login" });
}
