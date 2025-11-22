// Supabase Tenant Helpers - Replaces Firestore tenant.ts for relational data
import { getDrizzle } from '../supabase';
import { tenants, subscriptions, customFieldsConfig } from '@/db/schema';
import { eq } from 'drizzle-orm';
import type { TenantConfig, TenantSubscription, TenantLimits } from '@/types';
import { SUBSCRIPTION_PLANS } from '@/lib/constants';

/**
 * Get tenant config from Supabase
 */
export async function getTenantConfig(tenantId: string): Promise<TenantConfig | null> {
  try {
    const db = getDrizzle();
    const result = await db.select().from(tenants).where(eq(tenants.id, tenantId)).limit(1);

    if (result.length === 0) {
      return null;
    }

    const data = result[0];
    return {
      farmName: data.farmName,
      subdomain: data.slug,
      logoUrl: data.logoUrl || undefined,
      primaryColor: data.primaryColor || '#1F7A3D',
      accentColor: data.accentColor || '#F59E0B',
      language: data.language as 'en' | 'ur',
      currency: data.currency as 'PKR' | 'USD',
      timezone: data.timezone || 'Asia/Karachi',
      animalTypes: (data.animalTypes || []) as any[],
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,
    };
  } catch (error) {
    console.error('Error fetching tenant config from Supabase:', error);
    return null;
  }
}

/**
 * Create or update tenant config in Supabase
 */
export async function setTenantConfig(
  tenantId: string,
  config: Partial<TenantConfig>
): Promise<void> {
  const db = getDrizzle();
  
  await db.insert(tenants).values({
    id: tenantId,
    slug: config.subdomain || tenantId.slice(0, 8),
    farmName: config.farmName || 'Unnamed Farm',
    logoUrl: config.logoUrl || null,
    primaryColor: config.primaryColor || '#1F7A3D',
    accentColor: config.accentColor || '#F59E0B',
    language: config.language || 'en',
    currency: config.currency || 'PKR',
    timezone: config.timezone || 'Asia/Karachi',
    animalTypes: config.animalTypes || ['cow', 'buffalo', 'chicken'],
    updatedAt: new Date(),
  }).onConflictDoUpdate({
    target: tenants.id,
    set: {
      farmName: config.farmName,
      logoUrl: config.logoUrl || null,
      primaryColor: config.primaryColor,
      accentColor: config.accentColor,
      language: config.language,
      currency: config.currency,
      timezone: config.timezone,
      animalTypes: config.animalTypes,
      updatedAt: new Date(),
    },
  });
}

/**
 * Get tenant subscription from Supabase
 */
export async function getTenantSubscription(
  tenantId: string
): Promise<TenantSubscription | null> {
  try {
    const db = getDrizzle();
    const result = await db
      .select()
      .from(subscriptions)
      .where(eq(subscriptions.tenantId, tenantId))
      .limit(1);

    if (result.length === 0) {
      return null;
    }

    const data = result[0];
    return {
      plan: data.plan as any,
      status: data.status as any,
      gateway: data.gateway as any,
      renewDate: data.renewDate,
      token: data.token || undefined,
      amount: data.amount,
      currency: data.currency as 'PKR',
      trialEndsAt: data.trialEndsAt || undefined,
    };
  } catch (error) {
    console.error('Error fetching tenant subscription from Supabase:', error);
    return null;
  }
}

/**
 * Get tenant limits based on subscription plan
 */
export async function getTenantLimits(tenantId: string): Promise<TenantLimits | null> {
  try {
    const subscription = await getTenantSubscription(tenantId);
    
    if (!subscription) {
      return null;
    }

    const planDetails = SUBSCRIPTION_PLANS[subscription.plan];
    
    return {
      maxAnimals: planDetails.maxAnimals,
      maxUsers: planDetails.maxUsers,
      features: planDetails.features,
    };
  } catch (error) {
    console.error('Error fetching tenant limits:', error);
    return null;
  }
}

/**
 * Initialize tenant in Supabase (called when organization is created)
 */
export async function initializeTenant(
  tenantId: string,
  tenantSlug: string,
  ownerId: string,
  ownerEmail: string
): Promise<void> {
  const db = getDrizzle();

  // Create tenant
  await db.insert(tenants).values({
    id: tenantId,
    slug: tenantSlug,
    farmName: tenantSlug.charAt(0).toUpperCase() + tenantSlug.slice(1) + ' Farm',
    primaryColor: '#1F7A3D',
    accentColor: '#F59E0B',
    language: 'en',
    currency: 'PKR',
    timezone: 'Asia/Karachi',
    animalTypes: ['cow', 'buffalo', 'chicken'],
    createdAt: new Date(),
    updatedAt: new Date(),
  }).onConflictDoNothing();

  // Create default subscription (free tier)
  await db.insert(subscriptions).values({
    id: `${tenantId}_subscription`,
    tenantId,
    plan: 'free',
    status: 'trial',
    gateway: 'bank_transfer',
    renewDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
    amount: 0,
    currency: 'PKR',
    trialEndsAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14-day trial
    createdAt: new Date(),
    updatedAt: new Date(),
  }).onConflictDoNothing();

  // Create default custom fields config
  await db.insert(customFieldsConfig).values({
    id: `${tenantId}_custom_fields`,
    tenantId,
    fields: [],
    updatedAt: new Date(),
  }).onConflictDoNothing();
}

