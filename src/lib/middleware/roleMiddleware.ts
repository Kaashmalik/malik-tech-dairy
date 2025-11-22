// Role-based API Middleware
import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { doc, getDoc } from "firebase/firestore";
import { adminDb } from "@/lib/firebase/admin";
import { TenantRole, UserRole, PlatformRole, ROLE_PERMISSIONS } from "@/types/roles";

export interface AuthenticatedRequest extends NextRequest {
  user?: {
    id: string;
    role: UserRole;
    tenantId: string;
  };
}

export async function withAuth(
  handler: (req: AuthenticatedRequest) => Promise<Response>
) {
  return async (req: NextRequest) => {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Attach user info to request
    (req as AuthenticatedRequest).user = {
      id: userId,
      role: TenantRole.GUEST as UserRole,
      tenantId: "",
    };

    return handler(req as AuthenticatedRequest);
  };
}

export async function withRole(
  requiredRoles: UserRole[],
  handler: (req: AuthenticatedRequest) => Promise<Response>
) {
  return withAuth(async (req: AuthenticatedRequest) => {
    const { userId } = await auth();
    const tenantId = req.nextUrl.searchParams.get("tenantId") || 
                     req.headers.get("x-tenant-id") ||
                     "";

    if (!tenantId) {
      return NextResponse.json(
        { error: "Tenant ID required" },
        { status: 400 }
      );
    }

    if (!adminDb) {
      return NextResponse.json(
        { error: "Database not initialized" },
        { status: 500 }
      );
    }

    try {
      // Check if super admin
      const userDoc = await adminDb.collection("users").doc(userId!).get();

      if (userDoc.exists) {
        const userData = userDoc.data();
        if (userData?.platformRole === PlatformRole.SUPER_ADMIN) {
          req.user = {
            id: userId!,
            role: PlatformRole.SUPER_ADMIN,
            tenantId,
          };
          return handler(req);
        }
      }

      // Check tenant role
      const memberDoc = await adminDb
        .collection("tenants")
        .doc(tenantId)
        .collection("members")
        .doc(userId!)
        .get();

      if (!memberDoc.exists) {
        // Fallback: check legacy users collection
        if (userDoc.exists) {
          const userData = userDoc.data();
          if (userData?.tenantId === tenantId && userData?.role) {
            const userRole = userData.role as TenantRole;
            if (requiredRoles.includes(userRole)) {
              req.user = {
                id: userId!,
                role: userRole,
                tenantId,
              };
              return handler(req);
            }
          }
        }

        return NextResponse.json(
          { error: "Not a member of this tenant" },
          { status: 403 }
        );
      }

      const memberData = memberDoc.data();
      const userRole = memberData?.role as TenantRole;

      if (!requiredRoles.includes(userRole)) {
        return NextResponse.json(
          {
            error: "Insufficient permissions",
            required: requiredRoles,
            current: userRole,
          },
          { status: 403 }
        );
      }

      req.user = {
        id: userId!,
        role: userRole,
        tenantId,
      };

      return handler(req);
    } catch (error) {
      console.error("Error in withRole middleware:", error);
      return NextResponse.json(
        { error: "Internal server error" },
        { status: 500 }
      );
    }
  });
}

export async function withPermission(
  resource: string,
  action: "create" | "read" | "update" | "delete",
  handler: (req: AuthenticatedRequest) => Promise<Response>
) {
  return withAuth(async (req: AuthenticatedRequest) => {
    const { userId } = await auth();
    const tenantId = req.nextUrl.searchParams.get("tenantId") ||
                     req.headers.get("x-tenant-id") ||
                     "";

    if (!tenantId) {
      return NextResponse.json(
        { error: "Tenant ID required" },
        { status: 400 }
      );
    }

    if (!adminDb) {
      return NextResponse.json(
        { error: "Database not initialized" },
        { status: 500 }
      );
    }

    try {
      // Check if super admin
      const userDoc = await adminDb.collection("users").doc(userId!).get();

      if (userDoc.exists) {
        const userData = userDoc.data();
        if (userData?.platformRole === PlatformRole.SUPER_ADMIN) {
          req.user = {
            id: userId!,
            role: PlatformRole.SUPER_ADMIN,
            tenantId,
          };
          return handler(req);
        }
      }

      // Get user role and permissions
      const memberDoc = await adminDb
        .collection("tenants")
        .doc(tenantId)
        .collection("members")
        .doc(userId!)
        .get();

      if (!memberDoc.exists) {
        // Fallback: check legacy users collection
        if (userDoc.exists) {
          const userData = userDoc.data();
          if (userData?.tenantId === tenantId && userData?.role) {
            const userRole = userData.role as TenantRole;
            const rolePerms = ROLE_PERMISSIONS[userRole];
            const hasPermission = rolePerms?.some(
              (p) => p.resource === resource && p.actions.includes(action)
            );

            if (hasPermission) {
              req.user = {
                id: userId!,
                role: userRole,
                tenantId,
              };
              return handler(req);
            }
          }
        }

        return NextResponse.json(
          { error: "Not a member of this tenant" },
          { status: 403 }
        );
      }

      const memberData = memberDoc.data();
      const userRole = memberData?.role as TenantRole;

      // Check custom permissions first
      if (memberData?.permissions?.[resource]?.includes(action)) {
        req.user = {
          id: userId!,
          role: userRole,
          tenantId,
        };
        return handler(req);
      }

      // Check default role permissions
      const rolePerms = ROLE_PERMISSIONS[userRole];
      const hasPermission = rolePerms?.some(
        (p) => p.resource === resource && p.actions.includes(action)
      );

      if (!hasPermission) {
        return NextResponse.json(
          {
            error: "Insufficient permissions",
            required: { resource, action },
            role: userRole,
          },
          { status: 403 }
        );
      }

      req.user = {
        id: userId!,
        role: userRole,
        tenantId,
      };

      return handler(req);
    } catch (error) {
      console.error("Error in withPermission middleware:", error);
      return NextResponse.json(
        { error: "Internal server error" },
        { status: 500 }
      );
    }
  });
}

