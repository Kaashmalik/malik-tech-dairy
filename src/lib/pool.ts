/**
 * Database Connection Pool Configuration
 * Optimized connection pooling for Supabase PostgreSQL
 */

import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';

// Connection pool configuration
export const poolConfig = {
  // Maximum number of connections in the pool
  max: 20,

  // Minimum number of connections to keep in the pool
  min: 2,

  // How long to wait for a connection to become available (ms)
  idleTimeoutMillis: 30000,

  // How long a connection can be idle before being closed (ms)
  connectionTimeoutMillis: 10000,

  // Enable prepared statements for better performance
  prepare: true,

  // Maximum number of statements to prepare per connection
  maxPreparedStatementCacheSize: 100,

  // Enable query logging in development
  debug: process.env.NODE_ENV === 'development',

  // Transform column names to camelCase
  transform: postgres.camel,
};

/**
 * Create a connection pool with optimized settings
 */
export function createConnectionPool(connectionString: string) {
  return postgres(connectionString, {
    ...poolConfig,
    // Connection lifecycle callbacks
    onnotice: notice => {
      console.log('PostgreSQL notice:', notice);
    },
    onparameter: (key, value) => {
      if (process.env.NODE_ENV === 'development') {
        console.log('PostgreSQL parameter:', key, value);
      }
    },
  });
}

/**
 * Get connection pool statistics
 */
export async function getPoolStats(pool: postgres.Sql<Record<string, never>>) {
  // Note: postgres-js doesn't expose detailed pool stats
  // This is a placeholder for monitoring
  return {
    totalConnections: poolConfig.max,
    idleConnections: poolConfig.min,
    activeConnections: 0,
    waitingClients: 0,
  };
}

/**
 * Health check for database connection
 */
export async function checkDatabaseHealth(
  pool: postgres.Sql<Record<string, never>>
): Promise<{ healthy: boolean; latency?: number; error?: string }> {
  const start = performance.now();

  try {
    await pool`SELECT 1`;
    const latency = Math.round(performance.now() - start);

    return {
      healthy: true,
      latency,
    };
  } catch (error) {
    return {
      healthy: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Graceful shutdown of connection pool
 */
export async function shutdownPool(pool: postgres.Sql<Record<string, never>>): Promise<void> {
  try {
    await pool.end({ timeout: 5 });
    console.log('Database connection pool shut down gracefully');
  } catch (error) {
    console.error('Error shutting down connection pool:', error);
  }
}

/**
 * Connection pool middleware for serverless environments
 */
export function withConnectionPool<T>(
  handler: (pool: postgres.Sql<Record<string, never>>) => Promise<T>
) {
  return async (): Promise<T> => {
    const connectionString = process.env.SUPABASE_DATABASE_URL;

    if (!connectionString) {
      throw new Error('SUPABASE_DATABASE_URL not configured');
    }

    const pool = createConnectionPool(connectionString);

    try {
      return await handler(pool);
    } finally {
      // In serverless, we close the connection after use
      // In long-running processes, we'd keep the pool alive
      if (process.env.NODE_ENV === 'production') {
        await pool.end();
      }
    }
  };
}

/**
 * Monitor pool performance
 */
export class PoolMonitor {
  private queryCount = 0;
  private slowQueries = 0;
  private errors = 0;
  private startTime = Date.now();

  recordQuery(duration: number, error?: boolean) {
    this.queryCount++;

    if (error) {
      this.errors++;
    } else if (duration > 1000) {
      // Queries over 1 second are considered slow
      this.slowQueries++;
    }
  }

  getStats() {
    const uptime = Date.now() - this.startTime;
    const avgQueriesPerSecond = (this.queryCount / (uptime / 1000)).toFixed(2);
    const errorRate = ((this.errors / this.queryCount) * 100).toFixed(2);
    const slowQueryRate = ((this.slowQueries / this.queryCount) * 100).toFixed(2);

    return {
      totalQueries: this.queryCount,
      slowQueries: this.slowQueries,
      errors: this.errors,
      uptime: `${Math.floor(uptime / 1000)}s`,
      avgQueriesPerSecond,
      errorRate: `${errorRate}%`,
      slowQueryRate: `${slowQueryRate}%`,
    };
  }

  reset() {
    this.queryCount = 0;
    this.slowQueries = 0;
    this.errors = 0;
    this.startTime = Date.now();
  }
}

export const poolMonitor = new PoolMonitor();
