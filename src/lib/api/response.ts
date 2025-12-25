/**
 * Standardized API Response Helpers for MTK Dairy
 * 
 * Provides consistent response formats across all API routes.
 */

import { NextResponse } from 'next/server';
import { ApiError, normalizeError, isApiError, ValidationError } from './errors';
import { ZodError } from 'zod';

/**
 * Standard success response structure
 */
export interface ApiSuccessResponse<T = unknown> {
  success: true;
  data: T;
  message?: string;
  meta?: {
    total?: number;
    page?: number;
    limit?: number;
    hasMore?: boolean;
  };
}

/**
 * Standard error response structure
 */
export interface ApiErrorResponse {
  success: false;
  error: string;
  code?: string;
  details?: unknown;
  timestamp?: string;
}

/**
 * Pagination parameters
 */
export interface PaginationParams {
  page?: number;
  limit?: number;
  total?: number;
}

/**
 * Create a successful API response
 */
export function successResponse<T>(
  data: T,
  options?: {
    message?: string;
    status?: number;
    meta?: ApiSuccessResponse['meta'];
    headers?: HeadersInit;
  }
): NextResponse<ApiSuccessResponse<T>> {
  const response: ApiSuccessResponse<T> = {
    success: true,
    data,
    ...(options?.message && { message: options.message }),
    ...(options?.meta && { meta: options.meta }),
  };

  return NextResponse.json(response, {
    status: options?.status || 200,
    headers: options?.headers,
  });
}

/**
 * Create a paginated API response
 */
export function paginatedResponse<T>(
  data: T[],
  pagination: PaginationParams,
  options?: {
    message?: string;
    headers?: HeadersInit;
  }
): NextResponse<ApiSuccessResponse<T[]>> {
  const { page = 1, limit = 20, total } = pagination;
  const hasMore = total ? page * limit < total : data.length === limit;

  return successResponse(data, {
    message: options?.message,
    headers: options?.headers,
    meta: {
      page,
      limit,
      total,
      hasMore,
    },
  });
}

/**
 * Create an error API response
 */
export function errorResponse(
  error: ApiError | Error | unknown,
  options?: {
    headers?: HeadersInit;
  }
): NextResponse<ApiErrorResponse> {
  // Handle Zod validation errors specially
  if (error instanceof ZodError) {
    const validationError = ValidationError.fromZodError(error);
    return NextResponse.json(validationError.toJSON() as ApiErrorResponse, {
      status: validationError.statusCode,
      headers: options?.headers,
    });
  }

  // Normalize the error to ApiError
  const apiError = isApiError(error) ? error : normalizeError(error);

  const response: ApiErrorResponse = {
    success: false,
    error: apiError.message,
    code: apiError.code,
    ...(process.env.NODE_ENV === 'development' && apiError.details
      ? { details: apiError.details }
      : {}),
    timestamp: apiError.timestamp,
  };

  return NextResponse.json(response, {
    status: apiError.statusCode,
    headers: options?.headers,
  });
}

/**
 * Create a created (201) response
 */
export function createdResponse<T>(
  data: T,
  message?: string
): NextResponse<ApiSuccessResponse<T>> {
  return successResponse(data, { status: 201, message: message || 'Created successfully' });
}

/**
 * Create a no content (204) response
 */
export function noContentResponse(): NextResponse {
  return new NextResponse(null, { status: 204 });
}

/**
 * Create an accepted (202) response for async operations
 */
export function acceptedResponse<T>(
  data: T,
  message?: string
): NextResponse<ApiSuccessResponse<T>> {
  return successResponse(data, { status: 202, message: message || 'Request accepted' });
}

/**
 * Wrapper function to handle API route errors consistently
 */
export function withErrorHandling<T extends unknown[], R>(
  handler: (...args: T) => Promise<NextResponse<R>>
): (...args: T) => Promise<NextResponse<R | ApiErrorResponse>> {
  return async (...args: T): Promise<NextResponse<R | ApiErrorResponse>> => {
    try {
      return await handler(...args);
    } catch (error) {
      // Log the error
      console.error('[API Error]', {
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
        timestamp: new Date().toISOString(),
      });

      return errorResponse(error);
    }
  };
}

/**
 * Type guard to check if response is an error
 */
export function isErrorResponse(
  response: ApiSuccessResponse | ApiErrorResponse
): response is ApiErrorResponse {
  return !response.success;
}

/**
 * Helper to extract data from API response or throw
 */
export function unwrapResponse<T>(response: ApiSuccessResponse<T> | ApiErrorResponse): T {
  if (isErrorResponse(response)) {
    throw new Error(response.error);
  }
  return response.data;
}

/**
 * Handle API response from fetch
 * Checks if response is ok and parses JSON
 */
export async function handleApiResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.error || error.message || `HTTP ${response.status}`);
  }
  
  return response.json();
}
