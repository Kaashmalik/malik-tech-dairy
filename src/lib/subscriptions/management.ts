import { getSupabaseClient } from '@/lib/supabase/server';
import { tenantDb, unwrap } from '@/lib/supabase/tenant-db';
import { PLAN_LIMITS, PLAN_FEATURES, PROBATION_PERIOD_DAYS } from './constants';
import { isWithinPlanLimit, featureNotAvailableMessage } from './plan-limits';
import type { SubscriptionPlan, AnimalSpecies } from '@/types';

// Re-export constants
export { PLAN_LIMITS, PLAN_FEATURES };

export interface SubscriptionUpdate {
  plan: SubscriptionPlan;
  status: 'active' | 'trial' | 'expired' | 'cancelled' | 'past_due';
  gateway?: string;
  renewDate: Date;
  amount: number;
  currency: 'PKR';
  token?: string;
  trialEndsAt?: Date;
}

interface SubscriptionRow {
  id: string;
  tenant_id: string;
  plan: string;
  status: 'active' | 'trial' | 'expired' | 'cancelled' | 'past_due' | 'pending_approval';
  gateway: string;
  renew_date: string;
  trial_ends_at: string | null;
  amount: number;
  currency: string;
  [key: string]: unknown;
}

export type ResourceType = 'animals' | 'users' | 'storage' | 'emails';

export class SubscriptionService {
  private tenantId: string;

  constructor(tenantId: string) {
    this.tenantId = tenantId;
  }

  /**
   * Get current subscription details
   */
  async getSubscription() {
    const row = unwrap(
      await tenantDb(this.tenantId).select('subscriptions').maybeSingle(),
      'Load subscription'
    ) as SubscriptionRow | null;
    const sub = row
      ? {
          ...row,
          renewDate: new Date(row.renew_date),
          trialEndsAt: row.trial_ends_at ? new Date(row.trial_ends_at) : null,
        }
      : null;

    if (!sub) {
      // Default fallback for tenants without explicit record (legacy handling)
      return {
        plan: 'free' as SubscriptionPlan,
        status: 'active',
        renewDate: new Date(),
        features: PLAN_FEATURES.free,
        limits: PLAN_LIMITS.free,
      };
    }

    // Determine effective status (handle grace period)
    const now = new Date();
    let effectiveStatus = sub.status;

    // Free plan never expires (older rows were created with a 30-day renew_date)
    if (sub.plan !== 'free' && sub.status === 'active' && sub.renewDate < now) {
      const probationEnd = new Date(sub.renewDate);
      probationEnd.setDate(probationEnd.getDate() + PROBATION_PERIOD_DAYS);

      if (now > probationEnd) {
        effectiveStatus = 'expired';
      } else {
        effectiveStatus = 'past_due'; // In grace period
      }
    }

    // If trial expired
    if (sub.status === 'trial' && sub.trialEndsAt && sub.trialEndsAt < now) {
      effectiveStatus = 'expired';
    }

    // Return enhanced object
    return {
      ...sub,
      plan: sub.plan as SubscriptionPlan,
      status: effectiveStatus,
      features: PLAN_FEATURES[sub.plan as SubscriptionPlan],
      limits: PLAN_LIMITS[sub.plan as SubscriptionPlan],
    };
  }

  /**
   * check if tenant has a specific feature
   */
  async hasFeature(feature: string): Promise<boolean> {
    const sub = await this.getSubscription();
    // Allow access during grace period (past_due)
    if (sub.status !== 'active' && sub.status !== 'trial' && sub.status !== 'past_due') {
      return false;
    }
    return sub.features.includes(feature);
  }

  /**
   * Check if tenant has reached a specific resource limit
   * Returns true if action is ALLOWED, false if blocked
   */
  async checkLimit(resource: ResourceType, currentCountOverride?: number): Promise<boolean> {
    const sub = await this.getSubscription();

    // Block everything if expired/cancelled
    if (sub.status !== 'active' && sub.status !== 'trial' && sub.status !== 'past_due') {
      return false;
    }

    const limit = sub.limits;
    let currentUsage = 0;
    let maxAllowed = 0;

    if (resource === 'animals') {
      maxAllowed = limit.maxAnimals;
      if (typeof currentCountOverride === 'number') {
        currentUsage = currentCountOverride;
      } else {
        currentUsage = await this.countActive('animals');
      }
      return isWithinPlanLimit(currentUsage, maxAllowed);
    }

    if (resource === 'users') {
      maxAllowed = limit.maxUsers;
      if (typeof currentCountOverride === 'number') {
        currentUsage = currentCountOverride;
      } else {
        currentUsage = await this.countActive('tenant_members');
      }
      return isWithinPlanLimit(currentUsage, maxAllowed);
    }

    // storage/emails not enforced here yet — allow
    return true;
  }

  private async countActive(table: 'animals' | 'tenant_members'): Promise<number> {
    const { count, error } = await tenantDb(this.tenantId)
      .select(table, 'id', { count: 'exact', head: true })
      .eq('status', 'active');
    if (error) {
      throw new Error(`Count ${table}: ${error.message}`);
    }
    return count || 0;
  }

  /**
   * Require a plan feature or throw FEATURE_NOT_AVAILABLE
   */
  async requireFeature(feature: string): Promise<void> {
    const allowed = await this.hasFeature(feature);
    if (!allowed) {
      throw new Error(featureNotAvailableMessage(feature));
    }
  }

  /**
   * Check if a specific animal species is allowed on the plan
   */
  async isSpeciesAllowed(species: AnimalSpecies): Promise<boolean> {
    const sub = await this.getSubscription();
    return sub.limits.allowedSpecies.includes(species);
  }
}

/**
 * Update tenant subscription via Supabase REST (serverless-safe)
 */
export async function updateTenantSubscription(
  tenantId: string,
  update: SubscriptionUpdate
): Promise<void> {
  const supabase = getSupabaseClient();
  const subscriptionId = `${tenantId}_subscription`;
  const now = new Date().toISOString();

  // Keyed on tenant_id (unique): older rows have non-standard ids like sub_<ts>
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase.from('subscriptions') as any).upsert(
    {
      id: subscriptionId, // text PK without default; nothing references it
      tenant_id: tenantId,
      plan: update.plan,
      status: update.status,
      gateway: update.gateway || 'bank_transfer',
      renew_date: update.renewDate.toISOString(),
      token: update.token || null,
      amount: update.amount,
      currency: update.currency,
      trial_ends_at: update.trialEndsAt ? update.trialEndsAt.toISOString() : null,
      updated_at: now,
    },
    { onConflict: 'tenant_id' }
  );

  if (error) {
    throw new Error(`Failed to update subscription: ${error.message}`);
  }

  // Keep tenants table in sync when those columns exist
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (supabase.from('tenants') as any)
    .update({
      subscription_plan: update.plan,
      subscription_status: update.status,
      updated_at: now,
    })
    .eq('id', tenantId);
}

/**
 * Cancel subscription via Supabase REST
 */
export async function cancelSubscription(tenantId: string): Promise<void> {
  const now = new Date().toISOString();
  const { error } = await tenantDb(tenantId).update('subscriptions', {
    status: 'cancelled',
    updated_at: now,
  });

  if (error) {
    throw new Error(`Failed to cancel subscription: ${error.message}`);
  }
}

/**
 * Downgrade to free tier
 */
export async function downgradeToFree(tenantId: string): Promise<void> {
  await updateTenantSubscription(tenantId, {
    plan: 'free',
    status: 'active',
    gateway: 'bank_transfer',
    renewDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year
    amount: 0,
    currency: 'PKR',
  });
}
