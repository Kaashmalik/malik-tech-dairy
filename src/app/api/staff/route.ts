// Team Management API Routes
import { NextRequest, NextResponse } from "next/server";
import { withRole } from "@/lib/middleware/roleMiddleware";
import { TenantRole, PlatformRole } from "@/types/roles";
import { adminDb } from "@/lib/firebase/admin";
import { AuthenticatedRequest } from "@/lib/middleware/roleMiddleware";

// GET - List all team members
export const GET = withRole(
  [
    PlatformRole.SUPER_ADMIN,
    TenantRole.FARM_OWNER,
    TenantRole.FARM_MANAGER,
  ],
  async (req: AuthenticatedRequest) => {
    const tenantId = req.user!.tenantId || 
                     req.nextUrl.searchParams.get("tenantId") ||
                     req.headers.get("x-tenant-id") ||
                     "";

    if (!adminDb) {
      return NextResponse.json(
        { error: "Database not initialized" },
        { status: 500 }
      );
    }

    try {
      const membersSnapshot = await adminDb
        .collection("tenants")
        .doc(tenantId)
        .collection("members")
        .get();

      const members = membersSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      return NextResponse.json({ members });
    } catch (error) {
      console.error("Error fetching members:", error);
      return NextResponse.json(
        { error: "Failed to fetch members" },
        { status: 500 }
      );
    }
  }
);

// POST - Invite new team member
export const POST = withRole(
  [PlatformRole.SUPER_ADMIN, TenantRole.FARM_OWNER, TenantRole.FARM_MANAGER],
  async (req: AuthenticatedRequest) => {
    const tenantId = req.user!.tenantId || 
                     req.nextUrl.searchParams.get("tenantId") ||
                     req.headers.get("x-tenant-id") ||
                     "";
    const { email, role } = await req.json();

    if (!email || !role) {
      return NextResponse.json(
        { error: "Email and role are required" },
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
      // Create invitation document
      const inviteRef = adminDb.collection("invitations").doc();
      const inviteId = inviteRef.id;

      await inviteRef.set({
        email,
        role,
        tenantId,
        invitedBy: req.user!.id,
        status: "pending",
        createdAt: new Date(),
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
      });

      // TODO: Send invitation email via Resend or similar service
      // For now, return the invite ID

      return NextResponse.json({
        success: true,
        inviteId,
        message: "Invitation created successfully",
      });
    } catch (error) {
      console.error("Error creating invitation:", error);
      return NextResponse.json(
        { error: "Failed to create invitation" },
        { status: 500 }
      );
    }
  }
);

