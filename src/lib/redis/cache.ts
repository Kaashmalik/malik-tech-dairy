// Redis Caching Layer for Firestore Queries
// Uses Upstash Redis for caching frequently accessed Firestore data
import { Redis } from '@upstash/redis';
let redis: Redis | null = null;
let redisDisabled = false;
/**
 * Check if Redis is configured
 */
function isRedisConfigured(): boolean {
  return !!(process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN);
}
/**
 * Get Redis client (singleton)
 * Returns null if Redis is not configured (graceful degradation)
 */
function getRedis(): Redis | null {
  if (redisDisabled) {
    return null;
  }
  if (!redis) {
    const url = process.env.UPSTASH_REDIS_REST_URL;
    const token = process.env.UPSTASH_REDIS_REST_TOKEN;
    if (!url || !token) {
      // Redis not configured - disable silently for development
      redisDisabled = true;
      return null;
    }
    redis = new Redis({
      url,
      token,
    });
  }
  return redis;
}
/**
 * Cache key generators
 */
export const cacheKeys = {
  tenantConfig: (tenantId: string) => `tenant:config:${tenantId}`,
  tenantSubscription: (tenantId: string) => `tenant:subscription:${tenantId}`,
  tenantLimits: (tenantId: string) => `tenant:limits:${tenantId}`,
  animalCount: (tenantId: string) => `tenant:animals:count:${tenantId}`,
  milkLogs: (tenantId: string, date: string) => `tenant:milk:${tenantId}:${date}`,
  healthRecords: (tenantId: string, animalId: string) => `tenant:health:${tenantId}:${animalId}`,
  lowYieldAnimals: (tenantId: string) => `tenant:animals:low-yield:${tenantId}`,
};
/**
 * Get cached value
 */
export async function getCache<T>(key: string): Promise<T | null> {
  try {
    const client = getRedis();
    if (!client) return null; // Redis not configured
    const value = await client.get<T>(key);
    return value;
  } catch (error) {
    return null; // Fail gracefully - return null on cache miss/error
  }
}
/**
 * Set cached value with TTL
 */
export async function setCache<T>(
  key: string,
  value: T,
  ttlSeconds: number = 300 // Default 5 minutes
): Promise<void> {
  try {
    const client = getRedis();
    if (!client) return; // Redis not configured
    await client.setex(key, ttlSeconds, value);
  } catch (error) {
    // Fail silently - caching is not critical
  }
}
/**
 * Delete cached value
 */
export async function deleteCache(key: string): Promise<void> {
  try {
    const client = getRedis();
    if (!client) return; // Redis not configured
    await client.del(key);
  } catch (error) {
    // Fail silently
  }
}
/**
 * Delete cache by pattern (use with caution - expensive operation)
 */
export async function deleteCachePattern(pattern: string): Promise<void> {
  try {
    const client = getRedis();
    if (!client) return; // Redis not configured
    // Upstash Redis doesn't support KEYS command, so we'll use SCAN
    // For now, we'll just log - implement if needed
  } catch (error) {
  }
}
/**
 * Invalidate tenant-related caches
 */
export async function invalidateTenantCache(tenantId: string): Promise<void> {
  const keys = [
    cacheKeys.tenantConfig(tenantId),
    cacheKeys.tenantSubscription(tenantId),
    cacheKeys.tenantLimits(tenantId),
    cacheKeys.animalCount(tenantId),
    cacheKeys.lowYieldAnimals(tenantId),
  ];
  await Promise.all(keys.map(key => deleteCache(key)));
}
/**
 * Cache wrapper for async functions
 */
export async function withCache<T>(
  key: string,
  fn: () => Promise<T>,
  ttlSeconds: number = 300
): Promise<T> {
  // Try cache first
  const cached = await getCache<T>(key);
  if (cached !== null) {
    return cached;
  }
  // Cache miss - execute function
  const result = await fn();
  // Cache result
  await setCache(key, result, ttlSeconds);
  return result;
}