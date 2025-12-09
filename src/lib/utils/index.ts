// Utility functions barrel export for MTK Dairy
// This file re-exports all utility functions for easy importing

// Core utility (cn function for Tailwind)
export { cn } from '../utils';

// API helpers
export {
  successResponse,
  errorResponse,
  validationErrorResponse,
  paginatedResponse,
  safeJsonParse,
  tryCatch,
  delay,
  retry,
  parsePaginationParams,
  buildQueryString,
  extractTenantId,
  formatErrorForLog,
} from './api-helpers';

// Validation utilities
export {
  // Schemas
  emailSchema,
  phoneSchema,
  passwordSchema,
  dateSchema,
  positiveNumberSchema,
  nonNegativeNumberSchema,
  animalTagSchema,
  uuidSchema,
  slugSchema,
  createAnimalSchema,
  updateAnimalSchema,
  createMilkLogSchema,
  createHealthRecordSchema,
  createBreedingRecordSchema,
  createExpenseSchema,
  createSaleSchema,
  farmApplicationSchema,
  // Functions
  validateWithSchema,
  validateOrThrow,
  sanitizeString,
  validateDateRange,
} from './validation';

// Re-export types
export type {
  CreateAnimalInput,
  UpdateAnimalInput,
  CreateMilkLogInput,
  CreateHealthRecordInput,
  CreateBreedingRecordInput,
  CreateExpenseInput,
  CreateSaleInput,
  FarmApplicationInput,
} from './validation';

// Tenant utilities
export * from './tenant';

// Limits utilities
export * from './limits';
