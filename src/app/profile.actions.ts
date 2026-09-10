"use server";

import { auth } from "../../auth";
import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const updateProfileSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Name must be at least 2 characters long")
    .max(50, "Name must be less than 50 characters"),
});

export async function updateProfileAction(formData: FormData) {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: "Unauthorized" };
  }

  const rawName = formData.get("name");
  const validation = updateProfileSchema.safeParse({ name: rawName });

  if (!validation.success) {
    return { error: validation.error.issues[0]?.message || "Invalid name provided" };
  }

  const { name } = validation.data;
  const initials = name
    .trim()
    .split(/\s+/)
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  try {
    const updatedUser = await prisma.user.update({
      where: { id: session.user.id },
      data: {
        name,
        avatarInitials: initials,
      },
      select: {
        id: true,
        name: true,
        email: true,
        customerId: true,
        avatarInitials: true,
      },
    });

    revalidatePath("/profile");
    revalidatePath("/");

    return { success: true, user: updatedUser };
  } catch {
    return { error: "Failed to update profile" };
  }
}
