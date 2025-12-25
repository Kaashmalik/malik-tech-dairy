/**
 * Standardized API Error Classes for MTK Dairy
 * 
 * These classes provide consistent error handling across all API routes.
 * Each error class maps to a specific HTTP status code and error type.
 */

export type ErrorCode =
  | 'VALIDATION_ERROR'
  | 'NOT_FOUND'
  | 'UNAUTHORIZED'
  | 'FORBIDDEN'
  | 'CONFLICT'
  | 'RATE_LIMITED'
  | 'INTERNAL_ERROR'
  | 'BAD_REQUEST'
  | 'SERVICE_UNAVAILABLE'
  | 'TENANT_REQUIRED'
  | 'SUBSCRIPTION_REQUIRED'
  | 'LIMIT_EXCEEDED';

/**
 * Base API Error class
 * All custom API errors should extend this class
 */
export class ApiError extends Error {
  public readonly statusCode: number;
  public readonly code: ErrorCode;
  public readonly details?: unknown;
  public readonly timestamp: string;
  public readonly isOperational: boolean;

  constructor(
    message: string,
    statusCode: number = 500,
    code: ErrorCode = 'INTERNAL_ERROR',
    details?: unknown
  ) {
    super(message);
    this.name = 'ApiError';
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
    this.timestamp = new Date().toISOString();
    this.isOperational = true; // Operational errors are expected and can be handled

    // Maintains proper stack trace for where error was thrown (V8 engines)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }
  }

  toJSON() {
    return {
      success: false,
      error: this.message,
      code: this.code,
      ...(process.env.NODE_ENV === 'development' && this.details ? { details: this.details } : {}),
      timestamp: this.timestamp,
    };
  }
}

/**
 * 400 Bad Request - Invalid request format or parameters
 */
export class BadRequestError extends ApiError {
  constructor(message: string = 'Bad request', details?: unknown) {
    super(message, 400, 'BAD_REQUEST', details);
    this.name = 'BadRequestError';
  }
}

/**
 * 400 Validation Error - Request body/params failed validation
 */
export class ValidationError extends ApiError {
  constructor(message: string = 'Validation failed', details?: unknown) {
    super(message, 400, 'VALIDATION_ERROR', details);
    this.name = 'ValidationError';
  }

  static fromZodError(zodError: { errors: Array<{ path: (string | number)[]; message: string }> }) {
    const formattedErrors = zodError.errors.map((err) => ({
      field: err.path.join('.'),
      message: err.message,
    }));
    return new ValidationError('Validation failed', formattedErrors);
  }
}

/**
 * 401 Unauthorized - Missing or invalid authentication
 */
export class UnauthorizedError extends ApiError {
  constructor(message: string = 'Authentication required') {
    super(message, 401, 'UNAUTHORIZED');
    this.name = 'UnauthorizedError';
  }
}

/**
 * 403 Forbidden - Authenticated but not authorized
 */
export class ForbiddenError extends ApiError {
  constructor(message: string = 'Access denied', details?: unknown) {
    super(message, 403, 'FORBIDDEN', details);
    this.name = 'ForbiddenError';
  }
}

/**
 * 403 Tenant Required - User must be in a tenant/organization
 */
export class TenantRequiredError extends ApiError {
  constructor(message: string = 'Organization membership required') {
    super(message, 403, 'TENANT_REQUIRED');
    this.name = 'TenantRequiredError';
  }
}

/**
 * 403 Subscription Required - Feature requires paid subscription
 */
export class SubscriptionRequiredError extends ApiError {
  constructor(
    message: string = 'This feature requires an active subscription',
    details?: { requiredPlan?: string; currentPlan?: string; upgradeUrl?: string }
  ) {
    super(message, 403, 'SUBSCRIPTION_REQUIRED', details);
    this.name = 'SubscriptionRequiredError';
  }
}

/**
 * 403 Limit Exceeded - Resource limit reached (e.g., max animals)
 */
export class LimitExceededError extends ApiError {
  constructor(
    message: string = 'Resource limit exceeded',
    details?: { current: number; limit: number; resource: string; upgradeUrl?: string }
  ) {
    super(message, 403, 'LIMIT_EXCEEDED', details);
    this.name = 'LimitExceededError';
  }
}

/**
 * 404 Not Found - Resource doesn't exist
 */
export class NotFoundError extends ApiError {
  constructor(resource: string = 'Resource', id?: string) {
    const message = id ? `${resource} with ID '${id}' not found` : `${resource} not found`;
    super(message, 404, 'NOT_FOUND');
    this.name = 'NotFoundError';
  }
}

/**
 * 409 Conflict - Resource already exists or state conflict
 */
export class ConflictError extends ApiError {
  constructor(message: string = 'Resource conflict', details?: unknown) {
    super(message, 409, 'CONFLICT', details);
    this.name = 'ConflictError';
  }
}

/**
 * 429 Rate Limited - Too many requests
 */
export class RateLimitedError extends ApiError {
  public readonly retryAfter?: number;

  constructor(message: string = 'Too many requests', retryAfter?: number) {
    super(message, 429, 'RATE_LIMITED', { retryAfter });
    this.name = 'RateLimitedError';
    this.retryAfter = retryAfter;
  }
}

/**
 * 500 Internal Server Error - Unexpected server error
 */
export class InternalServerError extends ApiError {
  constructor(message: string = 'Internal server error', details?: unknown) {
    super(message, 500, 'INTERNAL_ERROR', details);
    this.name = 'InternalServerError';
  }
}

/**
 * 503 Service Unavailable - External service down
 */
export class ServiceUnavailableError extends ApiError {
  constructor(service: string = 'Service', details?: unknown) {
    super(`${service} is temporarily unavailable`, 503, 'SERVICE_UNAVAILABLE', details);
    this.name = 'ServiceUnavailableError';
  }
}

/**
 * Check if an error is an operational API error (expected errors we can handle)
 */
export function isApiError(error: unknown): error is ApiError {
  return error instanceof ApiError;
}

/**
 * Check if an error is operational (expected and can be shown to users)
 */
export function isOperationalError(error: unknown): boolean {
  if (isApiError(error)) {
    return error.isOperational;
  }
  return false;
}

/**
 * Convert unknown errors to ApiError for consistent handling
 */
export function normalizeError(error: unknown): ApiError {
  if (isApiError(error)) {
    return error;
  }

  if (error instanceof Error) {
    // Check for specific error types
    if (error.message.includes('ECONNREFUSED') || error.message.includes('ETIMEDOUT')) {
      return new ServiceUnavailableError('Database', error.message);
    }
    
    return new InternalServerError(
      process.env.NODE_ENV === 'development' ? error.message : 'An unexpected error occurred',
      process.env.NODE_ENV === 'development' ? error.stack : undefined
    );
  }

  return new InternalServerError('An unexpected error occurred');
}
