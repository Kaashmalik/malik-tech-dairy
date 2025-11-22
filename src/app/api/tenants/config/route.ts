// API Route: Get/Update Tenant Config
import { NextRequest, NextResponse } from "next/server";
import { withTenantContext } from "@/lib/api/middleware";
import { getTenantConfig, setTenantConfig } from "@/lib/firebase/tenant";
import { checkUserRole } from "@/lib/api/middleware";

export const dynamic = "force-dynamic";

// GET: Fetch tenant config
export async function GET(request: NextRequest) {
  return withTenantContext(async (req, context) => {
    try {
      const config = await getTenantConfig(context.tenantId);

      if (!config) {
        return NextResponse.json(
          { error: "Tenant config not found" },
          { status: 404 }
        );
      }

      return NextResponse.json(config);
    } catch (error) {
      console.error("Error fetching tenant config:", error);
      return NextResponse.json(
        { error: "Internal server error" },
        { status: 500 }
      );
    }
  })(request);
}

// PUT: Update tenant config (owner/manager only)
export async function PUT(request: NextRequest) {
  return withTenantContext(async (req, context) => {
    try {
      // Check if user has permission
      const hasPermission = await checkUserRole(
        context.tenantId,
        context.userId,
        ["owner", "manager"]
      );

      if (!hasPermission) {
        return NextResponse.json(
          { error: "Insufficient permissions" },
          { status: 403 }
        );
      }

      const body = await req.json();
      const updates = {
        farmName: body.farmName,
        logoUrl: body.logoUrl,
        primaryColor: body.primaryColor,
        accentColor: body.accentColor,
        language: body.language,
        currency: body.currency,
        timezone: body.timezone,
        animalTypes: body.animalTypes,
      };

      await setTenantConfig(context.tenantId, updates);

      return NextResponse.json({ success: true });
    } catch (error) {
      console.error("Error updating tenant config:", error);
      return NextResponse.json(
        { error: "Internal server error" },
        { status: 500 }
      );
    }
  })(request);
}

