// Validation Utilities using Zod for MTK Dairy
import { z } from 'zod';

// ============================================================================
// Common Validation Schemas
// ============================================================================

export const emailSchema = z.string().email('Invalid email address');

export const phoneSchema = z
  .string()
  .regex(
    /^(\+92|0)?3[0-9]{9}$/,
    'Invalid Pakistani phone number (format: 03XXXXXXXXX or +923XXXXXXXXX)'
  );

export const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
  .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
  .regex(/[0-9]/, 'Password must contain at least one number');

export const dateSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format (YYYY-MM-DD)');

export const positiveNumberSchema = z.number().positive('Must be a positive number');

export const nonNegativeNumberSchema = z.number().min(0, 'Must be zero or positive');

export const animalTagSchema = z
  .string()
  .min(1, 'Tag is required')
  .max(50, 'Tag must be less than 50 characters')
  .regex(/^[A-Za-z0-9-_]+$/, 'Tag can only contain letters, numbers, hyphens, and underscores');

export const uuidSchema = z.string().uuid('Invalid ID format');

export const slugSchema = z
  .string()
  .min(3, 'Slug must be at least 3 characters')
  .max(50, 'Slug must be less than 50 characters')
  .regex(/^[a-z0-9-]+$/, 'Slug can only contain lowercase letters, numbers, and hyphens');

// ============================================================================
// Entity Validation Schemas
// ============================================================================

export const createAnimalSchema = z.object({
  tag: animalTagSchema,
  name: z.string().max(100).optional(),
  species: z.enum(['cow', 'buffalo', 'chicken', 'goat', 'sheep', 'horse']),
  breed: z.string().max(100).optional(),
  dateOfBirth: dateSchema.optional(),
  gender: z.enum(['male', 'female']),
  status: z.enum(['active', 'sold', 'deceased', 'sick']).default('active'),
  purchaseDate: dateSchema.optional(),
  purchasePrice: positiveNumberSchema.optional(),
  weight: positiveNumberSchema.optional(),
  color: z.string().max(50).optional(),
  notes: z.string().max(1000).optional(),
  customFields: z.record(z.unknown()).optional(),
});

export const updateAnimalSchema = createAnimalSchema.partial().extend({
  id: z.string().min(1),
});

export const createMilkLogSchema = z.object({
  animalId: z.string().min(1, 'Animal ID is required'),
  date: dateSchema,
  session: z.enum(['morning', 'evening']),
  quantity: positiveNumberSchema.refine(val => val <= 100, 'Quantity cannot exceed 100 liters'),
  quality: z.number().min(1).max(10).optional(),
  fat: z.number().min(0).max(15).optional(), // Fat percentage
  notes: z.string().max(500).optional(),
});

export const createHealthRecordSchema = z.object({
  animalId: z.string().min(1, 'Animal ID is required'),
  type: z.enum(['vaccination', 'treatment', 'checkup', 'disease']),
  date: dateSchema,
  description: z.string().min(1).max(1000),
  veterinarian: z.string().max(100).optional(),
  cost: nonNegativeNumberSchema.optional(),
  nextDueDate: dateSchema.optional(),
});

export const createBreedingRecordSchema = z.object({
  animalId: z.string().min(1, 'Animal ID is required'),
  sireId: z.string().optional(),
  breedingDate: dateSchema,
  expectedCalvingDate: dateSchema.optional(),
  notes: z.string().max(1000).optional(),
});

export const createExpenseSchema = z.object({
  date: dateSchema,
  category: z.enum(['feed', 'medicine', 'labor', 'equipment', 'utilities', 'other']),
  description: z.string().min(1).max(500),
  amount: positiveNumberSchema,
  vendorName: z.string().max(100).optional(),
  receiptUrl: z.string().url().optional(),
});

export const createSaleSchema = z.object({
  date: dateSchema,
  type: z.enum(['milk', 'animal', 'egg', 'other']),
  quantity: positiveNumberSchema,
  unit: z.string().min(1).max(20),
  pricePerUnit: positiveNumberSchema,
  buyerName: z.string().max(100).optional(),
  buyerPhone: phoneSchema.optional(),
  notes: z.string().max(500).optional(),
});

export const farmApplicationSchema = z.object({
  farmName: z.string().min(2).max(255),
  ownerName: z.string().min(2).max(255),
  email: emailSchema,
  phone: phoneSchema,
  address: z.string().max(500).optional(),
  city: z.string().max(100).optional(),
  province: z.string().max(100).optional(),
  animalTypes: z.array(z.enum(['cow', 'buffalo', 'chicken', 'goat', 'sheep', 'horse'])).min(1),
  estimatedAnimals: z.number().min(1).max(10000),
  requestedPlan: z.enum(['free', 'professional', 'farm', 'enterprise']),
});

// ============================================================================
// Validation Helpers
// ============================================================================

/**
 * Validate data with a Zod schema and return typed result
 */
export function validateWithSchema<T>(
  schema: z.ZodSchema<T>,
  data: unknown
): { success: true; data: T } | { success: false; errors: Record<string, string[]> } {
  const result = schema.safeParse(data);

  if (result.success) {
    return { success: true, data: result.data };
  }

  const errors: Record<string, string[]> = {};
  for (const issue of result.error.issues) {
    const path = issue.path.join('.') || '_root';
    if (!errors[path]) {
      errors[path] = [];
    }
    errors[path].push(issue.message);
  }

  return { success: false, errors };
}

/**
 * Validate and throw on error (for API routes)
 */
export function validateOrThrow<T>(schema: z.ZodSchema<T>, data: unknown): T {
  const result = schema.safeParse(data);
  if (!result.success) {
    const errorMessages = result.error.issues.map(i => `${i.path.join('.')}: ${i.message}`);
    throw new Error(`Validation failed: ${errorMessages.join(', ')}`);
  }
  return result.data;
}

/**
 * Sanitize string input (trim and normalize whitespace)
 */
export function sanitizeString(input: string): string {
  return input.trim().replace(/\s+/g, ' ');
}

/**
 * Validate date range
 */
export function validateDateRange(
  startDate: string,
  endDate: string
): { valid: boolean; error?: string } {
  const start = new Date(startDate);
  const end = new Date(endDate);

  if (isNaN(start.getTime())) {
    return { valid: false, error: 'Invalid start date' };
  }
  if (isNaN(end.getTime())) {
    return { valid: false, error: 'Invalid end date' };
  }
  if (start > end) {
    return { valid: false, error: 'Start date must be before end date' };
  }

  return { valid: true };
}

// ============================================================================
// Type Exports
// ============================================================================

export type CreateAnimalInput = z.infer<typeof createAnimalSchema>;
export type UpdateAnimalInput = z.infer<typeof updateAnimalSchema>;
export type CreateMilkLogInput = z.infer<typeof createMilkLogSchema>;
export type CreateHealthRecordInput = z.infer<typeof createHealthRecordSchema>;
export type CreateBreedingRecordInput = z.infer<typeof createBreedingRecordSchema>;
export type CreateExpenseInput = z.infer<typeof createExpenseSchema>;
export type CreateSaleInput = z.infer<typeof createSaleSchema>;
export type FarmApplicationInput = z.infer<typeof farmApplicationSchema>;
