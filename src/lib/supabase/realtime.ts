// Supabase Realtime Subscriptions
// Replaces Firebase Realtime Database for milk_logs and health_events
import { getSupabaseClient } from '../supabase';
import { RealtimeChannel } from '@supabase/supabase-js';

/**
 * Subscribe to milk logs updates for a tenant
 * Uses Supabase Realtime (PostgreSQL change events)
 */
export function subscribeToMilkLogs(
  tenantId: string,
  callback: (payload: any) => void
): () => void {
  const supabase = getSupabaseClient();

  // Subscribe to changes in milk_logs table (via Supabase Realtime)
  // Note: This requires enabling replication on the milk_logs table in Supabase
  const channel = supabase
    .channel(`milk_logs:${tenantId}`)
    .on(
      'postgres_changes',
      {
        event: '*', // INSERT, UPDATE, DELETE
        schema: 'public',
        table: 'milk_logs',
        filter: `tenant_id=eq.${tenantId}`,
      },
      payload => {
        callback(payload);
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}

/**
 * Subscribe to health events updates for a tenant
 */
export function subscribeToHealthEvents(
  tenantId: string,
  callback: (payload: any) => void
): () => void {
  const supabase = getSupabaseClient();

  const channel = supabase
    .channel(`health_events:${tenantId}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'health_events',
        filter: `tenant_id=eq.${tenantId}`,
      },
      payload => {
        callback(payload);
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}

/**
 * Subscribe to subscription changes for a tenant
 */
export function subscribeToSubscription(
  tenantId: string,
  callback: (payload: any) => void
): () => void {
  const supabase = getSupabaseClient();

  const channel = supabase
    .channel(`subscription:${tenantId}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'subscriptions',
        filter: `tenant_id=eq.${tenantId}`,
      },
      payload => {
        callback(payload);
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}
