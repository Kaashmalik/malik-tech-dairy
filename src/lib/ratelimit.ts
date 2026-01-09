// Rate Limiting using Upstash Redis
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';
import { NextRequest, NextResponse } from 'next/server';

// Check if Redis is configured
const isRedisConfigured = !!(
  process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN
);

let redis: Redis | null = null;
if (isRedisConfigured) {
  redis = new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL!,
    token: process.env.UPSTASH_REDIS_REST_TOKEN!,
  });
}

// Get client IP address from request
function getClientIp(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for');
  const realIp = request.headers.get('x-real-ip');

  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }

  if (realIp) {
    return realIp;
  }

  return 'anonymous';
}

/**
 * Create a mock rate limiter for when Redis is not configured
 * This allows the application to function without Redis while maintaining the same interface
 */
function createMockRateLimiter() {
  const mockLimiter = {
    async limit(_identifier: string) {
      return {
        success: true,
        limit: 1000,
        remaining: 999,
        reset: Date.now() + 60000,
      };
    },
    // Add other required properties to match Ratelimit interface
    limiter: {
      async limit(_identifier: string) {
        return {
          success: true,
          limit: 1000,
          remaining: 999,
          reset: Date.now() + 60000,
        };
      },
    },
    ctx: null,
    prefix: 'mock',
    timeout: 1000,
    analytics: false,
  } as unknown as Ratelimit;

  return mockLimiter;
}

/**
 * Strict limits for sensitive operations (5 requests per 10 seconds)
 */
export const strictRateLimit: Ratelimit = redis
  ? new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(5, '10 s'),
      analytics: true,
      prefix: 'ratelimit:strict',
    })
  : createMockRateLimiter();

/**
 * Standard limits for regular API endpoints (20 requests per minute)
 */
export const standardRateLimit: Ratelimit = redis
  ? new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(20, '1 m'),
      analytics: true,
      prefix: 'ratelimit:standard',
    })
  : createMockRateLimiter();

/**
 * Lenient limits for read operations (100 requests per minute)
 */
export const lenientRateLimit: Ratelimit = redis
  ? new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(100, '1 m'),
      analytics: true,
      prefix: 'ratelimit:lenient',
    })
  : createMockRateLimiter();

/**
 * Very strict for authentication (3 requests per 5 minutes)
 */
export const authRateLimit: Ratelimit = redis
  ? new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(3, '5 m'),
      analytics: true,
      prefix: 'ratelimit:auth',
    })
  : createMockRateLimiter();

/**
 * IP-based rate limiting (100 requests per minute per IP)
 */
export const ipRateLimit: Ratelimit = redis
  ? new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(100, '1 m'),
      analytics: true,
      prefix: 'ratelimit:ip',
    })
  : createMockRateLimiter();

/**
 * Tenant-based rate limiting (1000 requests per minute per tenant)
 */
export const tenantRateLimit: Ratelimit = redis
  ? new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(1000, '1 m'),
      analytics: true,
      prefix: 'ratelimit:tenant',
    })
  : createMockRateLimiter();

/**
 * Upload rate limiting (10 uploads per hour)
 */
export const uploadRateLimit: Ratelimit = redis
  ? new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(10, '1 h'),
      analytics: true,
      prefix: 'ratelimit:upload',
    })
  : createMockRateLimiter();

/**
 * Webhook rate limiting (50 requests per minute)
 */
export const webhookRateLimit: Ratelimit = redis
  ? new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(50, '1 m'),
      analytics: true,
      prefix: 'ratelimit:webhook',
    })
  : createMockRateLimiter();

// Legacy rate limiters (kept for backward compatibility)
export const apiRateLimit = ipRateLimit;

/**
 * Check rate limit and return error response if needed
 */
export async function checkRateLimit(
  limiter: Ratelimit,
  identifier: string
): Promise<{ success: boolean; limit: number; remaining: number; reset: number }> {
  try {
    const result = await limiter.limit(identifier);
    return result;
  } catch (error) {
    console.error('Rate limiting error:', error);
    // Fail open - allow request if rate limiting fails
    return { success: true, limit: 1000, remaining: 999, reset: Date.now() + 60000 };
  }
}

/**
 * Create rate limit error response
 */
export function createRateLimitResponse(result: {
  limit: number;
  remaining: number;
  reset: number;
}): NextResponse {
  return NextResponse.json(
    {
      success: false,
      error: 'Too many requests',
      code: 'RATE_LIMITED',
      details: {
        limit: result.limit,
        reset: new Date(result.reset).toISOString(),
      },
    },
    {
      status: 429,
      headers: {
        'X-RateLimit-Limit': result.limit.toString(),
        'X-RateLimit-Remaining': result.remaining.toString(),
        'X-RateLimit-Reset': new Date(result.reset).toISOString(),
        'Retry-After': Math.ceil((result.reset - Date.now()) / 1000).toString(),
      },
    }
  );
}

/**
 * Add rate limit headers to response
 */
export function addRateLimitHeaders(
  response: NextResponse,
  result: { limit: number; remaining: number; reset: number }
): NextResponse {
  response.headers.set('X-RateLimit-Limit', result.limit.toString());
  response.headers.set('X-RateLimit-Remaining', result.remaining.toString());
  response.headers.set('X-RateLimit-Reset', new Date(result.reset).toISOString());

  return response;
}

/**
 * Rate limit middleware for API routes
 */
export async function withRateLimit(
  request: NextRequest,
  limiter: Ratelimit,
  identifier?: string
): Promise<NextResponse | null> {
  const ip = getClientIp(request);
  const id = identifier || ip;

  const result = await checkRateLimit(limiter, id);

  if (!result.success) {
    return createRateLimitResponse(result);
  }

  return null;
}
