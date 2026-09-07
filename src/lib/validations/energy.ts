import { z } from "zod";

export const energyReadingSchema = z.object({
  deviceId: z.string().optional(),
  timestamp: z.string().datetime(), // ISO string
  voltage: z.number().optional(),
  current: z.number().optional(),
  importKw: z.number().min(0).default(0),
  exportKw: z.number().min(0).default(0),
  solarKw: z.number().min(0).default(0),
  batterySoc: z.number().min(0).max(100).default(0),
  homeDemandKw: z.number().min(0).default(0),
});
