// API Route: Get Tenant Limits with Usage
import { NextRequest, NextResponse } from "next/server";
import { withTenantContext } from "@/lib/api/middleware";
import { getTenantLimits } from "@/lib/firebase/tenant";
import { adminDb } from "@/lib/firebase/admin";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  return withTenantContext(async (req, context) => {
    try {
      const limits = await getTenantLimits(context.tenantId);

      if (!limits) {
        return NextResponse.json(
          { error: "Limits not found" },
          { status: 404 }
        );
      }

      // Get actual usage counts
      let animalCount = 0;
      let userCount = 0;

      if (adminDb) {
        // Count animals
        const animalsRef = adminDb
          .collection("tenants_data")
          .doc(`${context.tenantId}_animals`)
          .collection("animals");
        
        const animalsSnapshot = await animalsRef
          .where("status", "!=", "deceased")
          .get();
        animalCount = animalsSnapshot.size;

        // Count users
        const usersSnapshot = await adminDb
          .collection("users")
          .where("tenantId", "==", context.tenantId)
          .get();
        userCount = usersSnapshot.size;
      }

      return NextResponse.json({
        ...limits,
        animalCount,
        userCount,
      });
    } catch (error) {
      console.error("Error fetching limits:", error);
      return NextResponse.json(
        { error: "Internal server error" },
        { status: 500 }
      );
    }
  })(request);
}

