// API Route: Get Tenant Subscription (Supabase-based)
import { NextRequest, NextResponse } from "next/server";
import { withTenantContext } from "@/lib/api/middleware";
import { getSubscriptionWithLimits } from "@/lib/supabase/limits";
import { SUBSCRIPTION_PLANS } from "@/lib/constants";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  return withTenantContext(async (req, context) => {
    try {
      const subscription = await getSubscriptionWithLimits(context.tenantId);

      if (!subscription) {
        // Return default free subscription for graceful degradation
        const freePlan = SUBSCRIPTION_PLANS.free;
        return NextResponse.json({
          success: true,
          plan: 'free',
          planDisplayName: freePlan.displayName,
          status: 'trial',
          renewDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
          trialEndsAt: null,
          message: "Using default subscription",
        });
      }

      const planConfig = SUBSCRIPTION_PLANS[subscription.plan] || SUBSCRIPTION_PLANS.free;

      return NextResponse.json({
        success: true,
        plan: subscription.plan,
        planDisplayName: planConfig.displayName,
        status: subscription.status,
        renewDate: subscription.renewDate.toISOString(),
        trialEndsAt: subscription.trialEndsAt?.toISOString() || null,
        price: planConfig.price,
        priceDisplay: planConfig.priceDisplay,
      });
    } catch (error) {
      console.error("Error fetching subscription:", error);
      // Return default for graceful degradation
      return NextResponse.json({
        success: true,
        plan: 'free',
        planDisplayName: SUBSCRIPTION_PLANS.free.displayName,
        status: 'trial',
        renewDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        message: "Error loading subscription, using defaults",
      });
    }
  })(request);
}

