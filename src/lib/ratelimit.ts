// Rate Limiting using Upstash Redis
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL || "",
  token: process.env.UPSTASH_REDIS_REST_TOKEN || "",
});

// IP-based rate limiting: 100 requests per minute per IP
export const ipRateLimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(100, "1 m"),
  analytics: true,
  prefix: "ratelimit:ip",
});

// Tenant-based rate limiting: 1000 requests per minute per tenant
export const tenantRateLimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(1000, "1 m"),
  analytics: true,
  prefix: "ratelimit:tenant",
});

// Legacy rate limiters (kept for backward compatibility)
export const apiRateLimit = ipRateLimit;
export const authRateLimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(5, "1 m"), // 5 requests per minute for auth
  analytics: true,
  prefix: "ratelimit:auth",
});

export const uploadRateLimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(10, "1 h"), // 10 uploads per hour
  analytics: true,
  prefix: "ratelimit:upload",
});
