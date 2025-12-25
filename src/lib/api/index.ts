/**
 * API Utilities - Central Export
 * 
 * Import all API utilities from this file:
 * import { successResponse, ApiError, ValidationError } from '@/lib/api';
 */

// Error classes
export {
  ApiError,
  BadRequestError,
  ValidationError,
  UnauthorizedError,
  ForbiddenError,
  TenantRequiredError,
  SubscriptionRequiredError,
  LimitExceededError,
  NotFoundError,
  ConflictError,
  RateLimitedError,
  InternalServerError,
  ServiceUnavailableError,
  isApiError,
  isOperationalError,
  normalizeError,
  type ErrorCode,
} from './errors';

// Response helpers
export {
  successResponse,
  paginatedResponse,
  errorResponse,
  createdResponse,
  noContentResponse,
  acceptedResponse,
  withErrorHandling,
  isErrorResponse,
  unwrapResponse,
  type ApiSuccessResponse,
  type ApiErrorResponse,
  type PaginationParams,
} from './response';

// Existing middleware exports
export { 
  getTenantContext, 
  withTenantContext, 
  checkUserRole, 
  getTenantLimits,
  type TenantContext,
} from './middleware';
