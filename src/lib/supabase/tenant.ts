// Supabase tenant config helpers (REST - serverless-safe)
import type { TenantConfig } from '@/types';
import { db, unwrap } from './tenant-db';

/**
 * Get tenant config from Supabase. Returns null for unknown or deleted farms.
 */
export async function getTenantConfig(tenantId: string): Promise<TenantConfig | null> {
  const data = unwrap(
    await db()
      .from('tenants')
      .select(
        'farm_name, slug, logo_url, primary_color, accent_color, language, currency, timezone, animal_types, created_at, updated_at'
      )
      .eq('id', tenantId)
      .is('deleted_at', null)
      .maybeSingle(),
    'Load tenant config'
  ) as Record<string, any> | null; // eslint-disable-line @typescript-eslint/no-explicit-any

  if (!data) {
    return null;
  }
  return {
    farmName: data.farm_name,
    subdomain: data.slug,
    logoUrl: data.logo_url || undefined,
    primaryColor: data.primary_color || '#1F7A3D',
    accentColor: data.accent_color || '#F59E0B',
    language: data.language as 'en' | 'ur',
    currency: data.currency as 'PKR' | 'USD',
    timezone: data.timezone || 'Asia/Karachi',
    animalTypes: data.animal_types || [],
    createdAt: new Date(data.created_at),
    updatedAt: new Date(data.updated_at),
  };
}
