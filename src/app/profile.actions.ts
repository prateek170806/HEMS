"use server";

import { auth } from "../../auth";
import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function updateProfileAction(formData: FormData) {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: "Unauthorized" };
  }

  const name = formData.get("name") as string;
  if (!name || name.trim() === "") {
    return { error: "Name is required" };
  }

  const initials = name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);

  try {
    await prisma.user.update({
      where: { id: session.user.id },
      data: {
        name,
        avatarInitials: initials,
      }
    });

    // We shouldn't use unstable_update here if it's not supported in our version or we don't have access to the request object.
    // Instead we'll rely on the session callback updating from the token, and we might need to force a client-side reload or revalidation.
    revalidatePath("/profile");
    revalidatePath("/");
    
    return { success: true };
  } catch {
    return { error: "Failed to update profile" };
  }
}
