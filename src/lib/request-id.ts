/**
 * Request ID Tracking Middleware
 * Adds unique request IDs to all requests for tracing and debugging
 */

import { NextRequest, NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';

/**
 * Generate or retrieve request ID
 */
export function getRequestId(request: NextRequest): string {
  // Check for existing request ID in headers
  const existingId = request.headers.get('x-request-id');
  if (existingId) {
    return existingId;
  }

  // Generate new request ID
  return uuidv4();
}

/**
 * Add request ID to response headers
 */
export function addRequestIdToResponse(response: NextResponse, requestId: string): NextResponse {
  response.headers.set('x-request-id', requestId);
  return response;
}

/**
 * Middleware wrapper to add request ID tracking
 */
export function withRequestIdTracking(
  handler: (request: NextRequest, requestId: string) => Promise<NextResponse>
) {
  return async (request: NextRequest) => {
    const requestId = getRequestId(request);

    try {
      const response = await handler(request, requestId);
      return addRequestIdToResponse(response, requestId);
    } catch (error) {
      // Log error with request ID for tracing
      console.error(`[${requestId}] Request failed:`, error);

      const errorResponse = NextResponse.json(
        {
          success: false,
          error: 'Internal server error',
          code: 'INTERNAL_ERROR',
          requestId,
        },
        { status: 500 }
      );

      return addRequestIdToResponse(errorResponse, requestId);
    }
  };
}

/**
 * Extract request ID from response
 */
export function getRequestIdFromResponse(response: Response): string | null {
  return response.headers.get('x-request-id');
}
