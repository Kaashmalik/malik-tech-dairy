// Enterprise API Middleware for MTK Dairy
// Provides consistent error handling, rate limiting, validation, and security

import { NextRequest, NextResponse } from 'next/server';
import { getAuth } from '@clerk/nextjs/server';
import { z } from 'zod';
import { getSupabaseClient } from '@/lib/supabase';
import { headers } from 'next/headers';

// Rate limiting using Upstash Redis
interface RateLimitConfig {
  requests: number;
  window: number; // in seconds
}

const RATE_LIMITS: Record<string, RateLimitConfig> = {
  default: { requests: 100, window: 60 },
  ai: { requests: 50, window: 60 },
  import: { requests: 5, window: 60 },
  analytics: { requests: 200, window: 60 },
};

// Upstash Redis client for rate limiting (lazy-loaded)
let redis: any = null;
let redisInitialized = false;

async function getRedisClient() {
  if (redisInitialized) return redis;

  try {
    if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
      const { Redis } = await import('@upstash/redis');
      redis = new Redis({
        url: process.env.UPSTASH_REDIS_REST_URL,
        token: process.env.UPSTASH_REDIS_REST_TOKEN,
      });
      console.log('Redis client initialized for rate limiting');
    }
  } catch (error) {
    console.warn('Upstash Redis not available for rate limiting');
  }

  redisInitialized = true;
  return redis;
}

// Standardized API Response format
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  meta?: {
    timestamp: string;
    requestId: string;
    version: string;
    pagination?: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  };
}

// Error types for better error handling
export enum ErrorCode {
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  AUTHENTICATION_ERROR = 'AUTHENTICATION_ERROR',
  AUTHORIZATION_ERROR = 'AUTHORIZATION_ERROR',
  RATE_LIMIT_ERROR = 'RATE_LIMIT_ERROR',
  SUBSCRIPTION_ERROR = 'SUBSCRIPTION_ERROR',
  NOT_FOUND = 'NOT_FOUND',
  INTERNAL_ERROR = 'INTERNAL_ERROR',
  DATABASE_ERROR = 'DATABASE_ERROR',
}

// Custom error class
export class ApiError extends Error {
  constructor(
    public code: ErrorCode,
    message: string,
    public statusCode: number = 500,
    public details?: any
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

// Rate limiting middleware
async function checkRateLimit(identifier: string, endpoint: string): Promise<void> {
  const config = RATE_LIMITS[endpoint] || RATE_LIMITS['default'];
  const key = `rate_limit:${identifier}:${endpoint}`;

  const redisClient = await getRedisClient();

  if (!redisClient) {
    // Fallback: No rate limiting if Redis is not available
    console.warn('Rate limiting disabled - Redis not configured');
    return;
  }

  try {
    // Use Redis INCR for atomic rate limiting
    const current = await redisClient.incr(key);

    if (current === 1) {
      // First request, set expiry
      await redisClient.expire(key, config.window);
    }

    if (current > config.requests) {
      const ttl = await redisClient.ttl(key);
      throw new ApiError(
        ErrorCode.RATE_LIMIT_ERROR,
        `Rate limit exceeded. Try again in ${ttl} seconds`,
        429
      );
    }
  } catch (error) {
    console.error('Rate limiting error:', error);
    // Allow request to proceed if rate limiting fails
  }
}

// Subscription validation
async function validateSubscription(tenantId: string, action: string): Promise<void> {
  const supabase = getSupabaseClient();

  const { data: subscription, error } = await supabase
    .from('subscriptions')
    .select('plan, status')
    .eq('tenant_id', tenantId)
    .single();

  if (error || !subscription) {
    throw new ApiError(ErrorCode.SUBSCRIPTION_ERROR, 'No active subscription found', 403);
  }

  if (subscription.status !== 'active') {
    throw new ApiError(ErrorCode.SUBSCRIPTION_ERROR, 'Subscription is not active', 403);
  }

  // Check specific limits based on action
  const limits = {
    create_animal: { free: 5, professional: 100, farm: 500 },
    create_milk_log: { free: 50, professional: 1000, farm: 5000 },
    create_health_record: { free: 25, professional: 500, farm: 2500 },
  };

  const actionLimits = limits[action as keyof typeof limits];
  if (actionLimits) {
    const maxAllowed = actionLimits[subscription.plan as keyof typeof actionLimits] || 0;

    // Count current records
    const tableName = action.includes('animal')
      ? 'animals'
      : action.includes('milk')
        ? 'milk_logs'
        : 'health_records';

    const { count } = await supabase
      .from(tableName)
      .select('*', { count: 'exact', head: true })
      .eq('tenant_id', tenantId);

    if (count >= maxAllowed) {
      throw new ApiError(
        ErrorCode.SUBSCRIPTION_ERROR,
        `You've reached your limit of ${maxAllowed} ${tableName}. Please upgrade your subscription.`,
        403
      );
    }
  }
}

// Request validation middleware
function validateRequest(schema: z.ZodSchema, data: any): void {
  try {
    schema.parse(data);
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new ApiError(ErrorCode.VALIDATION_ERROR, 'Invalid request data', 400, error.errors);
    }
    throw new ApiError(ErrorCode.VALIDATION_ERROR, 'Request validation failed', 400);
  }
}

// Main middleware wrapper
export function withApiMiddleware<T = any>(options: {
  requireAuth?: boolean;
  requireTenant?: boolean;
  rateLimitEndpoint?: string;
  validateSchema?: z.ZodSchema;
  subscriptionAction?: string;
  version?: string;
}) {
  return async (
    request: NextRequest,
    handler: (
      req: NextRequest,
      context: {
        userId?: string;
        tenantId?: string;
        requestId: string;
      }
    ) => Promise<NextResponse<ApiResponse<T>>>
  ): Promise<NextResponse<ApiResponse<T>>> => {
    const requestId = crypto.randomUUID();
    const startTime = Date.now();

    try {
      // Extract context
      const headersList = headers();
      let userId: string | undefined;
      let tenantId: string | undefined;

      // Authentication
      if (options.requireAuth !== false) {
        const { userId: authUserId } = getAuth(request);
        if (!authUserId) {
          throw new ApiError(ErrorCode.AUTHENTICATION_ERROR, 'Authentication required', 401);
        }
        userId = authUserId;
      }

      // Tenant context
      if (options.requireTenant !== false) {
        const tenantHeader = headersList.get('x-tenant-id');
        if (!tenantHeader) {
          throw new ApiError(ErrorCode.AUTHORIZATION_ERROR, 'Tenant context required', 401);
        }
        tenantId = tenantHeader;
      }

      // Rate limiting
      if (options.rateLimitEndpoint) {
        const identifier = userId || request.ip || 'anonymous';
        await checkRateLimit(identifier, options.rateLimitEndpoint);
      }

      // Request validation
      if (options.validateSchema) {
        let body: any;
        try {
          body = await request.json();
        } catch {
          body = {};
        }
        validateRequest(options.validateSchema, body);
      }

      // Subscription validation
      if (options.subscriptionAction && tenantId) {
        await validateSubscription(tenantId, options.subscriptionAction);
      }

      // Execute handler
      const response = await handler(request, {
        userId,
        tenantId,
        requestId,
      });

      // Add response metadata
      const responseData = await response.json();
      const enhancedResponse: ApiResponse<T> = {
        ...responseData,
        meta: {
          timestamp: new Date().toISOString(),
          requestId,
          version: options.version || 'v1',
          ...(responseData.meta || {}),
        },
      };

      // Add performance headers
      const responseTime = Date.now() - startTime;
      const newResponse = NextResponse.json(enhancedResponse, {
        status: response.status,
      });

      newResponse.headers.set('x-request-id', requestId);
      newResponse.headers.set('x-response-time', `${responseTime}ms`);
      newResponse.headers.set('x-api-version', options.version || 'v1');

      return newResponse;
    } catch (error) {
      console.error('API Error:', error);

      // Handle custom API errors
      if (error instanceof ApiError) {
        const errorResponse: ApiResponse = {
          success: false,
          error: error.message,
          meta: {
            timestamp: new Date().toISOString(),
            requestId,
            version: options.version || 'v1',
          },
        };

        if (error.details) {
          errorResponse.meta = { ...errorResponse.meta, details: error.details };
        }

        return NextResponse.json(errorResponse, { status: error.statusCode });
      }

      // Handle unexpected errors
      const errorResponse: ApiResponse = {
        success: false,
        error: 'Internal server error',
        meta: {
          timestamp: new Date().toISOString(),
          requestId,
          version: options.version || 'v1',
        },
      };

      return NextResponse.json(errorResponse, { status: 500 });
    }
  };
}

// Helper functions for common responses
export const createSuccessResponse = <T>(data: T, message?: string): ApiResponse<T> => ({
  success: true,
  data,
  message,
});

export const createErrorResponse = (error: string, details?: any): ApiResponse => ({
  success: false,
  error,
  meta: details ? { details } : undefined,
});

// Audit logging helper
export async function logApiEvent(event: {
  userId?: string;
  tenantId?: string;
  action: string;
  resource: string;
  details?: any;
  requestId: string;
}) {
  const supabase = getSupabaseClient();

  await supabase.from('audit_logs').insert({
    user_id: event.userId,
    tenant_id: event.tenantId,
    action: event.action,
    resource: event.resource,
    details: event.details,
    request_id: event.requestId,
    created_at: new Date().toISOString(),
  });
}
