// Breeding Record Validation Schemas
import { z } from "zod";
import { idSchema } from "./common";

export const breedingStatusSchema = z.enum([
  "pregnant",
  "calved",
  "failed",
  "in_progress",
]);

export const createBreedingRecordSchema = z.object({
  animalId: idSchema,
  breedingDate: z.union([
    z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    z.date(),
    z.string().datetime(),
  ]),
  expectedCalvingDate: z.union([
    z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    z.date(),
    z.string().datetime(),
  ]).optional(),
  actualCalvingDate: z.union([
    z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    z.date(),
    z.string().datetime(),
  ]).optional(),
  sireId: idSchema.optional(),
  status: breedingStatusSchema.default("in_progress").optional(),
  notes: z.string().max(2000, "Notes must be less than 2000 characters").optional(),
});

export const updateBreedingRecordSchema = createBreedingRecordSchema.partial().extend({
  animalId: idSchema.optional(),
});

export const getBreedingRecordSchema = z.object({
  id: idSchema,
});

export const listBreedingRecordsSchema = z.object({
  animalId: idSchema.optional(),
  status: breedingStatusSchema.optional(),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
});

