// Client-side Supabase configuration
import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { SupabaseClient } from '@supabase/supabase-js';

// Create a singleton client for the browser
// Using 'any' type for flexibility with dynamic table operations
let client: SupabaseClient<any> | null = null;

export const createClientComponent = (): SupabaseClient<any> => {
  if (!client) {
    client = createSupabaseClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
  }
  return client;
};

// Export as createClient for backward compatibility
export const createClient = createClientComponent;
