// Milk Log Validation Schemas
import { z } from "zod";
import { idSchema, dateSchema } from "./common";

export const milkSessionSchema = z.enum(["morning", "evening"]);

export const createMilkLogSchema = z.object({
  animalId: idSchema,
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be in YYYY-MM-DD format"),
  session: milkSessionSchema,
  quantity: z.coerce.number().min(0, "Quantity must be positive").max(100, "Quantity cannot exceed 100 liters"),
  quality: z.coerce.number().int().min(1).max(10, "Quality must be between 1 and 10").optional(),
  notes: z.string().max(500, "Notes must be less than 500 characters").optional(),
});

export const updateMilkLogSchema = createMilkLogSchema.partial().extend({
  animalId: idSchema.optional(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  session: milkSessionSchema.optional(),
});

export const getMilkLogSchema = z.object({
  id: idSchema,
});

export const listMilkLogsSchema = z.object({
  animalId: idSchema.optional(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  session: milkSessionSchema.optional(),
});

