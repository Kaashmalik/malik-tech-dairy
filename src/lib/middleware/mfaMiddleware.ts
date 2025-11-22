// MFA Enforcement Middleware for Owner/Admin Roles
import { auth, clerkClient } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { TenantRole, PlatformRole } from "@/types/roles";
import { adminDb } from "@/lib/firebase/admin";

/**
 * Check if user has MFA enabled via Clerk
 */
async function checkMFAStatus(userId: string): Promise<boolean> {
  try {
    const client = await clerkClient();
    const user = await client.users.getUser(userId);
    
    // Check if user has MFA enabled
    // Clerk stores MFA status in user's publicMetadata or we check backup codes
    const mfaEnabled = user.twoFactorEnabled || 
                      (user.publicMetadata?.mfaEnabled as boolean) || 
                      false;
    
    return mfaEnabled;
  } catch (error) {
    console.error("Error checking MFA status:", error);
    return false;
  }
}

/**
 * Get user role from Firestore
 */
async function getUserRole(tenantId: string, userId: string): Promise<string | null> {
  if (!adminDb) {
    return null;
  }

  try {
    // Check for super admin
    const userDoc = await adminDb.collection("users").doc(userId).get();
    if (userDoc.exists) {
      const userData = userDoc.data();
      if (userData?.platformRole === PlatformRole.SUPER_ADMIN) {
        return PlatformRole.SUPER_ADMIN;
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
      return memberDoc.data()?.role || null;
    }

    // Fallback to legacy users collection
    if (userDoc.exists) {
      const userData = userDoc.data();
      if (userData?.tenantId === tenantId && userData?.role) {
        return userData.role;
      }
    }

    return null;
  } catch (error) {
    console.error("Error fetching user role:", error);
    return null;
  }
}

/**
 * Roles that require MFA
 */
const MFA_REQUIRED_ROLES = [
  PlatformRole.SUPER_ADMIN,
  TenantRole.FARM_OWNER,
  TenantRole.FARM_MANAGER,
];

/**
 * Middleware to enforce MFA for owner/admin roles
 */
export async function enforceMFA(
  req: NextRequest,
  tenantId: string,
  userId: string
): Promise<NextResponse | null> {
  try {
    const userRole = await getUserRole(tenantId, userId);
    
    if (!userRole) {
      return NextResponse.json(
        { error: "User role not found" },
        { status: 403 }
      );
    }

    // Check if role requires MFA
    if (MFA_REQUIRED_ROLES.includes(userRole as any)) {
      const hasMFA = await checkMFAStatus(userId);
      
      if (!hasMFA) {
        return NextResponse.json(
          {
            error: "Multi-factor authentication (MFA) is required for this role",
            code: "MFA_REQUIRED",
            message: "Please enable MFA in your account settings to access this resource.",
          },
          { status: 403 }
        );
      }
    }

    return null; // MFA check passed
  } catch (error) {
    console.error("Error in MFA enforcement:", error);
    return NextResponse.json(
      { error: "Failed to verify MFA status" },
      { status: 500 }
    );
  }
}

/**
 * Wrapper for API routes that require MFA
 */
export function withMFAEnforcement(
  handler: (req: NextRequest, context: { tenantId: string; userId: string }) => Promise<NextResponse>
) {
  return async (req: NextRequest) => {
    const { userId, orgId } = await auth();

    if (!userId || !orgId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Enforce MFA
    const mfaCheck = await enforceMFA(req, orgId, userId);
    if (mfaCheck) {
      return mfaCheck;
    }

    return handler(req, { tenantId: orgId, userId });
  };
}

