import { auth } from '@clerk/nextjs/server';
import { getSupabaseClient } from '@/lib/supabase/server';
import { db, tenantDb, toCamel, unwrap } from '@/lib/supabase/tenant-db';
import { logger } from '@/lib/logger';
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

export class TenantAccessError extends Error {
  status: number;
  constructor(message: string, status = 403) {
    super(message);
    this.name = 'TenantAccessError';
    this.status = status;
  }
}

/**
 * Extract tenant context from Clerk authentication
 * This replaces all hardcoded 'tenant_placeholder' usage
 */
export async function getTenantContext(): Promise<TenantContext> {
  const { userId, orgId, orgRole } = await auth();
  if (!userId) {
    throw new TenantAccessError('User authentication required', 401);
  }

  // Prefer Supabase REST for membership lookup (works when serverless cannot open Postgres)
  const supabase = getSupabaseClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: members } = await (supabase.from('tenant_members') as any)
    .select('tenant_id, role, status')
    .eq('user_id', userId)
    .eq('status', 'active');

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: platformUser } = await (supabase.from('platform_users') as any)
    .select('platform_role')
    .eq('id', userId)
    .maybeSingle();

  const resolved = resolveTenantAccess({
    clerkOrgId: orgId,
    headerTenantId: null,
    memberships: ((members || []) as { tenant_id: string; role: string; status: string }[]).map(
      m => ({
        tenantId: m.tenant_id,
        role: m.role,
        status: m.status,
      })
    ),
    isSuperAdmin: platformUser?.platform_role === 'super_admin',
    clerkOrgRole: orgRole,
  });

  if (!resolved.ok) {
    throw new TenantAccessError(resolved.error, resolved.status);
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
    // Scoped to BOTH user and tenant so a role never leaks across farms
    const membership = unwrap(
      await tenantDb(tenantId).select('tenant_members', 'role').eq('user_id', userId).maybeSingle(),
      'Load membership'
    ) as { role: string } | null;
    if (membership) {
      return membership.role;
    }
    // If no membership found, check if user is super admin
    const user = unwrap(
      await db().from('platform_users').select('platform_role').eq('id', userId).maybeSingle(),
      'Load platform user'
    ) as { platform_role: string } | null;
    return user?.platform_role === 'super_admin' ? 'super_admin' : 'guest';
  } catch (error) {
    logger.error('resolveUserRoleFromDatabase failed', error, { userId, tenantId });
    return 'guest';
  }
}
export interface TenantRecord {
  id: string;
  slug: string;
  farmName: string;
  logoUrl: string | null;
  primaryColor: string | null;
  accentColor: string | null;
  language: string | null;
  currency: string | null;
  timezone: string | null;
  animalTypes: string[] | null;
  createdAt: string;
  updatedAt: string;
  [key: string]: unknown;
}

/**
 * Get tenant information
 */
export async function getTenantInfo(tenantId: string) {
  try {
    const tenant = unwrap(
      await db()
        .from('tenants')
        .select('*')
        .eq('id', tenantId)
        .is('deleted_at', null)
        .maybeSingle(),
      'Load tenant'
    );
    return toCamel<TenantRecord>(tenant as Record<string, unknown> | null);
  } catch (error) {
    logger.error('getTenantInfo failed', error, { tenantId });
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
    const memberships = unwrap(
      await db().from('tenant_members').select('id, role, tenants!inner(*)').eq('user_id', userId),
      'Load user tenants'
      // many-to-one embed returns an object at runtime; generated types say array
    ) as unknown as Array<{ id: string; role: string; tenants: Record<string, unknown> }>;
    return memberships.map(m => ({
      ...toCamel<TenantRecord>(m.tenants)!,
      role: m.role,
      membershipId: m.id,
    }));
  } catch (error) {
    logger.error('getUserTenants failed', error);
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

    const sub = toCamel<{
      plan: string;
      status: string;
      renewDate: string | null;
      trialEndsAt: string | null;
    }>(
      unwrap(
        await tenantDb(tenantId)
          .select('subscriptions', 'plan, status, renew_date, trial_ends_at')
          .maybeSingle(),
        'Load subscription'
      ) as Record<string, unknown> | null
    );

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
    // Free plan never expires (older rows were created with a 30-day renew_date)
    const isExpired =
      sub.plan !== 'free' &&
      sub.renewDate &&
      new Date(sub.renewDate) < now &&
      sub.status !== 'trial';
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
    // Fail closed to free-plan limits, but make the outage visible
    logger.error('getTenantSubscriptionInfo failed; using free limits', error, {
      tenantId: tenantIdOverride,
    });
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
    const { count: activeCount, error } = await tenantDb(tenantId)
      .select('animals', 'id', { count: 'exact', head: true })
      .eq('status', 'active');
    if (error) {
      throw new Error(`Count animals: ${error.message}`);
    }

    const currentCount = activeCount || 0;
    const allowed = currentCount < sub.maxAnimals;

    return {
      allowed,
      currentCount,
      limit: sub.maxAnimals,
      plan: sub.plan,
    };
  } catch (error) {
    logger.error('checkTenantAnimalQuota failed', error, { tenantId: tenantIdOverride });
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

/** Platform (super) admin check on an already-resolved tenant context. */
export function isPlatformAdmin(ctx: Pick<TenantContext, 'userRole'> | null | undefined): boolean {
  return ctx?.userRole === 'super_admin';
}
