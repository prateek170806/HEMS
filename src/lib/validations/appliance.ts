import { z } from "zod";

export const applianceSchema = z.object({
  name: z.string().min(1, "Name is required"),
  category: z.string().min(1, "Category is required"),
  ratedPower: z.number().positive("Rated power must be positive"),
  flexibility: z.enum(["non_flexible", "shiftable", "interruptible", "thermostatic", "storage", "critical"]),
  minRuntime: z.number().min(0, "Minimum runtime cannot be negative"),
  maxRuntime: z.number().min(0, "Maximum runtime cannot be negative"),
  earliestStart: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, "Invalid time format (HH:mm)").optional().nullable(),
  latestFinish: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, "Invalid time format (HH:mm)").optional().nullable(),
  priority: z.enum(["low", "medium", "high"]),
  automationEnabled: z.boolean(),
  status: z.string().default("offline")
});

export const updateApplianceSchema = applianceSchema.partial();
