// Supabase-based Tenant Limits
// Gets subscription plan from Supabase and returns plan limits from constants
import { getSupabaseClient } from '@/lib/supabase';
import { SUBSCRIPTION_PLANS, SubscriptionPlanKey } from '@/lib/constants';
import type { TenantLimits } from '@/types';

export interface SubscriptionWithLimits {
  plan: SubscriptionPlanKey;
  status: string;
  trialEndsAt: Date | null;
  renewDate: Date;
  limits: TenantLimits;
}

/**
 * Get tenant limits from Supabase subscription
 * Returns limits based on the subscription plan from SUBSCRIPTION_PLANS constant
 */
export async function getTenantLimitsFromSupabase(tenantId: string): Promise<TenantLimits | null> {
  try {
    const supabase = getSupabaseClient();
    
    // Get subscription from Supabase
    const { data: subscription, error } = await supabase
      .from('subscriptions')
      .select('plan, status, trial_ends_at, renew_date')
      .eq('tenant_id', tenantId)
      .single() as { data: any; error: any };

    if (error) {
      console.error('Error fetching subscription:', error);
      // Return free tier limits as fallback
      return getDefaultLimits('free');
    }

    if (!subscription) {
      // No subscription found, return free tier
      return getDefaultLimits('free');
    }

    const plan = (subscription.plan as SubscriptionPlanKey) || 'free';
    return getDefaultLimits(plan);
  } catch (error) {
    console.error('Error in getTenantLimitsFromSupabase:', error);
    // Return free tier limits as fallback
    return getDefaultLimits('free');
  }
}

/**
 * Get full subscription with limits
 */
export async function getSubscriptionWithLimits(tenantId: string): Promise<SubscriptionWithLimits | null> {
  try {
    const supabase = getSupabaseClient();
    
    const { data: subscription, error } = await supabase
      .from('subscriptions')
      .select('plan, status, trial_ends_at, renew_date')
      .eq('tenant_id', tenantId)
      .single() as { data: any; error: any };

    if (error || !subscription) {
      // Return default free subscription
      return {
        plan: 'free',
        status: 'trial',
        trialEndsAt: null,
        renewDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        limits: getDefaultLimits('free'),
      };
    }

    const plan = (subscription.plan as SubscriptionPlanKey) || 'free';
    
    return {
      plan,
      status: subscription.status,
      trialEndsAt: subscription.trial_ends_at ? new Date(subscription.trial_ends_at) : null,
      renewDate: new Date(subscription.renew_date),
      limits: getDefaultLimits(plan),
    };
  } catch (error) {
    console.error('Error in getSubscriptionWithLimits:', error);
    return null;
  }
}

/**
 * Get default limits for a subscription plan
 */
export function getDefaultLimits(plan: SubscriptionPlanKey): TenantLimits {
  const planConfig = SUBSCRIPTION_PLANS[plan];
  
  if (!planConfig) {
    // Fallback to free tier
    return {
      maxAnimals: 5,
      maxUsers: 1,
      features: ['basic_milk_logs', 'mobile_app'],
    };
  }

  return {
    maxAnimals: planConfig.maxAnimals,
    maxUsers: planConfig.maxUsers,
    features: [...planConfig.features],
  };
}

/**
 * Get current animal count for a tenant from Supabase
 */
export async function getAnimalCount(tenantId: string): Promise<number> {
  try {
    const supabase = getSupabaseClient();
    
    const { count, error } = await supabase
      .from('animals')
      .select('*', { count: 'exact', head: true })
      .eq('tenant_id', tenantId)
      .neq('status', 'deceased') as { count: number | null; error: any };

    if (error) {
      console.error('Error counting animals:', error);
      return 0;
    }

    return count || 0;
  } catch (error) {
    console.error('Error in getAnimalCount:', error);
    return 0;
  }
}

/**
 * Get current user count for a tenant from Supabase
 */
export async function getUserCount(tenantId: string): Promise<number> {
  try {
    const supabase = getSupabaseClient();
    
    const { count, error } = await supabase
      .from('tenant_members')
      .select('*', { count: 'exact', head: true })
      .eq('tenant_id', tenantId)
      .eq('status', 'active') as { count: number | null; error: any };

    if (error) {
      console.error('Error counting users:', error);
      return 0;
    }

    return count || 0;
  } catch (error) {
    console.error('Error in getUserCount:', error);
    return 0;
  }
}

/**
 * Check if tenant can add more animals
 */
export async function canAddAnimalSupabase(tenantId: string): Promise<{
  allowed: boolean;
  currentCount: number;
  maxAllowed: number;
  plan: SubscriptionPlanKey;
}> {
  const [limits, currentCount] = await Promise.all([
    getTenantLimitsFromSupabase(tenantId),
    getAnimalCount(tenantId),
  ]);

  const maxAnimals = limits?.maxAnimals ?? 5;
  const isUnlimited = maxAnimals === -1;
  
  return {
    allowed: isUnlimited || currentCount < maxAnimals,
    currentCount,
    maxAllowed: maxAnimals,
    plan: 'free', // Will be updated from subscription
  };
}

/**
 * Check if tenant can add more users
 */
export async function canAddUserSupabase(tenantId: string): Promise<{
  allowed: boolean;
  currentCount: number;
  maxAllowed: number;
}> {
  const [limits, currentCount] = await Promise.all([
    getTenantLimitsFromSupabase(tenantId),
    getUserCount(tenantId),
  ]);

  const maxUsers = limits?.maxUsers ?? 1;
  const isUnlimited = maxUsers === -1;
  
  return {
    allowed: isUnlimited || currentCount < maxUsers,
    currentCount,
    maxAllowed: maxUsers,
  };
}
