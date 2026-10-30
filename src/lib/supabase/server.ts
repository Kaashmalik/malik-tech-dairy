// Supabase server-only client (service role, PostgREST over HTTPS).
// This file should NEVER be imported on the client side.
//
// Runtime data access is REST-only: direct Postgres connections (Drizzle /
// postgres-js) were unreliable from Vercel serverless and caused production 500s.
// Drizzle remains a dev dependency for schema and migrations (drizzle.config.ts).
// For tenant data use tenantDb() from ./tenant-db, which enforces tenant_id.
import { createClient, SupabaseClient } from '@supabase/supabase-js';

let supabaseClient: SupabaseClient | null = null;

/**
 * Get the service-role Supabase client (server-only). Bypasses RLS - prefer
 * tenantDb(tenantId) for tenant data.
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
