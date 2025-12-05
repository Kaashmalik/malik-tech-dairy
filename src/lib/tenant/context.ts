import { auth } from '@clerk/nextjs/server';
import { getDrizzle } from '@/lib/supabase';
import { tenants, tenantMembers, platformUsers } from '@/db/schema';
import { eq } from 'drizzle-orm';

/**
 * Tenant context interface
 */
export interface TenantContext {
  tenantId: string;
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
  const { userId } = auth();
  const { orgId, orgRole } = auth();
  
  if (!userId) {
    throw new Error('User authentication required');
  }
  
  if (!orgId) {
    throw new Error('Organization selection required');
  }
  
  // In Clerk, orgId is the same as tenantId in our system
  const tenantId = orgId;
  const organizationId = orgId;
  
  // Map Clerk roles to our system roles
  let userRole = 'guest'; // Default role
  
  switch (orgRole) {
    case 'org:admin':
      userRole = 'farm_owner';
      break;
    case 'org:member':
      userRole = 'farm_manager';
      break;
    // Add more role mappings as needed
    default:
      // For additional role resolution, check database
      userRole = await resolveUserRoleFromDatabase(userId, tenantId);
      break;
  }
  
  return {
    tenantId,
    userId,
    userRole,
    organizationId,
  };
}

/**
 * Resolve user role from database membership
 * Fallback when Clerk role doesn't provide enough detail
 */
async function resolveUserRoleFromDatabase(userId: string, tenantId: string): Promise<string> {
  try {
    const db = getDrizzle();
    
    const membership = await db
      .select()
      .from(tenantMembers)
      .where(
        eq(tenantMembers.userId, userId)
      )
      .limit(1);
    
    if (membership.length > 0) {
      return membership[0].role;
    }
    
    // If no membership found, check if user is super admin
    const user = await db
      .select()
      .from(platformUsers)
      .where(eq(platformUsers.id, userId))
      .limit(1);
    
    if (user.length > 0 && user[0].role === 'super_admin') {
      return 'super_admin';
    }
    
    return 'guest';
  } catch (error) {
    console.error('Error resolving user role:', error);
    return 'guest';
  }
}

/**
 * Get tenant information
 */
export async function getTenantInfo(tenantId: string) {
  try {
    const db = getDrizzle();
    
    const tenant = await db
      .select()
      .from(tenants)
      .where(eq(tenants.id, tenantId))
      .limit(1);
    
    return tenant[0] || null;
  } catch (error) {
    console.error('Error getting tenant info:', error);
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
      'super_admin': 4,
      'farm_owner': 3,
      'farm_manager': 2,
      'veterinarian': 2,
      'feed_manager': 2,
      'accountant': 2,
      'breeder': 1,
      'milking_staff': 1,
      'guest': 0,
    };
    
    const userLevel = roleHierarchy[context.userRole as keyof typeof roleHierarchy] || 0;
    const requiredLevel = roleHierarchy[requiredRole as keyof typeof roleHierarchy] || 0;
    
    return userLevel >= requiredLevel;
  } catch (error) {
    console.error('Error checking role:', error);
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
    console.error('Error validating tenant access:', error);
    return false;
  }
}

/**
 * Get user's tenant memberships
 */
export async function getUserTenants() {
  try {
    const { userId } = auth();
    
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
    console.error('Error getting user tenants:', error);
    return [];
  }
}

/**
 * Check if tenant is on a specific subscription plan
 */
export async function checkTenantSubscription(planName: string): Promise<boolean> {
  try {
    const context = await getTenantContext();
    const db = getDrizzle();
    
    // This would need to be implemented based on your subscription table structure
    // For now, return true as placeholder
    return true;
  } catch (error) {
    console.error('Error checking subscription:', error);
    return false;
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
    console.error('Error getting tenant feature overrides:', error);
    return {};
  }
}
