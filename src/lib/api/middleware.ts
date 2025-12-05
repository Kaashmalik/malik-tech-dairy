// API Middleware for Tenant Context Validation (Supabase-based)
import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { getSupabaseClient } from "@/lib/supabase";
import { UserRole, PlatformRole, TenantRole } from "@/types/roles";

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
  const tenantId = request.headers.get("x-tenant-id");
  const tenantSlug = request.headers.get("x-tenant-slug");
  const userId = request.headers.get("x-user-id");

  if (!tenantId || !userId) {
    return null;
  }

  return {
    tenantId,
    tenantSlug: tenantSlug || "",
    userId,
    userRole: "farm_owner", // Default role
  };
}

/**
 * Get user role from Supabase
 */
async function getUserRoleFromSupabase(tenantId: string, userId: string): Promise<UserRole> {
  try {
    const supabase = getSupabaseClient();
    
    // Check if user is super admin
    const { data: platformUser } = await supabase
      .from('platform_users')
      .select('role')
      .eq('id', userId)
      .single() as { data: any };

    if (platformUser?.role === 'super_admin') {
      return PlatformRole.SUPER_ADMIN;
    }

    // Check tenant member role
    const { data: member } = await supabase
      .from('tenant_members')
      .select('role')
      .eq('tenant_id', tenantId)
      .eq('user_id', userId)
      .eq('status', 'active')
      .single() as { data: any };

    if (member?.role) {
      return member.role as TenantRole;
    }

    return TenantRole.GUEST;
  } catch (error) {
    console.error("Error fetching user role:", error);
    return TenantRole.FARM_OWNER; // Default to owner for graceful degradation
  }
}

/**
 * Middleware wrapper for API routes that require tenant context
 */
export function withTenantContext(
  handler: (req: NextRequest, context: TenantContext) => Promise<NextResponse>
) {
  return async (req: NextRequest) => {
    try {
      const { userId, orgId } = await auth();

      if (!userId) {
        return NextResponse.json(
          { success: false, error: "Unauthorized" },
          { status: 401 }
        );
      }

      if (!orgId) {
        return NextResponse.json(
          { success: false, error: "No organization (tenant) found. Please complete onboarding." },
          { status: 403 }
        );
      }

      // Get organization slug from Clerk
      const orgSlug = req.headers.get("x-tenant-slug") || "";

      // Fetch user role from Supabase
      const userRole = await getUserRoleFromSupabase(orgId, userId);

      const context: TenantContext = {
        tenantId: orgId,
        tenantSlug: orgSlug,
        userId,
        userRole,
      };

      return handler(req, context);
    } catch (error) {
      console.error("Error in withTenantContext:", error);
      return NextResponse.json(
        { success: false, error: "Internal server error" },
        { status: 500 }
      );
    }
  };
}

/**
 * Check if user has required role for operation (Supabase-based)
 */
export async function checkUserRole(
  tenantId: string,
  userId: string,
  requiredRoles: UserRole[]
): Promise<boolean> {
  try {
    const supabase = getSupabaseClient();
    
    // Check for super admin
    const { data: platformUser } = await supabase
      .from('platform_users')
      .select('role')
      .eq('id', userId)
      .single() as { data: any };

    if (platformUser?.role === 'super_admin') {
      return true; // Super admin has all permissions
    }

    // Check tenant member role
    const { data: member } = await supabase
      .from('tenant_members')
      .select('role')
      .eq('tenant_id', tenantId)
      .eq('user_id', userId)
      .eq('status', 'active')
      .single() as { data: any };

    if (member?.role) {
      // Map common role aliases
      const userRole = member.role as TenantRole;
      const roleAliases: Record<string, TenantRole[]> = {
        'owner': [TenantRole.FARM_OWNER],
        'manager': [TenantRole.FARM_MANAGER],
        'farm_owner': [TenantRole.FARM_OWNER],
        'farm_manager': [TenantRole.FARM_MANAGER],
      };
      
      // Check if user's role is in the required roles or aliases
      return requiredRoles.some(required => {
        if (required === userRole) return true;
        const aliases = roleAliases[required as string] || [];
        return aliases.includes(userRole);
      });
    }

    return false;
  } catch (error) {
    console.error("Error checking user role:", error);
    // Return true for graceful degradation (owner-level access)
    return true;
  }
}

/**
 * Get tenant limits from Supabase
 */
export async function getTenantLimits(tenantId: string) {
  try {
    const { getTenantLimitsFromSupabase } = await import("@/lib/supabase/limits");
    return await getTenantLimitsFromSupabase(tenantId);
  } catch (error) {
    console.error("Error fetching tenant limits:", error);
    return null;
  }
}

