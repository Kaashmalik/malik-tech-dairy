// Supabase Server-Only Connection with Connection Pooling
// This file should NEVER be imported on the client side
import { createClient } from '@supabase/supabase-js';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';

// Connection pool for server-side operations
let connectionPool: postgres.Sql | null = null;
let supabaseClient: ReturnType<typeof createClient> | null = null;

/**
 * Get Supabase connection pool (server-only)
 * Uses connection pooling for optimal performance
 */
export function getSupabasePool() {
  if (typeof window !== 'undefined') {
    throw new Error('Supabase pool can only be used server-side');
  }

  if (!connectionPool) {
    const connectionString = process.env.SUPABASE_DATABASE_URL;
    
    if (!connectionString) {
      throw new Error('SUPABASE_DATABASE_URL is not set');
    }

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
  return drizzle(pool);
}

/**
 * Get Supabase client for direct queries (server-only)
 * Use sparingly - prefer Drizzle ORM for type safety
 */
export function getSupabaseClient() {
  if (typeof window !== 'undefined') {
    throw new Error('Supabase client can only be used server-side');
  }

  if (!supabaseClient) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Supabase credentials not configured');
    }

    supabaseClient = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });
  }

  return supabaseClient;
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

