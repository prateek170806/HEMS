import { z } from "zod";

export const baseApplianceSchema = z.object({
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

export const applianceSchema = baseApplianceSchema.superRefine((data, ctx) => {
  if (data.maxRuntime < data.minRuntime) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Max runtime cannot be less than min runtime",
      path: ["maxRuntime"],
    });
  }

  if (data.earliestStart && data.latestFinish) {
    const parseTime = (time: string) => {
      const [h, m] = time.split(':').map(Number);
      return h + m / 60;
    };
    const start = parseTime(data.earliestStart);
    let finish = parseTime(data.latestFinish);
    if (finish <= start) finish += 24; // Crosses midnight

    const windowDuration = finish - start;
    if (windowDuration < data.minRuntime) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `Operating window (${windowDuration.toFixed(1)}h) cannot be smaller than min runtime (${data.minRuntime}h)`,
        path: ["latestFinish"],
      });
    }
  }
});

export const updateApplianceSchema = baseApplianceSchema.partial();
