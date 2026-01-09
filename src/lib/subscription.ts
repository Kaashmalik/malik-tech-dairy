/**
 * Enhanced Subscription Management
 * Handles subscription plans, billing, and plan upgrades/downgrades
 */

import { getSupabaseClient } from '@/lib/supabase/server';

export interface SubscriptionPlan {
  id: string;
  name: string;
  price: number;
  currency: string;
  interval: 'monthly' | 'yearly';
  features: string[];
  limits: {
    animals: number;
    users: number;
    storage: number; // MB
    apiCalls: number; // per month
  };
}

export interface Subscription {
  id: string;
  tenantId: string;
  planId: string;
  status: 'active' | 'past_due' | 'cancelled' | 'unpaid';
  currentPeriodStart: Date;
  currentPeriodEnd: Date;
  cancelAtPeriodEnd: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface PaymentMethod {
  id: string;
  type: 'jazzcash' | 'easypaisa' | 'xpay' | 'bank_transfer';
  details: Record<string, unknown>;
  isDefault: boolean;
}

export interface Invoice {
  id: string;
  subscriptionId: string;
  amount: number;
  currency: string;
  status: 'pending' | 'paid' | 'failed' | 'refunded';
  dueDate: Date;
  paidDate?: Date;
  items: Array<{
    description: string;
    amount: number;
  }>;
}

// Subscription plans configuration
export const SUBSCRIPTION_PLANS: Record<string, SubscriptionPlan> = {
  free: {
    id: 'free',
    name: 'Free',
    price: 0,
    currency: 'PKR',
    interval: 'monthly',
    features: [
      'Up to 5 animals',
      '1 user account',
      'Basic milk logging',
      'Health records',
      'Email support',
    ],
    limits: {
      animals: 5,
      users: 1,
      storage: 100,
      apiCalls: 1000,
    },
  },
  professional: {
    id: 'professional',
    name: 'Professional',
    price: 4999,
    currency: 'PKR',
    interval: 'monthly',
    features: [
      'Up to 100 animals',
      '5 user accounts',
      'Advanced analytics',
      'Breeding management',
      'Financial tracking',
      'Priority support',
      'Export reports',
    ],
    limits: {
      animals: 100,
      users: 5,
      storage: 1000,
      apiCalls: 10000,
    },
  },
  farm: {
    id: 'farm',
    name: 'Farm',
    price: 12999,
    currency: 'PKR',
    interval: 'monthly',
    features: [
      'Up to 500 animals',
      '15 user accounts',
      'IoT device integration',
      'AI-powered insights',
      'Custom reports',
      'API access',
      'Phone support',
      'Bulk import/export',
    ],
    limits: {
      animals: 500,
      users: 15,
      storage: 5000,
      apiCalls: 50000,
    },
  },
  enterprise: {
    id: 'enterprise',
    name: 'Enterprise',
    price: 0, // Custom pricing
    currency: 'PKR',
    interval: 'monthly',
    features: [
      'Unlimited animals',
      'Unlimited users',
      'All features included',
      'Custom integrations',
      'Dedicated support',
      'SLA guarantee',
      'On-premise deployment',
      'White-label options',
    ],
    limits: {
      animals: Infinity,
      users: Infinity,
      storage: Infinity,
      apiCalls: Infinity,
    },
  },
};

/**
 * Get subscription plan by ID
 */
export function getSubscriptionPlan(planId: string): SubscriptionPlan | null {
  return SUBSCRIPTION_PLANS[planId] || null;
}

/**
 * Get all subscription plans
 */
export function getAllSubscriptionPlans(): SubscriptionPlan[] {
  return Object.values(SUBSCRIPTION_PLANS);
}

/**
 * Get tenant subscription
 */
export async function getTenantSubscription(tenantId: string): Promise<Subscription | null> {
  const supabase = getSupabaseClient();

  const { data, error } = await supabase
    .from('subscriptions')
    .select('*')
    .eq('tenant_id', tenantId)
    .eq('status', 'active')
    .single();

  if (error || !data) {
    return null;
  }

  return {
    id: data.id,
    tenantId: data.tenant_id,
    planId: data.plan,
    status: data.status,
    currentPeriodStart: new Date(data.current_period_start),
    currentPeriodEnd: new Date(data.current_period_end),
    cancelAtPeriodEnd: data.cancel_at_period_end,
    createdAt: new Date(data.created_at),
    updatedAt: new Date(data.updated_at),
  };
}

/**
 * Create subscription
 */
export async function createSubscription(params: {
  tenantId: string;
  planId: string;
  paymentMethodId?: string;
}): Promise<Subscription> {
  const supabase = getSupabaseClient();
  const plan = getSubscriptionPlan(params.planId);

  if (!plan) {
    throw new Error('Invalid plan ID');
  }

  const now = new Date();
  const periodEnd = new Date(now);
  periodEnd.setMonth(periodEnd.getMonth() + 1);

  const { data, error } = await supabase
    .from('subscriptions')
    .insert({
      tenant_id: params.tenantId,
      plan: params.planId,
      status: 'active',
      current_period_start: now.toISOString(),
      current_period_end: periodEnd.toISOString(),
      cancel_at_period_end: false,
      created_at: now.toISOString(),
      updated_at: now.toISOString(),
    })
    .select()
    .single();

  if (error || !data) {
    throw new Error('Failed to create subscription');
  }

  // Create initial payment record
  if (plan.price > 0) {
    await createPayment({
      subscriptionId: data.id,
      amount: plan.price,
      currency: plan.currency,
      paymentMethodId: params.paymentMethodId,
      dueDate: now,
    });
  }

  return {
    id: data.id,
    tenantId: data.tenant_id,
    planId: data.plan,
    status: data.status,
    currentPeriodStart: new Date(data.current_period_start),
    currentPeriodEnd: new Date(data.current_period_end),
    cancelAtPeriodEnd: data.cancel_at_period_end,
    createdAt: new Date(data.created_at),
    updatedAt: new Date(data.updated_at),
  };
}

/**
 * Upgrade subscription
 */
export async function upgradeSubscription(params: {
  tenantId: string;
  newPlanId: string;
  prorate?: boolean;
}): Promise<Subscription> {
  const supabase = getSupabaseClient();

  const currentSubscription = await getTenantSubscription(params.tenantId);
  if (!currentSubscription) {
    throw new Error('No active subscription found');
  }

  const currentPlan = getSubscriptionPlan(currentSubscription.planId);
  const newPlan = getSubscriptionPlan(params.newPlanId);

  if (!newPlan) {
    throw new Error('Invalid plan ID');
  }

  if (!currentPlan) {
    throw new Error('Current plan not found');
  }

  // Calculate prorated amount if requested
  let proratedAmount = 0;
  if (params.prorate && currentPlan.price > 0) {
    const daysRemaining = Math.ceil(
      (currentSubscription.currentPeriodEnd.getTime() - Date.now()) / (1000 * 60 * 60 * 24)
    );
    const daysInPeriod = Math.ceil(
      (currentSubscription.currentPeriodEnd.getTime() -
        currentSubscription.currentPeriodStart.getTime()) /
        (1000 * 60 * 60 * 24)
    );
    const proratedCurrentPrice = (currentPlan.price / daysInPeriod) * daysRemaining;
    const proratedNewPrice = (newPlan.price / daysInPeriod) * daysRemaining;
    proratedAmount = Math.max(0, proratedNewPrice - proratedCurrentPrice);
  }

  // Update subscription
  const { data, error } = await supabase
    .from('subscriptions')
    .update({
      plan: params.newPlanId,
      updated_at: new Date().toISOString(),
    })
    .eq('id', currentSubscription.id)
    .select()
    .single();

  if (error || !data) {
    throw new Error('Failed to upgrade subscription');
  }

  // Create payment record for upgrade fee
  if (proratedAmount > 0) {
    await createPayment({
      subscriptionId: data.id,
      amount: proratedAmount,
      currency: newPlan.currency,
      dueDate: new Date(),
      items: [
        {
          description: `Prorated upgrade from ${currentPlan.name} to ${newPlan.name}`,
          amount: proratedAmount,
        },
      ],
    });
  }

  return {
    id: data.id,
    tenantId: data.tenant_id,
    planId: data.plan,
    status: data.status,
    currentPeriodStart: new Date(data.current_period_start),
    currentPeriodEnd: new Date(data.current_period_end),
    cancelAtPeriodEnd: data.cancel_at_period_end,
    createdAt: new Date(data.created_at),
    updatedAt: new Date(data.updated_at),
  };
}

/**
 * Downgrade subscription
 */
export async function downgradeSubscription(params: {
  tenantId: string;
  newPlanId: string;
  effectiveAt?: 'immediate' | 'period_end';
}): Promise<Subscription> {
  const supabase = getSupabaseClient();

  const currentSubscription = await getTenantSubscription(params.tenantId);
  if (!currentSubscription) {
    throw new Error('No active subscription found');
  }

  const newPlan = getSubscriptionPlan(params.newPlanId);
  if (!newPlan) {
    throw new Error('Invalid plan ID');
  }

  if (params.effectiveAt === 'immediate') {
    // Downgrade immediately
    const { data, error } = await supabase
      .from('subscriptions')
      .update({
        plan: params.newPlanId,
        updated_at: new Date().toISOString(),
      })
      .eq('id', currentSubscription.id)
      .select()
      .single();

    if (error || !data) {
      throw new Error('Failed to downgrade subscription');
    }

    return {
      id: data.id,
      tenantId: data.tenant_id,
      planId: data.plan,
      status: data.status,
      currentPeriodStart: new Date(data.current_period_start),
      currentPeriodEnd: new Date(data.current_period_end),
      cancelAtPeriodEnd: data.cancel_at_period_end,
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at),
    };
  } else {
    // Schedule downgrade for period end
    const { data, error } = await supabase
      .from('subscriptions')
      .update({
        cancel_at_period_end: true,
        updated_at: new Date().toISOString(),
      })
      .eq('id', currentSubscription.id)
      .select()
      .single();

    if (error || !data) {
      throw new Error('Failed to schedule downgrade');
    }

    // Store pending downgrade
    await supabase.from('subscription_changes').insert({
      tenant_id: params.tenantId,
      subscription_id: currentSubscription.id,
      change_type: 'downgrade',
      from_plan: currentSubscription.planId,
      to_plan: params.newPlanId,
      effective_at: currentSubscription.currentPeriodEnd.toISOString(),
      created_at: new Date().toISOString(),
    });

    return {
      id: data.id,
      tenantId: data.tenant_id,
      planId: data.plan,
      status: data.status,
      currentPeriodStart: new Date(data.current_period_start),
      currentPeriodEnd: new Date(data.current_period_end),
      cancelAtPeriodEnd: data.cancel_at_period_end,
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at),
    };
  }
}

/**
 * Cancel subscription
 */
export async function cancelSubscription(params: {
  tenantId: string;
  cancelAtPeriodEnd?: boolean;
}): Promise<void> {
  const supabase = getSupabaseClient();

  const currentSubscription = await getTenantSubscription(params.tenantId);
  if (!currentSubscription) {
    throw new Error('No active subscription found');
  }

  if (params.cancelAtPeriodEnd) {
    // Cancel at period end
    await supabase
      .from('subscriptions')
      .update({
        cancel_at_period_end: true,
        updated_at: new Date().toISOString(),
      })
      .eq('id', currentSubscription.id);
  } else {
    // Cancel immediately
    await supabase
      .from('subscriptions')
      .update({
        status: 'cancelled',
        updated_at: new Date().toISOString(),
      })
      .eq('id', currentSubscription.id);
  }
}

/**
 * Resume subscription
 */
export async function resumeSubscription(tenantId: string): Promise<void> {
  const supabase = getSupabaseClient();

  const currentSubscription = await getTenantSubscription(tenantId);
  if (!currentSubscription) {
    throw new Error('No active subscription found');
  }

  await supabase
    .from('subscriptions')
    .update({
      cancel_at_period_end: false,
      updated_at: new Date().toISOString(),
    })
    .eq('id', currentSubscription.id);
}

/**
 * Create payment
 */
export async function createPayment(params: {
  subscriptionId: string;
  amount: number;
  currency: string;
  paymentMethodId?: string;
  dueDate: Date;
  items?: Array<{ description: string; amount: number }>;
}): Promise<void> {
  const supabase = getSupabaseClient();

  const { error } = await supabase.from('payments').insert({
    subscription_id: params.subscriptionId,
    amount: params.amount,
    currency: params.currency,
    status: 'pending',
    payment_method: params.paymentMethodId || 'manual',
    transaction_id: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  });

  if (error) {
    throw new Error('Failed to create payment');
  }
}

/**
 * Get tenant invoices
 */
export async function getTenantInvoices(tenantId: string): Promise<Invoice[]> {
  const supabase = getSupabaseClient();

  const { data, error } = await supabase
    .from('payments')
    .select('*')
    .eq('subscription_id', tenantId)
    .order('created_at', { ascending: false });

  if (error || !data) {
    return [];
  }

  return data.map(payment => ({
    id: payment.id,
    subscriptionId: payment.subscription_id,
    amount: payment.amount,
    currency: payment.currency,
    status: payment.status,
    dueDate: new Date(payment.created_at),
    paidDate: payment.status === 'completed' ? new Date(payment.updated_at) : undefined,
    items: [
      {
        description: 'Subscription fee',
        amount: payment.amount,
      },
    ],
  }));
}

/**
 * Check subscription limits
 */
export async function checkSubscriptionLimits(tenantId: string): Promise<{
  animals: { current: number; limit: number; exceeded: boolean };
  users: { current: number; limit: number; exceeded: boolean };
  storage: { current: number; limit: number; exceeded: number };
}> {
  const supabase = getSupabaseClient();
  const subscription = await getTenantSubscription(tenantId);

  if (!subscription) {
    throw new Error('No active subscription');
  }

  const plan = getSubscriptionPlan(subscription.planId);
  if (!plan) {
    throw new Error('Plan not found');
  }

  // Get current usage
  const [animalsCount, usersCount] = await Promise.all([
    supabase.from('animals').select('id').eq('tenant_id', tenantId).eq('status', 'active'),
    supabase.from('tenant_members').select('id').eq('tenant_id', tenantId).eq('status', 'active'),
  ]);

  return {
    animals: {
      current: animalsCount.data?.length || 0,
      limit: plan.limits.animals,
      exceeded: (animalsCount.data?.length || 0) > plan.limits.animals,
    },
    users: {
      current: usersCount.data?.length || 0,
      limit: plan.limits.users,
      exceeded: (usersCount.data?.length || 0) > plan.limits.users,
    },
    storage: {
      current: 0, // TODO: Calculate actual storage usage
      limit: plan.limits.storage,
      exceeded: 0,
    },
  };
}

/**
 * Get subscription usage statistics
 */
export async function getSubscriptionUsage(tenantId: string): Promise<{
  animals: { used: number; limit: number; percentage: number };
  users: { used: number; limit: number; percentage: number };
  apiCalls: { used: number; limit: number; percentage: number };
  storage: { used: number; limit: number; percentage: number };
}> {
  const limits = await checkSubscriptionLimits(tenantId);

  return {
    animals: {
      used: limits.animals.current,
      limit: limits.animals.limit,
      percentage: (limits.animals.current / limits.animals.limit) * 100,
    },
    users: {
      used: limits.users.current,
      limit: limits.users.limit,
      percentage: (limits.users.current / limits.users.limit) * 100,
    },
    apiCalls: {
      used: 0, // TODO: Track API calls
      limit: 1000,
      percentage: 0,
    },
    storage: {
      used: limits.storage.current,
      limit: limits.storage.limit,
      percentage: (limits.storage.current / limits.storage.limit) * 100,
    },
  };
}
