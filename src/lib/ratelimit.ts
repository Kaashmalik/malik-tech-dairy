// Rate Limiting using Upstash Redis
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

// Check if Redis is configured
const isRedisConfigured = !!(process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN);

// Create a mock rate limiter for when Redis is not configured
const createMockRateLimiter = () => ({
  limit: async (_identifier: string) => ({ success: true, reset: Date.now() + 60000 }),
});

let redis: Redis | null = null;
if (isRedisConfigured) {
  redis = new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL!,
    token: process.env.UPSTASH_REDIS_REST_TOKEN!,
  });
}

// IP-based rate limiting: 100 requests per minute per IP
export const ipRateLimit = redis
  ? new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(100, "1 m"),
      analytics: true,
      prefix: "ratelimit:ip",
    })
  : createMockRateLimiter();

// Tenant-based rate limiting: 1000 requests per minute per tenant
export const tenantRateLimit = redis
  ? new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(1000, "1 m"),
      analytics: true,
      prefix: "ratelimit:tenant",
    })
  : createMockRateLimiter();

// Legacy rate limiters (kept for backward compatibility)
export const apiRateLimit = ipRateLimit;

export const authRateLimit = redis
  ? new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(5, "1 m"), // 5 requests per minute for auth
      analytics: true,
      prefix: "ratelimit:auth",
    })
  : createMockRateLimiter();

export const uploadRateLimit = redis
  ? new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(10, "1 h"), // 10 uploads per hour
      analytics: true,
      prefix: "ratelimit:upload",
    })
  : createMockRateLimiter();
