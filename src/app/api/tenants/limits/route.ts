// API Route: Get Tenant Limits with Usage (Supabase-based)
import { NextRequest, NextResponse } from 'next/server';
import { withTenantContext } from '@/lib/api/middleware';
import { getSubscriptionWithLimits, getAnimalCount, getUserCount } from '@/lib/supabase/limits';
import { SUBSCRIPTION_PLANS } from '@/lib/constants';
export const dynamic = 'force-dynamic';
export async function GET(request: NextRequest) {
  return withTenantContext(async (req, context) => {
    try {
      // Get subscription and limits from Supabase
      const subscription = await getSubscriptionWithLimits(context.tenantId);
      if (!subscription) {
        // Return default free tier limits
        return NextResponse.json({
          success: true,
          plan: 'free',
          planDisplayName: SUBSCRIPTION_PLANS.free.displayName,
          status: 'trial',
          maxAnimals: 5,
          maxUsers: 1,
          features: ['basic_milk_logs', 'mobile_app'],
          animalCount: 0,
          userCount: 0,
          trialEndsAt: null,
          renewDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        });
      }
      // Get current usage counts from Supabase
      const [animalCount, userCount] = await Promise.all([
        getAnimalCount(context.tenantId),
        getUserCount(context.tenantId),
      ]);
      const planConfig = SUBSCRIPTION_PLANS[subscription.plan] || SUBSCRIPTION_PLANS.free;
      return NextResponse.json({
        success: true,
        plan: subscription.plan,
        planDisplayName: planConfig.displayName,
        status: subscription.status,
        maxAnimals: subscription.limits.maxAnimals,
        maxUsers: subscription.limits.maxUsers,
        features: subscription.limits.features,
        animalCount,
        userCount,
        trialEndsAt: subscription.trialEndsAt?.toISOString() || null,
        renewDate: subscription.renewDate.toISOString(),
        // Usage percentages
        animalUsagePercent:
          subscription.limits.maxAnimals === -1
            ? 0
            : Math.round((animalCount / subscription.limits.maxAnimals) * 100),
        userUsagePercent:
          subscription.limits.maxUsers === -1
            ? 0
            : Math.round((userCount / subscription.limits.maxUsers) * 100),
        // Can add more?
        canAddAnimal:
          subscription.limits.maxAnimals === -1 || animalCount < subscription.limits.maxAnimals,
        canAddUser: subscription.limits.maxUsers === -1 || userCount < subscription.limits.maxUsers,
      });
    } catch (error) {
      return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
    }
  })(request);
}