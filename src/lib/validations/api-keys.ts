// API Key Validation Schemas
import { z } from 'zod';
import { idSchema } from './common';

export const apiKeyPermissionsSchema = z.enum(['milk_logs', 'health_records', 'read_only']);

export const createApiKeySchema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name must be less than 100 characters'),
  description: z.string().max(500, 'Description must be less than 500 characters').optional(),
  permissions: z.array(apiKeyPermissionsSchema).min(1, 'At least one permission is required'),
  expiresAt: z
    .union([z.string().regex(/^\d{4}-\d{2}-\d{2}$/), z.date(), z.string().datetime()])
    .optional(),
});

export const updateApiKeySchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().max(500).optional(),
  permissions: z.array(apiKeyPermissionsSchema).optional(),
  expiresAt: z
    .union([z.string().regex(/^\d{4}-\d{2}-\d{2}$/), z.date(), z.string().datetime()])
    .optional(),
  isActive: z.boolean().optional(),
});

export const getApiKeySchema = z.object({
  id: idSchema,
});

export const listApiKeysSchema = z.object({
  isActive: z.coerce.boolean().optional(),
});
