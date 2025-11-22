// Animal Validation Schemas
import { z } from "zod";
import { dateSchema, idSchema } from "./common";

export const animalSpeciesSchema = z.enum([
  "cow",
  "buffalo",
  "chicken",
  "goat",
  "sheep",
  "horse",
]);

export const animalGenderSchema = z.enum(["male", "female"]);

export const animalStatusSchema = z.enum([
  "active",
  "sold",
  "deceased",
  "sick",
]);

export const createAnimalSchema = z.object({
  tag: z.string().min(1, "Tag is required").max(50, "Tag must be less than 50 characters"),
  name: z.string().max(100, "Name must be less than 100 characters").optional(),
  species: animalSpeciesSchema,
  breed: z.string().max(100, "Breed must be less than 100 characters").optional(),
  dateOfBirth: z.union([
    z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    z.date(),
    z.string().datetime(),
  ]).optional(),
  gender: animalGenderSchema,
  photoUrl: z.string().url("Invalid photo URL").optional(),
  status: animalStatusSchema.default("active").optional(),
  purchaseDate: z.union([
    z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    z.date(),
    z.string().datetime(),
  ]).optional(),
  purchasePrice: z.coerce.number().min(0, "Purchase price must be positive").optional(),
});

export const updateAnimalSchema = createAnimalSchema.partial().extend({
  tag: z.string().min(1).max(50).optional(),
  species: animalSpeciesSchema.optional(),
  gender: animalGenderSchema.optional(),
});

export const getAnimalSchema = z.object({
  id: idSchema,
});

export const listAnimalsSchema = z.object({
  species: animalSpeciesSchema.optional(),
  status: animalStatusSchema.optional(),
  gender: animalGenderSchema.optional(),
  search: z.string().max(100).optional(),
});

