// Subscription Management Utilities - Now using Supabase
import { getDrizzle } from '@/lib/supabase';
import { subscriptions } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { SUBSCRIPTION_PLANS } from '@/lib/constants';
import type { TenantSubscription, SubscriptionPlan } from '@/types';

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

/**
 * Update tenant subscription in Supabase
 */
export async function updateTenantSubscription(
  tenantId: string,
  update: SubscriptionUpdate
): Promise<void> {
  const db = getDrizzle();
  const subscriptionId = `${tenantId}_subscription`;

  await db
    .insert(subscriptions)
    .values({
      id: subscriptionId,
      tenantId,
      plan: update.plan,
      status: update.status,
      gateway: (update.gateway as any) || 'bank_transfer',
      renewDate: update.renewDate,
      token: update.token || null,
      amount: update.amount,
      currency: update.currency,
      trialEndsAt: update.trialEndsAt || null,
      updatedAt: new Date(),
    })
    .onConflictDoUpdate({
      target: subscriptions.id,
      set: {
        plan: update.plan,
        status: update.status,
        gateway: (update.gateway as any) || 'bank_transfer',
        renewDate: update.renewDate,
        token: update.token || null,
        amount: update.amount,
        trialEndsAt: update.trialEndsAt || null,
        updatedAt: new Date(),
      },
    });

  // Note: Limits are now calculated dynamically from plan, no need to store separately
}

/**
 * Cancel subscription in Supabase
 */
export async function cancelSubscription(tenantId: string): Promise<void> {
  const db = getDrizzle();
  const subscriptionId = `${tenantId}_subscription`;

  await db
    .update(subscriptions)
    .set({
      status: 'cancelled',
      updatedAt: new Date(),
    })
    .where(eq(subscriptions.id, subscriptionId));
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
