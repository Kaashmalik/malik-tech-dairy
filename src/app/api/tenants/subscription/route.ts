// API Route: Get Tenant Subscription
import { NextRequest, NextResponse } from "next/server";
import { withTenantContext } from "@/lib/api/middleware";
import { getTenantSubscription } from "@/lib/firebase/tenant";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  return withTenantContext(async (req, context) => {
    try {
      const subscription = await getTenantSubscription(context.tenantId);

      if (!subscription) {
        return NextResponse.json(
          { error: "Subscription not found" },
          { status: 404 }
        );
      }

      return NextResponse.json(subscription);
    } catch (error) {
      console.error("Error fetching subscription:", error);
      return NextResponse.json(
        { error: "Internal server error" },
        { status: 500 }
      );
    }
  })(request);
}

