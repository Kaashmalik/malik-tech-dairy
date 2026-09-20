// API Middleware for Tenant Context Validation (Supabase-based)
import { auth } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/lib/supabase/server';
import { UserRole, PlatformRole, TenantRole } from '@/types/roles';
import { resolveTenantAccess } from '@/lib/tenant/resolve-access';
export interface TenantContext {
  tenantId: string;
  tenantSlug: string;
  userId: string;
  userRole: UserRole;
}
/**
 * Extract tenant context from request headers (set by middleware.ts)
 */
export function getTenantContext(request: NextRequest): TenantContext | null {
  const tenantId = request.headers.get('x-tenant-id');
  const tenantSlug = request.headers.get('x-tenant-slug');
  const userId = request.headers.get('x-user-id');
  if (!tenantId || !userId) {
    return null;
  }
  return {
    tenantId,
    tenantSlug: tenantSlug || '',
    userId,
    userRole: TenantRole.GUEST,
  };
}
/**
 * Middleware wrapper for API routes that require tenant context
 */
export function withTenantContext(
  handler: (req: NextRequest, context: TenantContext) => Promise<NextResponse>
) {
  return async (req: NextRequest) => {
    try {
      const { userId, orgId, orgRole } = await auth();
      if (!userId) {
        return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
      }

      const supabase = getSupabaseClient();
      const { data: members } = (await supabase
        .from('tenant_members')
        .select('tenant_id, role, status')
        .eq('user_id', userId)
        .eq('status', 'active')) as {
        data: { tenant_id: string; role: string; status: string }[] | null;
      };

      const { data: platformUser } = (await supabase
        .from('platform_users')
        .select('platform_role')
        .eq('id', userId)
        .maybeSingle()) as { data: { platform_role: string } | null };

      const resolved = resolveTenantAccess({
        clerkOrgId: orgId,
        headerTenantId: req.headers.get('x-tenant-id'),
        memberships: (members || []).map(m => ({
          tenantId: m.tenant_id,
          role: m.role,
          status: m.status,
        })),
        isSuperAdmin: platformUser?.platform_role === 'super_admin',
        clerkOrgRole: orgRole,
      });

      if (!resolved.ok) {
        return NextResponse.json(
          { success: false, error: resolved.error },
          { status: resolved.status }
        );
      }

      const orgSlug = req.headers.get('x-tenant-slug') || '';
      const context: TenantContext = {
        tenantId: resolved.tenantId,
        tenantSlug: orgSlug,
        userId,
        userRole: resolved.userRole,
      };
      return handler(req, context);
    } catch (error) {
      console.error('withTenantContext error:', error);
      return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
    }
  };
}
/**
 * Check if user has required role for operation (Supabase-based)
 */
export async function checkUserRole(
  tenantId: string,
  userId: string,
  requiredRoles: (UserRole | string)[]
): Promise<boolean> {
  try {
    const supabase = getSupabaseClient();
    // Check for super admin
    const { data: platformUser } = (await supabase
      .from('platform_users')
      .select('platform_role')
      .eq('id', userId)
      .maybeSingle()) as { data: { platform_role: string } | null };
    if (platformUser?.platform_role === 'super_admin') {
      return true; // Super admin has all permissions
    }
    // Check tenant member role
    const { data: member } = (await supabase
      .from('tenant_members')
      .select('role')
      .eq('tenant_id', tenantId)
      .eq('user_id', userId)
      .eq('status', 'active')
      .maybeSingle()) as { data: { role: string } | null };
    if (member?.role) {
      // Map common role aliases
      const userRole = member.role as TenantRole;
      const roleAliases: Record<string, TenantRole[]> = {
        owner: [TenantRole.FARM_OWNER],
        manager: [TenantRole.FARM_MANAGER],
        farm_owner: [TenantRole.FARM_OWNER],
        farm_manager: [TenantRole.FARM_MANAGER],
      };
      // Check if user's role is in the required roles or aliases
      return requiredRoles.some(required => {
        if (required === userRole) return true;
        const aliases = roleAliases[required as string] || [];
        return aliases.includes(userRole);
      });
    }
    // Fail closed - deny access if no role found
    return false;
  } catch (error) {
    // Fail closed - deny access on any error
    console.error('Authorization check failed:', error);
    return false;
  }
}
/**
 * Get tenant limits from Supabase
 */
export async function getTenantLimits(tenantId: string) {
  try {
    const { getTenantLimitsFromSupabase } = await import('@/lib/supabase/limits');
    return await getTenantLimitsFromSupabase(tenantId);
  } catch (error) {
    return null;
  }
}
