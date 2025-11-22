// Update or remove team member
import { NextRequest, NextResponse } from "next/server";
import { withRole } from "@/lib/middleware/roleMiddleware";
import { TenantRole, PlatformRole } from "@/types/roles";
import { adminDb } from "@/lib/firebase/admin";
import { AuthenticatedRequest } from "@/lib/middleware/roleMiddleware";

// PUT - Update member role
export const PUT = withRole(
  [PlatformRole.SUPER_ADMIN, TenantRole.FARM_OWNER, TenantRole.FARM_MANAGER],
  async (req: AuthenticatedRequest, { params }: { params: { memberId: string } }) => {
    const tenantId = req.user!.tenantId;
    const { memberId } = params;
    const { role, status } = await req.json();

    if (!adminDb) {
      return NextResponse.json(
        { error: "Database not initialized" },
        { status: 500 }
      );
    }

    try {
      const memberRef = adminDb
        .collection("tenants")
        .doc(tenantId)
        .collection("members")
        .doc(memberId);

      const updateData: any = {};
      if (role) updateData.role = role;
      if (status) updateData.status = status;
      updateData.updatedAt = new Date();

      await memberRef.update(updateData);

      return NextResponse.json({ success: true });
    } catch (error) {
      console.error("Error updating member:", error);
      return NextResponse.json(
        { error: "Failed to update member" },
        { status: 500 }
      );
    }
  }
);

// DELETE - Remove team member
export const DELETE = withRole(
  [PlatformRole.SUPER_ADMIN, TenantRole.FARM_OWNER],
  async (req: AuthenticatedRequest, { params }: { params: { memberId: string } }) => {
    const tenantId = req.user!.tenantId;
    const { memberId } = params;

    if (!adminDb) {
      return NextResponse.json(
        { error: "Database not initialized" },
        { status: 500 }
      );
    }

    try {
      // Don't allow removing the owner
      const memberDoc = await adminDb
        .collection("tenants")
        .doc(tenantId)
        .collection("members")
        .doc(memberId)
        .get();

      if (memberDoc.exists) {
        const memberData = memberDoc.data();
        if (memberData?.role === TenantRole.FARM_OWNER) {
          return NextResponse.json(
            { error: "Cannot remove farm owner" },
            { status: 400 }
          );
        }
      }

      await adminDb
        .collection("tenants")
        .doc(tenantId)
        .collection("members")
        .doc(memberId)
        .delete();

      return NextResponse.json({ success: true });
    } catch (error) {
      console.error("Error removing member:", error);
      return NextResponse.json(
        { error: "Failed to remove member" },
        { status: 500 }
      );
    }
  }
);

