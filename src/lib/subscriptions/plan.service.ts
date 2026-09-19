import { getDrizzle } from '@/lib/supabase/server';
import { subscriptions, animals, tenantMembers, milkLogs } from '@/db/schema';
import { eq, sql } from 'drizzle-orm';
import { PLAN_LIMITS, PLAN_FEATURES, PLAN_PRICING, PlanLimits } from './constants';
import type { SubscriptionPlan, AnimalSpecies } from '@/types';

export class PlanService {
  /**
   * Get all available subscription plans with pricing, limits, and features
   */
  static getAllPlans() {
    return (['free', 'professional', 'farm', 'enterprise'] as SubscriptionPlan[]).map(planKey => {
      const pricing = PLAN_PRICING[planKey] || PLAN_PRICING.free;
      return {
        id: planKey,
        key: planKey,
        name: planKey.charAt(0).toUpperCase() + planKey.slice(1),
        price: pricing.pkr,
        limits: PLAN_LIMITS[planKey],
        features: PLAN_FEATURES[planKey],
        pricing,
      };
    });
  }

  /**
   * Get plan configuration details by plan key
   */
  static getPlan(plan: SubscriptionPlan) {
    const limits = PLAN_LIMITS[plan] || PLAN_LIMITS.free;
    const features = PLAN_FEATURES[plan] || PLAN_FEATURES.free;
    const pricing = PLAN_PRICING[plan] || PLAN_PRICING.free;
    return {
      id: plan,
      key: plan,
      name: plan.charAt(0).toUpperCase() + plan.slice(1),
      price: pricing.pkr,
      limits,
      features,
      pricing,
    };
  }

  /**
   * Validate if plan key is valid
   */
  static isValidPlan(plan: string): boolean {
    return ['free', 'professional', 'farm', 'enterprise'].includes(plan);
  }

  /**
   * Get limits for plan
   */
  static getLimits(plan: SubscriptionPlan): PlanLimits {
    return PLAN_LIMITS[plan] || PLAN_LIMITS.free;
  }

  /**
   * Get features boolean dictionary for a plan
   */
  static getFeatures(plan: SubscriptionPlan): Record<string, boolean> {
    const featuresList = PLAN_FEATURES[plan] || PLAN_FEATURES.free;
    const map: Record<string, boolean> = {};
    for (const f of featuresList) {
      map[f] = true;
    }
    return map;
  }

  /**
   * Check if species is allowed in a plan
   */
  static isSpeciesAllowed(plan: SubscriptionPlan, species: AnimalSpecies): boolean {
    const limits = PLAN_LIMITS[plan] || PLAN_LIMITS.free;
    return limits.allowedSpecies.includes(species);
  }
}

export class UsageService {
  /**
   * Get active usage counts directly from database for a tenant
   */
  static async getTenantUsage(tenantId: string) {
    const db = getDrizzle();

    // 1. Current animal count
    const [animalCountRow] = await db
      .select({ count: sql<number>`count(*)` })
      .from(animals)
      .where(eq(animals.tenantId, tenantId));
    const animalCount = Number(animalCountRow?.count || 0);

    // 2. Active member count
    const [memberCountRow] = await db
      .select({ count: sql<number>`count(*)` })
      .from(tenantMembers)
      .where(eq(tenantMembers.tenantId, tenantId));
    const userCount = Number(memberCountRow?.count || 0);

    // 3. Milk log count
    const [milkCountRow] = await db
      .select({ count: sql<number>`count(*)` })
      .from(milkLogs)
      .where(eq(milkLogs.tenantId, tenantId));
    const milkRecordsCount = Number(milkCountRow?.count || 0);

    return {
      animals: animalCount,
      users: userCount,
      milkRecords: milkRecordsCount,
    };
  }
}

export class FeatureGate {
  /**
   * Retrieve tenant subscription record or fallback to free
   */
  static async getTenantSubscription(tenantId: string) {
    const db = getDrizzle();
    const sub = await db.query.subscriptions.findFirst({
      where: eq(subscriptions.tenantId, tenantId),
    });

    if (!sub) {
      return {
        plan: 'free' as SubscriptionPlan,
        status: 'active' as const,
        renewDate: new Date(),
        trialEndsAt: null,
      };
    }

    return {
      plan: (sub.plan || 'free') as SubscriptionPlan,
      status: sub.status,
      renewDate: sub.renewDate,
      trialEndsAt: sub.trialEndsAt,
    };
  }

  /**
   * Check if tenant (or direct plan identifier) is authorized to use a specific named feature
   */
  static async canUseFeature(tenantIdOrPlan: string, feature: string): Promise<boolean> {
    let plan: SubscriptionPlan = 'free';
    if (PlanService.isValidPlan(tenantIdOrPlan)) {
      plan = tenantIdOrPlan as SubscriptionPlan;
    } else {
      const sub = await this.getTenantSubscription(tenantIdOrPlan);
      if (sub.status === 'expired' || sub.status === 'cancelled') {
        return false;
      }
      plan = sub.plan;
    }

    const planConfig = PlanService.getPlan(plan);
    return planConfig?.features.includes(feature) || false;
  }

  /**
   * Compute percentage of quota utilized
   */
  static calculateUsagePercentage(current: number, max: number): number {
    if (max === -1) return 0;
    if (max === 0) return current > 0 ? 100 : 0;
    return Math.min(100, Math.round((current / max) * 100));
  }

  /**
   * Check quota limits given a plan directly and current usage count
   */
  static checkPlanUsageLimit(
    plan: SubscriptionPlan,
    resource: 'animals' | 'users',
    currentUsage: number
  ) {
    const limits = PlanService.getLimits(plan);
    const max = resource === 'animals' ? limits.maxAnimals : limits.maxUsers;
    const allowed = max === -1 || currentUsage < max;
    const isAtLimit = max !== -1 && currentUsage >= max;
    const remaining = max === -1 ? -1 : Math.max(0, max - currentUsage);
    const percentage = this.calculateUsagePercentage(currentUsage, max);

    return {
      allowed,
      isAtLimit,
      current: currentUsage,
      limit: max,
      remaining,
      percentage,
      plan,
    };
  }

  /**
   * Server-side quota validation for a specific resource by tenant ID
   */
  static async checkUsageLimit(
    tenantId: string,
    resource: 'animals' | 'users'
  ): Promise<{
    allowed: boolean;
    current: number;
    max: number;
    remaining: number;
    percentage: number;
    isAtLimit: boolean;
    plan: SubscriptionPlan;
  }> {
    const sub = await this.getTenantSubscription(tenantId);
    const usage = await UsageService.getTenantUsage(tenantId);
    const currentUsage = usage[resource] || 0;

    const result = this.checkPlanUsageLimit(sub.plan, resource, currentUsage);
    return {
      ...result,
      max: result.limit,
    };
  }
}
