// API Middleware for Tenant Context Validation
import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase/admin";
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

  // Get user role from Firestore (cached in future)
  // For now, return basic context
  return {
    tenantId,
    tenantSlug: tenantSlug || "",
    userId,
    userRole: "owner", // Will be fetched from Firestore
  };
}

/**
 * Middleware wrapper for API routes that require tenant context
 */
export function withTenantContext(
  handler: (req: NextRequest, context: TenantContext) => Promise<NextResponse>
) {
  return async (req: NextRequest) => {
    const { userId, orgId } = await auth();

    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    if (!orgId) {
      return NextResponse.json(
        { error: "No organization (tenant) found. Please complete onboarding." },
        { status: 403 }
      );
    }

    // Get organization slug from Clerk
    const orgSlug = req.headers.get("x-tenant-slug") || "";

    // Fetch user role from Firestore
    let userRole: UserRole = TenantRole.GUEST;
    
    if (adminDb) {
      try {
        // Check for super admin
        const userDoc = await adminDb.collection("users").doc(userId).get();
        if (userDoc.exists) {
          const userData = userDoc.data();
          if (userData?.platformRole === PlatformRole.SUPER_ADMIN) {
            userRole = PlatformRole.SUPER_ADMIN;
          } else {
            // Check tenant member role
            const memberDoc = await adminDb
              .collection("tenants")
              .doc(orgId)
              .collection("members")
              .doc(userId)
              .get();
            
            if (memberDoc.exists) {
              userRole = memberDoc.data()?.role as TenantRole || TenantRole.GUEST;
            } else if (userData?.tenantId === orgId && userData?.role) {
              // Fallback to legacy role
              userRole = userData.role as TenantRole;
            }
          }
        }
      } catch (error) {
        console.error("Error fetching user role:", error);
      }
    }

    const context: TenantContext = {
      tenantId: orgId,
      tenantSlug: orgSlug,
      userId,
      userRole,
    };

    return handler(req, context);
  };
}

/**
 * Check if user has required role for operation
 */
export async function checkUserRole(
  tenantId: string,
  userId: string,
  requiredRoles: UserRole[]
): Promise<boolean> {
  if (!adminDb) {
    return false;
  }

  try {
    // Check for super admin
    const userDoc = await adminDb.collection("users").doc(userId).get();
    
    if (userDoc.exists) {
      const userData = userDoc.data();
      if (userData?.platformRole === PlatformRole.SUPER_ADMIN) {
        return true; // Super admin has all permissions
      }
    }

    // Check tenant member role
    const memberDoc = await adminDb
      .collection("tenants")
      .doc(tenantId)
      .collection("members")
      .doc(userId)
      .get();

    if (memberDoc.exists) {
      const memberData = memberDoc.data();
      const userRole = memberData?.role as TenantRole;
      return requiredRoles.includes(userRole);
    }

    // Fallback: check legacy users collection
    if (userDoc.exists) {
      const userData = userDoc.data();
      if (userData?.tenantId === tenantId && userData?.role) {
        return requiredRoles.includes(userData.role as TenantRole);
      }
    }

    return false;
  } catch (error) {
    console.error("Error checking user role:", error);
    return false;
  }
}

/**
 * Get tenant limits from Firestore
 */
export async function getTenantLimits(tenantId: string) {
  if (!adminDb) {
    return null;
  }

  try {
    const limitsDoc = await adminDb
      .collection("tenants")
      .doc(tenantId)
      .collection("limits")
      .doc("main")
      .get();

    if (!limitsDoc.exists) {
      return null;
    }

    return limitsDoc.data();
  } catch (error) {
    console.error("Error fetching tenant limits:", error);
    return null;
  }
}

