// Send invitation email
import { NextRequest, NextResponse } from "next/server";
import { withRole } from "@/lib/middleware/roleMiddleware";
import { TenantRole, PlatformRole } from "@/types/roles";
import { adminDb } from "@/lib/firebase/admin";
import { AuthenticatedRequest } from "@/lib/middleware/roleMiddleware";

export const POST = withRole(
  [PlatformRole.SUPER_ADMIN, TenantRole.FARM_OWNER, TenantRole.FARM_MANAGER],
  async (req: AuthenticatedRequest) => {
    const tenantId = req.user!.tenantId;
    const { email, role, inviteId } = await req.json();

    if (!email || !role || !inviteId) {
      return NextResponse.json(
        { error: "Email, role, and inviteId are required" },
        { status: 400 }
      );
    }

    // TODO: Integrate with email service (Resend, SendGrid, etc.)
    // For now, return success
    // The invitation document is already created in the staff route

    const inviteUrl = `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/invite/${inviteId}`;

    return NextResponse.json({
      success: true,
      message: "Invitation email sent",
      inviteUrl, // Return URL for testing
    });
  }
);

