// Health Record Validation Schemas
import { z } from "zod";
import { idSchema } from "./common";

export const healthRecordTypeSchema = z.enum([
  "vaccination",
  "treatment",
  "checkup",
  "disease",
]);

export const createHealthRecordSchema = z.object({
  animalId: idSchema,
  type: healthRecordTypeSchema,
  date: z.union([
    z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    z.date(),
    z.string().datetime(),
  ]),
  description: z.string().min(1, "Description is required").max(2000, "Description must be less than 2000 characters"),
  veterinarian: z.string().max(100, "Veterinarian name must be less than 100 characters").optional(),
  cost: z.coerce.number().min(0, "Cost must be positive").optional(),
  nextDueDate: z.union([
    z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    z.date(),
    z.string().datetime(),
  ]).optional(),
  notes: z.string().max(5000, "Notes must be less than 5000 characters").optional(), // Will be encrypted
});

export const updateHealthRecordSchema = createHealthRecordSchema.partial().extend({
  animalId: idSchema.optional(),
  type: healthRecordTypeSchema.optional(),
});

export const getHealthRecordSchema = z.object({
  id: idSchema,
});

export const listHealthRecordsSchema = z.object({
  animalId: idSchema.optional(),
  type: healthRecordTypeSchema.optional(),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
});

