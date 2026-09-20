import { auth } from '@clerk/nextjs/server';
import { getDrizzle } from '@/lib/supabase/server';
import { tenants, tenantMembers, platformUsers, subscriptions, animals } from '@/db/schema';
import { eq, and, count } from 'drizzle-orm';
import { resolveTenantAccess } from '@/lib/tenant/resolve-access';
import {
  PLAN_LIMITS as SUBSCRIPTION_PLAN_LIMITS,
  PLAN_FEATURES as SUBSCRIPTION_PLAN_FEATURES,
} from '@/lib/subscriptions/constants';
/**
 * Tenant context interface
 */
export interface TenantContext {
  tenantId: string;
  /** @deprecated Use tenantId instead */
  id: string;
  userId: string;
  userRole: string;
  organizationId: string;
  membershipId?: string;
}
/**
 * Extract tenant context from Clerk authentication
 * This replaces all hardcoded 'tenant_placeholder' usage
 */
export async function getTenantContext(): Promise<TenantContext> {
  const { userId, orgId, orgRole } = await auth();
  if (!userId) {
    throw new Error('User authentication required');
  }

  const db = getDrizzle();
  const userMemberships = await db
    .select()
    .from(tenantMembers)
    .where(and(eq(tenantMembers.userId, userId), eq(tenantMembers.status, 'active')));

  const pUser = await db.select().from(platformUsers).where(eq(platformUsers.id, userId)).limit(1);
  const isSuperAdmin = pUser.length > 0 && pUser[0].platformRole === 'super_admin';

  const resolved = resolveTenantAccess({
    clerkOrgId: orgId,
    headerTenantId: null,
    memberships: userMemberships.map(m => ({
      tenantId: m.tenantId,
      role: m.role,
      status: m.status,
    })),
    isSuperAdmin,
    clerkOrgRole: orgRole,
  });

  if (!resolved.ok) {
    throw new Error(resolved.error);
  }

  const tenantId = resolved.tenantId;
  const userRole = resolved.userRole;
  const organizationId = tenantId;

  return {
    tenantId,
    id: tenantId, // Alias for backwards compatibility
    userId,
    userRole,
    organizationId,
  };
}
/**
 * Resolve user role from database membership
 * Fallback when Clerk role doesn't provide enough detail
 */
export async function resolveUserRoleFromDatabase(
  userId: string,
  tenantId: string
): Promise<string> {
  try {
    const db = getDrizzle();
    const membership = await db
      .select()
      .from(tenantMembers)
      .where(and(eq(tenantMembers.userId, userId), eq(tenantMembers.tenantId, tenantId)))
      .limit(1);
    if (membership.length > 0) {
      return membership[0].role;
    }
    // If no membership found, check if user is super admin
    const user = await db.select().from(platformUsers).where(eq(platformUsers.id, userId)).limit(1);
    if (user.length > 0 && user[0].platformRole === 'super_admin') {
      return 'super_admin';
    }
    return 'guest';
  } catch (error) {
    return 'guest';
  }
}
/**
 * Get tenant information
 */
export async function getTenantInfo(tenantId: string) {
  try {
    const db = getDrizzle();
    const tenant = await db.select().from(tenants).where(eq(tenants.id, tenantId)).limit(1);
    return tenant[0] || null;
  } catch (error) {
    return null;
  }
}
/**
 * Check if user has permission for a specific role
 */
export async function hasRole(requiredRole: string): Promise<boolean> {
  try {
    const context = await getTenantContext();
    // Role hierarchy: super_admin > farm_owner > farm_manager > others
    const roleHierarchy = {
      super_admin: 4,
      farm_owner: 3,
      farm_manager: 2,
      veterinarian: 2,
      feed_manager: 2,
      accountant: 2,
      breeder: 1,
      milking_staff: 1,
      guest: 0,
    };
    const userLevel = roleHierarchy[context.userRole as keyof typeof roleHierarchy] || 0;
    const requiredLevel = roleHierarchy[requiredRole as keyof typeof roleHierarchy] || 0;
    return userLevel >= requiredLevel;
  } catch (error) {
    return false;
  }
}
/**
 * Middleware helper to extract tenant context for API routes
 */
export async function extractTenantContextForAPI() {
  try {
    return await getTenantContext();
  } catch (error) {
    // Return null context if authentication fails
    // API routes can handle this appropriately
    return null;
  }
}
/**
 * Validate tenant access for a resource
 */
export async function validateTenantAccess(resourceTenantId: string): Promise<boolean> {
  try {
    const context = await getTenantContext();
    return context.tenantId === resourceTenantId;
  } catch (error) {
    return false;
  }
}
/**
 * Get user's tenant memberships
 */
export async function getUserTenants() {
  try {
    const { userId } = await auth();
    if (!userId) {
      return [];
    }
    const db = getDrizzle();
    const memberships = await db
      .select({
        tenant: tenants,
        membership: tenantMembers,
      })
      .from(tenantMembers)
      .innerJoin(tenants, eq(tenantMembers.tenantId, tenants.id))
      .where(eq(tenantMembers.userId, userId));
    return memberships.map(m => ({
      ...m.tenant,
      role: m.membership.role,
      membershipId: m.membership.id,
    }));
  } catch (error) {
    return [];
  }
}
export const PLAN_HIERARCHY: Record<string, number> = {
  free: 1,
  professional: 2,
  farm: 3,
  enterprise: 4,
};

/** Single source of truth: re-export subscription constants with API-friendly shape */
export const PLAN_LIMITS: Record<
  string,
  { maxAnimals: number; maxUsers: number; features: string[] }
> = {
  free: {
    maxAnimals: SUBSCRIPTION_PLAN_LIMITS.free.maxAnimals,
    maxUsers: SUBSCRIPTION_PLAN_LIMITS.free.maxUsers,
    features: SUBSCRIPTION_PLAN_FEATURES.free,
  },
  professional: {
    maxAnimals: SUBSCRIPTION_PLAN_LIMITS.professional.maxAnimals,
    maxUsers: SUBSCRIPTION_PLAN_LIMITS.professional.maxUsers,
    features: SUBSCRIPTION_PLAN_FEATURES.professional,
  },
  farm: {
    maxAnimals: SUBSCRIPTION_PLAN_LIMITS.farm.maxAnimals,
    maxUsers: SUBSCRIPTION_PLAN_LIMITS.farm.maxUsers,
    features: SUBSCRIPTION_PLAN_FEATURES.farm,
  },
  enterprise: {
    maxAnimals:
      SUBSCRIPTION_PLAN_LIMITS.enterprise.maxAnimals < 0
        ? 999999
        : SUBSCRIPTION_PLAN_LIMITS.enterprise.maxAnimals,
    maxUsers:
      SUBSCRIPTION_PLAN_LIMITS.enterprise.maxUsers < 0
        ? 999999
        : SUBSCRIPTION_PLAN_LIMITS.enterprise.maxUsers,
    features: SUBSCRIPTION_PLAN_FEATURES.enterprise,
  },
};

export interface TenantSubscriptionInfo {
  plan: 'free' | 'professional' | 'farm' | 'enterprise';
  status: 'active' | 'trial' | 'expired' | 'cancelled' | 'past_due' | 'pending_approval';
  renewDate?: Date;
  trialEndsAt?: Date;
  maxAnimals: number;
  maxUsers: number;
  features: string[];
}

/**
 * Fetch tenant subscription details from database
 */
export async function getTenantSubscriptionInfo(
  tenantIdOverride?: string
): Promise<TenantSubscriptionInfo> {
  try {
    let tenantId = tenantIdOverride;
    if (!tenantId) {
      const context = await getTenantContext();
      tenantId = context.tenantId;
    }

    const db = getDrizzle();
    const [sub] = await db
      .select()
      .from(subscriptions)
      .where(eq(subscriptions.tenantId, tenantId))
      .limit(1);

    if (!sub) {
      // Default fallback for unconfigured or new tenant
      return {
        plan: 'free',
        status: 'active',
        maxAnimals: PLAN_LIMITS.free.maxAnimals,
        maxUsers: PLAN_LIMITS.free.maxUsers,
        features: PLAN_LIMITS.free.features,
      };
    }

    const now = new Date();
    const isExpired = sub.renewDate && new Date(sub.renewDate) < now && sub.status !== 'trial';
    const isTrialExpired =
      sub.trialEndsAt && new Date(sub.trialEndsAt) < now && sub.status === 'trial';

    const effectiveStatus = isExpired || isTrialExpired ? 'expired' : sub.status;
    const effectivePlan =
      effectiveStatus === 'expired' ? 'free' : (sub.plan as keyof typeof PLAN_LIMITS);
    const limits = PLAN_LIMITS[effectivePlan] || PLAN_LIMITS.free;

    return {
      plan: effectivePlan as 'free' | 'professional' | 'farm' | 'enterprise',
      status: effectiveStatus as
        | 'active'
        | 'trial'
        | 'expired'
        | 'cancelled'
        | 'past_due'
        | 'pending_approval',
      renewDate: sub.renewDate ? new Date(sub.renewDate) : undefined,
      trialEndsAt: sub.trialEndsAt ? new Date(sub.trialEndsAt) : undefined,
      maxAnimals: limits.maxAnimals,
      maxUsers: limits.maxUsers,
      features: limits.features,
    };
  } catch (error) {
    return {
      plan: 'free',
      status: 'active',
      maxAnimals: PLAN_LIMITS.free.maxAnimals,
      maxUsers: PLAN_LIMITS.free.maxUsers,
      features: PLAN_LIMITS.free.features,
    };
  }
}

/**
 * Check if tenant subscription meets or exceeds required plan level
 */
export async function checkTenantSubscription(
  requiredPlan: string,
  tenantIdOverride?: string
): Promise<boolean> {
  try {
    const sub = await getTenantSubscriptionInfo(tenantIdOverride);
    const tenantLevel = PLAN_HIERARCHY[sub.plan] || 1;
    const requiredLevel = PLAN_HIERARCHY[requiredPlan.toLowerCase()] || 1;

    return tenantLevel >= requiredLevel;
  } catch (error) {
    return false;
  }
}

/**
 * Check if tenant has capacity to add another animal under their active plan
 */
export async function checkTenantAnimalQuota(tenantIdOverride?: string): Promise<{
  allowed: boolean;
  currentCount: number;
  limit: number;
  plan: string;
}> {
  try {
    let tenantId = tenantIdOverride;
    if (!tenantId) {
      const context = await getTenantContext();
      tenantId = context.tenantId;
    }

    const sub = await getTenantSubscriptionInfo(tenantId);
    const db = getDrizzle();

    const [res] = await db
      .select({ count: count() })
      .from(animals)
      .where(and(eq(animals.tenantId, tenantId), eq(animals.status, 'active')));

    const currentCount = Number(res?.count || 0);
    const allowed = currentCount < sub.maxAnimals;

    return {
      allowed,
      currentCount,
      limit: sub.maxAnimals,
      plan: sub.plan,
    };
  } catch (error) {
    return {
      allowed: false,
      currentCount: 0,
      limit: 5,
      plan: 'free',
    };
  }
}
/**
 * Get tenant-specific feature overrides
 * Some features might be enabled/disabled per tenant
 */
export async function getTenantFeatureOverrides(): Promise<Record<string, boolean>> {
  try {
    const context = await getTenantContext();
    // This could be stored in a tenant_settings table
    // For now, return empty object
    return {};
  } catch (error) {
    return {};
  }
}
