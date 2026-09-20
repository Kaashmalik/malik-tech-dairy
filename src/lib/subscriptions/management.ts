import { getDrizzle } from '@/lib/supabase/server';
import { subscriptions, animals, tenantMembers } from '@/db/schema';
import { eq, and, count } from 'drizzle-orm';
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

export type ResourceType = 'animals' | 'users' | 'storage' | 'emails';

export class SubscriptionService {
  private tenantId: string;
  private db = getDrizzle();

  constructor(tenantId: string) {
    this.tenantId = tenantId;
  }

  /**
   * Get current subscription details
   */
  async getSubscription() {
    const sub = await this.db.query.subscriptions.findFirst({
      where: eq(subscriptions.tenantId, this.tenantId),
    });

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

    if (sub.status === 'active' && sub.renewDate < now) {
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
        const [animalCount] = await this.db
          .select({ count: count() })
          .from(animals)
          .where(and(eq(animals.tenantId, this.tenantId), eq(animals.status, 'active')));
        currentUsage = Number(animalCount?.count || 0);
      }
      return isWithinPlanLimit(currentUsage, maxAllowed);
    }

    if (resource === 'users') {
      maxAllowed = limit.maxUsers;
      if (typeof currentCountOverride === 'number') {
        currentUsage = currentCountOverride;
      } else {
        const [userCount] = await this.db
          .select({ count: count() })
          .from(tenantMembers)
          .where(
            and(eq(tenantMembers.tenantId, this.tenantId), eq(tenantMembers.status, 'active'))
          );
        currentUsage = Number(userCount?.count || 0);
      }
      return isWithinPlanLimit(currentUsage, maxAllowed);
    }

    // storage/emails not enforced here yet — allow
    return true;
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
  const { getSupabaseClient } = await import('@/lib/supabase/server');
  const supabase = getSupabaseClient();
  const subscriptionId = `${tenantId}_subscription`;
  const now = new Date().toISOString();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase.from('subscriptions') as any).upsert(
    {
      id: subscriptionId,
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
      created_at: now,
    },
    { onConflict: 'id' }
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
  const { getSupabaseClient } = await import('@/lib/supabase/server');
  const supabase = getSupabaseClient();
  const subscriptionId = `${tenantId}_subscription`;
  const now = new Date().toISOString();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase.from('subscriptions') as any)
    .update({ status: 'cancelled', updated_at: now })
    .eq('id', subscriptionId);

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
