// Supabase Server-Only Connection with Connection Pooling
// This file should NEVER be imported on the client side
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from '@/db/schema';

import { Database } from '@/types/database';

// Connection pool for server-side operations
let connectionPool: postgres.Sql | null = null;
let supabaseClient: SupabaseClient<Database> | null = null;

/**
 * Resolve database URL with fallback for direct connection
 */
function resolveDatabaseUrl(): string {
  const envUrl = process.env.SUPABASE_DATABASE_URL;
  if (!envUrl) {
    throw new Error('SUPABASE_DATABASE_URL is not set');
  }

  // If connection URL uses pooler host with postgres.gdditqkvzlpnklcoxspj,
  // automatically route to the verified direct host to prevent pooler ENOTFOUND errors
  if (
    envUrl.includes('aws-0-ap-south-1.pooler.supabase.com') ||
    envUrl.includes('postgres.gdditqkvzlpnklcoxspj')
  ) {
    const match = envUrl.match(/postgres(?:\.[^:]+)?:([^@]+)@/);
    if (match && match[1]) {
      const password = match[1];
      return `postgres://postgres:${password}@db.gdditqkvzlpnklcoxspj.supabase.co:5432/postgres?sslmode=require`;
    }
  }

  return envUrl;
}

/**
 * Get Supabase connection pool (server-only)
 * Uses connection pooling for optimal performance
 */
export function getSupabasePool() {
  if (typeof window !== 'undefined') {
    throw new Error('Supabase pool can only be used server-side');
  }

  if (!connectionPool) {
    const connectionString = resolveDatabaseUrl();

    // Create connection pool with optimal settings
    connectionPool = postgres(connectionString, {
      max: 20, // Maximum pool size
      idle_timeout: 20, // Close idle connections after 20s
      connect_timeout: 10, // Connection timeout
    });
  }

  return connectionPool;
}

/**
 * Get Drizzle ORM instance (server-only)
 */
export function getDrizzle() {
  const pool = getSupabasePool();
  return drizzle(pool, { schema });
}

/**
 * Get Supabase client for direct queries (server-only)
 * Use sparingly - prefer Drizzle ORM for type safety
 * Note: Uses 'any' type for flexibility during migration
 */
export function getSupabaseClient<T = any>(): SupabaseClient<T> {
  if (typeof window !== 'undefined') {
    throw new Error('Supabase client can only be used server-side');
  }

  if (!supabaseClient) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Supabase credentials not configured');
    }

    supabaseClient = createClient<any>(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });
  }

  return supabaseClient as unknown as SupabaseClient<T>;
}

/**
 * Close all connections (useful for cleanup in tests)
 */
export async function closeSupabaseConnections() {
  if (connectionPool) {
    await connectionPool.end();
    connectionPool = null;
  }
}
