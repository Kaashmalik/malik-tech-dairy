// Client-side Supabase configuration
import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { Database } from '@/types/database';
import { SupabaseClient } from '@supabase/supabase-js';

// Create a singleton client for the browser
let client: SupabaseClient<Database> | null = null;

export const createClientComponent = (): SupabaseClient<Database> => {
  if (!client) {
    client = createSupabaseClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
  }
  return client;
};

// Export as createClient for backward compatibility
export const createClient = createClientComponent;
