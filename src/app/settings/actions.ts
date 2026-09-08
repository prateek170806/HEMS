"use server";

import { z } from "zod";
import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";

const settingsSchema = z.object({
  name: z.string().min(1, "Household name is required"),
  powerLimitKw: z.number().min(1, "Power limit must be at least 1 kW").max(100, "Power limit is too high"),
  batteryReserve: z.number().min(0).max(100),
  optimizationMode: z.enum(["economic", "balanced", "comfort", "green"]),
});

export type SettingsFormData = z.infer<typeof settingsSchema>;

export async function updateSettingsAction(data: SettingsFormData) {
  const result = settingsSchema.safeParse(data);
  if (!result.success) {
    return { success: false, errors: result.error.flatten().fieldErrors };
  }

  const household = await prisma.household.findFirst();
  if (!household) {
    return { success: false, message: "Household not found" };
  }

  await prisma.household.update({
    where: { id: household.id },
    data: result.data,
  });

  revalidatePath("/");
  revalidatePath("/settings");
  revalidatePath("/analytics");
  revalidatePath("/live-energy");
  
  return { success: true };
}
