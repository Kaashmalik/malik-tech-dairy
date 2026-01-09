/**
 * Redis Caching Layer
 * Provides caching utilities using Upstash Redis
 */

import { Redis } from '@upstash/redis';

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

export interface CacheOptions {
  ttl?: number; // Time to live in seconds
  prefix?: string; // Key prefix
}

/**
 * Default cache TTL values (in seconds)
 */
export const CacheTTL = {
  SHORT: 60, // 1 minute
  MEDIUM: 300, // 5 minutes
  LONG: 3600, // 1 hour
  VERY_LONG: 86400, // 24 hours
};

/**
 * Generate cache key with prefix
 */
function generateKey(prefix: string, parts: (string | number)[]): string {
  return `${prefix}:${parts.join(':')}`;
}

/**
 * Get value from cache
 */
export async function cacheGet<T>(key: string, options?: CacheOptions): Promise<T | null> {
  if (!redis) return null;

  try {
    const prefixedKey = options?.prefix ? generateKey(options.prefix, [key]) : key;
    const value = await redis.get(prefixedKey);

    if (value === null) return null;

    return JSON.parse(value as string) as T;
  } catch (error) {
    console.error('Cache get error:', error);
    return null;
  }
}

/**
 * Set value in cache
 */
export async function cacheSet<T>(key: string, value: T, options?: CacheOptions): Promise<void> {
  if (!redis) return;

  try {
    const prefixedKey = options?.prefix ? generateKey(options.prefix, [key]) : key;
    const serialized = JSON.stringify(value);
    const ttl = options?.ttl || CacheTTL.MEDIUM;

    await redis.set(prefixedKey, serialized, { ex: ttl });
  } catch (error) {
    console.error('Cache set error:', error);
  }
}

/**
 * Delete value from cache
 */
export async function cacheDelete(key: string, options?: CacheOptions): Promise<void> {
  if (!redis) return;

  try {
    const prefixedKey = options?.prefix ? generateKey(options.prefix, [key]) : key;
    await redis.del(prefixedKey);
  } catch (error) {
    console.error('Cache delete error:', error);
  }
}

/**
 * Delete multiple keys matching a pattern
 */
export async function cacheDeletePattern(pattern: string, options?: CacheOptions): Promise<void> {
  if (!redis) return;

  try {
    const prefixedPattern = options?.prefix ? `${options.prefix}:${pattern}` : pattern;
    const keys = await redis.keys(prefixedPattern);

    if (keys.length > 0) {
      await redis.del(...keys);
    }
  } catch (error) {
    console.error('Cache delete pattern error:', error);
  }
}

/**
 * Clear all cache with a prefix
 */
export async function cacheClearPrefix(prefix: string): Promise<void> {
  if (!redis) return;

  try {
    const keys = await redis.keys(`${prefix}:*`);

    if (keys.length > 0) {
      await redis.del(...keys);
    }
  } catch (error) {
    console.error('Cache clear prefix error:', error);
  }
}

/**
 * Get or set pattern - fetch from cache or compute and cache
 */
export async function cacheGetOrSet<T>(
  key: string,
  factory: () => Promise<T>,
  options?: CacheOptions
): Promise<T> {
  // Try to get from cache
  const cached = await cacheGet<T>(key, options);
  if (cached !== null) {
    return cached;
  }

  // Compute value
  const value = await factory();

  // Set in cache
  await cacheSet(key, value, options);

  return value;
}

/**
 * Cache wrapper for API responses
 */
export function withCache<T>(key: string, factory: () => Promise<T>, options?: CacheOptions) {
  return async (): Promise<T> => {
    return cacheGetOrSet(key, factory, options);
  };
}

/**
 * Invalidate cache for a tenant
 */
export async function invalidateTenantCache(tenantId: string): Promise<void> {
  const patterns = [
    `tenant:${tenantId}:*`,
    `animals:${tenantId}:*`,
    `milk_logs:${tenantId}:*`,
    `health_records:${tenantId}:*`,
    `expenses:${tenantId}:*`,
    `sales:${tenantId}:*`,
  ];

  for (const pattern of patterns) {
    await cacheDeletePattern(pattern);
  }
}

/**
 * Invalidate cache for a specific resource
 */
export async function invalidateResourceCache(resource: string, resourceId: string): Promise<void> {
  const patterns = [`${resource}:${resourceId}:*`, `${resource}:${resourceId}`];

  for (const pattern of patterns) {
    await cacheDeletePattern(pattern);
  }
}

/**
 * Cache statistics
 */
export async function getCacheStats(): Promise<{
  enabled: boolean;
  keys: number;
  memory: string;
}> {
  if (!redis) {
    return {
      enabled: false,
      keys: 0,
      memory: '0B',
    };
  }

  try {
    const keys = await (redis as any).dbsize();
    const info = await (redis as any).info('memory');
    const memoryMatch = info.match(/used_memory_human:([^\r\n]+)/);
    const memory = memoryMatch ? memoryMatch[1] : '0B';

    return {
      enabled: true,
      keys,
      memory,
    };
  } catch (error) {
    console.error('Cache stats error:', error);
    return {
      enabled: true,
      keys: 0,
      memory: '0B',
    };
  }
}

/**
 * Warm up cache with frequently accessed data
 */
export async function warmUpCache(tenantId: string): Promise<void> {
  // This would be implemented to pre-populate cache
  // with frequently accessed data for a tenant
  console.log(`Warming up cache for tenant: ${tenantId}`);
}

/**
 * Cache middleware for API routes
 */
export function withCacheMiddleware<T>(
  keyGenerator: (request: Request) => string,
  options?: CacheOptions
) {
  return async (request: Request, handler: () => Promise<Response>): Promise<Response> => {
    const key = keyGenerator(request);

    // Try to get from cache
    const cached = await cacheGet<Response>(key, options);
    if (cached) {
      return cached;
    }

    // Execute handler
    const response = await handler();

    // Cache successful responses
    if (response.ok) {
      await cacheSet(key, response, options);
    }

    return response;
  };
}

/**
 * Common cache key generators
 */
export const cacheKeys = {
  animal: (tenantId: string, animalId: string) => generateKey('animals', [tenantId, animalId]),

  animalsList: (tenantId: string, params: string) =>
    generateKey('animals', [tenantId, 'list', params]),

  milkLog: (tenantId: string, logId: string) => generateKey('milk_logs', [tenantId, logId]),

  milkLogsList: (tenantId: string, params: string) =>
    generateKey('milk_logs', [tenantId, 'list', params]),

  healthRecord: (tenantId: string, recordId: string) =>
    generateKey('health_records', [tenantId, recordId]),

  healthRecordsList: (tenantId: string, params: string) =>
    generateKey('health_records', [tenantId, 'list', params]),

  expense: (tenantId: string, expenseId: string) => generateKey('expenses', [tenantId, expenseId]),

  expensesList: (tenantId: string, params: string) =>
    generateKey('expenses', [tenantId, 'list', params]),

  sale: (tenantId: string, saleId: string) => generateKey('sales', [tenantId, saleId]),

  salesList: (tenantId: string, params: string) => generateKey('sales', [tenantId, 'list', params]),

  tenant: (tenantId: string) => generateKey('tenants', [tenantId]),

  userPermissions: (tenantId: string, userId: string) =>
    generateKey('permissions', [tenantId, userId]),

  subscription: (tenantId: string) => generateKey('subscriptions', [tenantId]),
};
