// Enterprise Performance Optimization Layer
// Multi-layer caching, query optimization, and performance monitoring

import { getSupabaseClient } from '@/lib/supabase';
import { Redis } from '@upstash/redis';
import { performance } from 'perf_hooks';

// Redis client for caching (with error handling)
let redis: Redis | null = null;

try {
  if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
    redis = new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN,
    });
    console.log('Redis cache initialized successfully');
  } else {
    console.warn('Redis not configured - caching disabled');
  }
} catch (error) {
  console.error('Failed to initialize Redis:', error);
  redis = null;
}

// Cache configuration
interface CacheConfig {
  ttl: number; // Time to live in seconds
  key: string;
  tags?: string[];
}

// Default cache TTLs for different data types
const CACHE_TTL = {
  animal_list: 300, // 5 minutes
  milk_stats: 600, // 10 minutes
  health_records: 300, // 5 minutes
  dashboard_data: 180, // 3 minutes
  analytics: 900, // 15 minutes
  user_profile: 3600, // 1 hour
} as const;

// Performance monitoring
class PerformanceMonitor {
  private static metrics = new Map<
    string,
    {
      count: number;
      totalTime: number;
      avgTime: number;
      minTime: number;
      maxTime: number;
    }
  >();

  static startTimer(operation: string): () => void {
    const startTime = performance.now();
    return () => {
      const duration = performance.now() - startTime;
      this.recordMetric(operation, duration);
    };
  }

  private static recordMetric(operation: string, duration: number): void {
    const existing = this.metrics.get(operation) || {
      count: 0,
      totalTime: 0,
      avgTime: 0,
      minTime: Infinity,
      maxTime: 0,
    };

    const updated = {
      count: existing.count + 1,
      totalTime: existing.totalTime + duration,
      avgTime: (existing.totalTime + duration) / (existing.count + 1),
      minTime: Math.min(existing.minTime, duration),
      maxTime: Math.max(existing.maxTime, duration),
    };

    this.metrics.set(operation, updated);

    // Log slow queries
    if (duration > 1000) {
      console.warn(`Slow query detected: ${operation} took ${duration.toFixed(2)}ms`);
    }
  }

  static getMetrics(): Record<string, any> {
    return Object.fromEntries(this.metrics);
  }

  static resetMetrics(): void {
    this.metrics.clear();
  }
}

// Cache manager
class CacheManager {
  static async get<T>(key: string): Promise<T | null> {
    if (!redis) return null;
    try {
      const cached = await redis.get(key);
      return cached ? JSON.parse(cached) : null;
    } catch (error) {
      console.error('Cache get error:', error);
      return null;
    }
  }

  static async set(key: string, value: any, ttl: number): Promise<void> {
    if (!redis) return;
    try {
      await redis.setex(key, ttl, JSON.stringify(value));
    } catch (error) {
      console.error('Cache set error:', error);
    }
  }

  static async invalidate(pattern: string): Promise<void> {
    if (!redis) return;
    try {
      const keys = await redis.keys(pattern);
      if (keys.length > 0) {
        await redis.del(...keys);
      }
    } catch (error) {
      console.error('Cache invalidation error:', error);
    }
  }

  static async invalidateByTags(tags: string[]): Promise<void> {
    if (!redis) return;
    for (const tag of tags) {
      await this.invalidate(`*:${tag}:*`);
    }
  }

  static generateKey(tenantId: string, type: string, identifier: string): string {
    return `mtk:${tenantId}:${type}:${identifier}`;
  }
}

// Optimized database query builder
class OptimizedQueryBuilder {
  private supabase = getSupabaseClient();
  private query: any;
  private cacheConfig: CacheConfig | null = null;

  constructor(table: string) {
    this.query = this.supabase.from(table);
  }

  select(columns: string = '*'): OptimizedQueryBuilder {
    this.query = this.query.select(columns);
    return this;
  }

  where(column: string, operator: string, value: any): OptimizedQueryBuilder {
    this.query = this.query.where(column, operator, value);
    return this;
  }

  eq(column: string, value: any): OptimizedQueryBuilder {
    this.query = this.query.eq(column, value);
    return this;
  }

  in(column: string, values: any[]): OptimizedQueryBuilder {
    this.query = this.query.in(column, values);
    return this;
  }

  order(column: string, options?: { ascending: boolean }): OptimizedQueryBuilder {
    this.query = this.query.order(column, options);
    return this;
  }

  limit(count: number): OptimizedQueryBuilder {
    this.query = this.query.limit(count);
    return this;
  }

  range(from: number, to: number): OptimizedQueryBuilder {
    this.query = this.query.range(from, to);
    return this;
  }

  cache(config: Partial<CacheConfig>): OptimizedQueryBuilder {
    this.cacheConfig = {
      ttl: 300, // Default 5 minutes
      key: '',
      ...config,
    };
    return this;
  }

  async execute(): Promise<any> {
    const endTimer = PerformanceMonitor.startTimer('db_query');

    try {
      // Check cache first
      if (this.cacheConfig) {
        const cacheKey = this.cacheConfig.key || this.generateCacheKey();
        const cached = await CacheManager.get(cacheKey);
        if (cached) {
          endTimer();
          return cached;
        }
      }

      // Execute query
      const result = await this.query;

      // Cache result if configured
      if (this.cacheConfig && !result.error) {
        const cacheKey = this.cacheConfig.key || this.generateCacheKey();
        await CacheManager.set(cacheKey, result, this.cacheConfig.ttl);
      }

      endTimer();
      return result;
    } catch (error) {
      endTimer();
      throw error;
    }
  }

  private generateCacheKey(): string {
    // Generate a hash of the query parameters
    const queryStr = JSON.stringify(this.query);
    return `query:${Buffer.from(queryStr).toString('base64').slice(0, 16)}`;
  }
}

// Optimized service functions
export class OptimizedDataService {
  static async getAnimalsWithCache(
    tenantId: string,
    options: {
      page?: number;
      limit?: number;
      search?: string;
    } = {}
  ) {
    const cacheKey = CacheManager.generateKey(
      tenantId,
      'animals',
      `page:${options.page || 1}_limit:${options.limit || 30}_search:${options.search || ''}`
    );

    return new OptimizedQueryBuilder('animals')
      .select(
        'id, tag, name, species, breed, date_of_birth, gender, photo_url, status, current_weight'
      )
      .eq('tenant_id', tenantId)
      .cache({ key: cacheKey, ttl: CACHE_TTL.animal_list })
      .execute();
  }

  static async getMilkStatsWithCache(tenantId: string, days: number = 30) {
    const cacheKey = CacheManager.generateKey(tenantId, 'milk_stats', `days:${days}`);

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - days);

    return new OptimizedQueryBuilder('milk_logs')
      .select('date, yield, animal_id')
      .eq('tenant_id', tenantId)
      .gte('date', thirtyDaysAgo.toISOString().split('T')[0])
      .cache({ key: cacheKey, ttl: CACHE_TTL.milk_stats })
      .execute();
  }

  static async getDashboardDataWithCache(tenantId: string) {
    const cacheKey = CacheManager.generateKey(tenantId, 'dashboard_data', 'overview');

    // Parallel execution of multiple queries
    const [animalsResult, milkResult, healthResult] = await Promise.all([
      new OptimizedQueryBuilder('animals')
        .select('id, status', { count: 'exact' })
        .eq('tenant_id', tenantId)
        .execute(),

      new OptimizedQueryBuilder('milk_logs')
        .select('yield', { count: 'exact' })
        .eq('tenant_id', tenantId)
        .gte('date', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0])
        .execute(),

      new OptimizedQueryBuilder('health_records')
        .select('id', { count: 'exact' })
        .eq('tenant_id', tenantId)
        .gte('date', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0])
        .execute(),
    ]);

    return {
      animals: animalsResult,
      milk: milkResult,
      health: healthResult,
    };
  }

  static async invalidateTenantCache(tenantId: string, type?: string): Promise<void> {
    if (type) {
      await CacheManager.invalidate(`mtk:${tenantId}:${type}:*`);
    } else {
      await CacheManager.invalidate(`mtk:${tenantId}:*`);
    }
  }

  static getPerformanceMetrics(): Record<string, any> {
    return PerformanceMonitor.getMetrics();
  }

  static resetPerformanceMetrics(): void {
    PerformanceMonitor.resetMetrics();
  }
}

// Database optimization utilities
export class DatabaseOptimizer {
  // Suggest indexes for better query performance
  static async analyzeSlowQueries(): Promise<string[]> {
    const suggestions = [
      'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_milk_logs_tenant_date ON milk_logs(tenant_id, date DESC);',
      'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_health_records_tenant_date ON health_records(tenant_id, date DESC);',
      'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_animals_tenant_status ON animals(tenant_id, status);',
      'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_animals_tenant_species ON animals(tenant_id, species);',
    ];

    return suggestions;
  }

  // Optimize database connections
  static async optimizeConnectionPool(): Promise<void> {
    // This would be implemented in your Supabase configuration
    console.log('Connection pool optimization should be configured in Supabase dashboard');
  }
}

// Export utilities
export { PerformanceMonitor, CacheManager, OptimizedQueryBuilder };

// Performance monitoring middleware
export function withPerformanceMonitoring(operation: string) {
  return function (target: any, propertyName: string, descriptor: PropertyDescriptor) {
    const method = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      const endTimer = PerformanceMonitor.startTimer(`${target.constructor.name}:${propertyName}`);
      try {
        const result = await method.apply(this, args);
        endTimer();
        return result;
      } catch (error) {
        endTimer();
        throw error;
      }
    };

    return descriptor;
  };
}
