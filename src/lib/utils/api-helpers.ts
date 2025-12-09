// API Helper Utilities for MTK Dairy
import type {
  ApiResponse,
  ApiSuccessResponse,
  ApiErrorResponse,
  PaginatedResponse,
} from '@/types/api';

/**
 * Create a success response
 */
export function successResponse<T>(
  data: T,
  message?: string,
  meta?: { page?: number; limit?: number; total?: number; hasMore?: boolean }
): ApiSuccessResponse<T> {
  return {
    success: true,
    data,
    message,
    meta,
  };
}

/**
 * Create an error response
 */
export function errorResponse(error: string, details?: string, code?: string): ApiErrorResponse {
  return {
    success: false,
    error,
    details,
    code,
  };
}

/**
 * Create a validation error response
 */
export function validationErrorResponse(errors: Record<string, string[]>): ApiErrorResponse {
  return {
    success: false,
    error: 'Validation failed',
    validationErrors: errors,
    code: 'VALIDATION_ERROR',
  };
}

/**
 * Create a paginated response
 */
export function paginatedResponse<T>(
  items: T[],
  page: number,
  limit: number,
  total: number
): ApiSuccessResponse<PaginatedResponse<T>> {
  const totalPages = Math.ceil(total / limit);
  return {
    success: true,
    data: {
      items,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasMore: page < totalPages,
      },
    },
  };
}

/**
 * Safe JSON parse with error handling
 */
export function safeJsonParse<T>(json: string, fallback: T): T {
  try {
    return JSON.parse(json) as T;
  } catch {
    return fallback;
  }
}

/**
 * Async wrapper with error handling - returns tuple [result, error]
 */
export async function tryCatch<T>(fn: () => Promise<T>): Promise<[T, null] | [null, Error]> {
  try {
    const result = await fn();
    return [result, null];
  } catch (error) {
    return [null, error instanceof Error ? error : new Error(String(error))];
  }
}

/**
 * Delay utility for rate limiting
 */
export function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Retry utility for flaky operations
 */
export async function retry<T>(
  fn: () => Promise<T>,
  options: { maxAttempts?: number; delay?: number; backoff?: number } = {}
): Promise<T> {
  const { maxAttempts = 3, delay: initialDelay = 1000, backoff = 2 } = options;
  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      if (attempt < maxAttempts) {
        await delay(initialDelay * Math.pow(backoff, attempt - 1));
      }
    }
  }

  throw lastError;
}

/**
 * Parse pagination parameters from URL search params
 */
export function parsePaginationParams(searchParams: URLSearchParams): {
  page: number;
  limit: number;
  sortBy?: string;
  sortOrder: 'asc' | 'desc';
} {
  return {
    page: Math.max(1, parseInt(searchParams.get('page') || '1', 10)),
    limit: Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '20', 10))),
    sortBy: searchParams.get('sortBy') || undefined,
    sortOrder: (searchParams.get('sortOrder') as 'asc' | 'desc') || 'desc',
  };
}

/**
 * Build query string from object
 */
export function buildQueryString(
  params: Record<string, string | number | boolean | undefined>
): string {
  const searchParams = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null && value !== '') {
      searchParams.set(key, String(value));
    }
  }
  return searchParams.toString();
}

/**
 * Extract tenant ID from request headers or auth
 */
export function extractTenantId(headers: Headers): string | null {
  return headers.get('x-tenant-id') || null;
}

/**
 * Format API error for logging
 */
export function formatErrorForLog(error: unknown): {
  message: string;
  stack?: string;
  details?: Record<string, unknown>;
} {
  if (error instanceof Error) {
    return {
      message: error.message,
      stack: error.stack,
    };
  }
  return {
    message: String(error),
  };
}
