/**
 * Enterprise Redis Caching Layer for MTK Dairy
 * 
 * Provides high-performance caching for:
 * - User sessions and roles
 * - Tenant subscription data
 * - Feature flags
 * - Frequently accessed data
 */

import { Redis } from '@upstash/redis';
import { logger } from '@/lib/logger';

// Lazy initialize Redis client
let redis: Redis | null = null;
let redisInitialized = false;

function getRedis(): Redis | null {
  if (redisInitialized) return redis;
  
  try {
    if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
      redis = new Redis({
        url: process.env.UPSTASH_REDIS_REST_URL,
        token: process.env.UPSTASH_REDIS_REST_TOKEN,
      });
    }
  } catch (error) {
    logger.warn('Redis initialization failed, caching disabled', { error });
  }
  
  redisInitialized = true;
  return redis;
}

// Cache key prefixes
export const CachePrefix = {
  USER_ROLE: 'user_role:',
  TENANT_SUBSCRIPTION: 'tenant_sub:',
  TENANT_LIMITS: 'tenant_limits:',
  FEATURE_FLAGS: 'feature_flags:',
  USER_SESSION: 'session:',
  ANALYTICS: 'analytics:',
  RATE_LIMIT: 'rate_limit:',
} as const;

// Default TTL values (in seconds)
export const CacheTTL = {
  SHORT: 60,           // 1 minute
  MEDIUM: 300,         // 5 minutes
  LONG: 3600,          // 1 hour
  VERY_LONG: 86400,    // 24 hours
  SESSION: 604800,     // 7 days
} as const;

/**
 * Generic cache get with type safety
 */
export async function cacheGet<T>(key: string): Promise<T | null> {
  const client = getRedis();
  if (!client) return null;

  try {
    const value = await client.get<T>(key);
    return value;
  } catch (error) {
    logger.warn('Cache get failed', { key, error });
    return null;
  }
}

/**
 * Generic cache set with TTL
 */
export async function cacheSet<T>(
  key: string, 
  value: T, 
  ttlSeconds: number = CacheTTL.MEDIUM
): Promise<boolean> {
  const client = getRedis();
  if (!client) return false;

  try {
    await client.set(key, value, { ex: ttlSeconds });
    return true;
  } catch (error) {
    logger.warn('Cache set failed', { key, error });
    return false;
  }
}

/**
 * Cache delete
 */
export async function cacheDelete(key: string): Promise<boolean> {
  const client = getRedis();
  if (!client) return false;

  try {
    await client.del(key);
    return true;
  } catch (error) {
    logger.warn('Cache delete failed', { key, error });
    return false;
  }
}

/**
 * Delete multiple keys by pattern
 */
export async function cacheDeletePattern(pattern: string): Promise<boolean> {
  const client = getRedis();
  if (!client) return false;

  try {
    const keys = await client.keys(pattern);
    if (keys.length > 0) {
      await client.del(...keys);
    }
    return true;
  } catch (error) {
    logger.warn('Cache delete pattern failed', { pattern, error });
    return false;
  }
}

/**
 * Cache with automatic fetch on miss (cache-aside pattern)
 */
export async function cacheGetOrFetch<T>(
  key: string,
  fetchFn: () => Promise<T>,
  ttlSeconds: number = CacheTTL.MEDIUM
): Promise<T> {
  // Try cache first
  const cached = await cacheGet<T>(key);
  if (cached !== null) {
    return cached;
  }

  // Fetch fresh data
  const fresh = await fetchFn();
  
  // Cache the result (don't await - fire and forget)
  cacheSet(key, fresh, ttlSeconds);
  
  return fresh;
}

// ============================================
// Specialized Caching Functions
// ============================================

/**
 * Get user role from cache or database
 */
export async function getCachedUserRole(
  tenantId: string, 
  userId: string,
  fetchFn: () => Promise<string>
): Promise<string> {
  const key = `${CachePrefix.USER_ROLE}${tenantId}:${userId}`;
  return cacheGetOrFetch(key, fetchFn, CacheTTL.MEDIUM);
}

/**
 * Invalidate user role cache
 */
export async function invalidateUserRoleCache(tenantId: string, userId: string): Promise<void> {
  const key = `${CachePrefix.USER_ROLE}${tenantId}:${userId}`;
  await cacheDelete(key);
}

/**
 * Get tenant subscription from cache
 */
export interface CachedSubscription {
  plan: 'free' | 'professional' | 'farm' | 'enterprise';
  status: string;
  renewDate: string;
  limits: {
    maxAnimals: number;
    maxUsers: number;
    maxMilkLogs: number;
  };
}

export async function getCachedTenantSubscription(
  tenantId: string,
  fetchFn: () => Promise<CachedSubscription>
): Promise<CachedSubscription> {
  const key = `${CachePrefix.TENANT_SUBSCRIPTION}${tenantId}`;
  return cacheGetOrFetch(key, fetchFn, CacheTTL.LONG);
}

/**
 * Invalidate tenant subscription cache
 */
export async function invalidateTenantSubscriptionCache(tenantId: string): Promise<void> {
  const key = `${CachePrefix.TENANT_SUBSCRIPTION}${tenantId}`;
  await cacheDelete(key);
}

/**
 * Get feature flags from cache
 */
export async function getCachedFeatureFlags(
  tenantId: string,
  fetchFn: () => Promise<Record<string, boolean>>
): Promise<Record<string, boolean>> {
  const key = `${CachePrefix.FEATURE_FLAGS}${tenantId}`;
  return cacheGetOrFetch(key, fetchFn, CacheTTL.MEDIUM);
}

/**
 * Cache analytics data (longer TTL)
 */
export async function cacheAnalytics<T>(
  tenantId: string,
  analyticsKey: string,
  data: T
): Promise<void> {
  const key = `${CachePrefix.ANALYTICS}${tenantId}:${analyticsKey}`;
  await cacheSet(key, data, CacheTTL.LONG);
}

export async function getCachedAnalytics<T>(
  tenantId: string,
  analyticsKey: string
): Promise<T | null> {
  const key = `${CachePrefix.ANALYTICS}${tenantId}:${analyticsKey}`;
  return cacheGet<T>(key);
}

/**
 * Increment counter (for rate limiting, analytics)
 */
export async function incrementCounter(
  key: string, 
  ttlSeconds: number = CacheTTL.SHORT
): Promise<number> {
  const client = getRedis();
  if (!client) return 0;

  try {
    const count = await client.incr(key);
    if (count === 1) {
      await client.expire(key, ttlSeconds);
    }
    return count;
  } catch (error) {
    logger.warn('Counter increment failed', { key, error });
    return 0;
  }
}

/**
 * Health check for Redis connection
 */
export async function checkCacheHealth(): Promise<{
  connected: boolean;
  latencyMs?: number;
  error?: string;
}> {
  const client = getRedis();
  if (!client) {
    return { connected: false, error: 'Redis not configured' };
  }

  try {
    const start = performance.now();
    await client.ping();
    const latencyMs = Math.round(performance.now() - start);
    return { connected: true, latencyMs };
  } catch (error) {
    return { 
      connected: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}
