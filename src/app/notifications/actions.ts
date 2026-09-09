"use server";
import { getCurrentHousehold } from "@/lib/server/auth";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function markAsReadAction(id: string) {
  const household = await getCurrentHousehold();
  if (!household) throw new Error("No household found");

  await prisma.notification.updateMany({
    where: { id, householdId: household.id },
    data: { isRead: true }
  });
  revalidatePath("/notifications");
  return { success: true };
}

export async function markAllAsReadAction() {
  const household = await getCurrentHousehold();
  if (!household) throw new Error("No household found");

  await prisma.notification.updateMany({
    where: { householdId: household.id, isRead: false },
    data: { isRead: true }
  });
  revalidatePath("/notifications");
  return { success: true };
}

export async function clearNotificationsAction() {
  const household = await getCurrentHousehold();
  if (!household) throw new Error("No household found");

  await prisma.notification.deleteMany({
    where: { householdId: household.id }
  });
  revalidatePath("/notifications");
  return { success: true };
}
