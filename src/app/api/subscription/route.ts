// API Route: Current subscription (read) and cancellation.
// Source of truth is the `subscriptions` table via SubscriptionService - the same
// data plan limits are enforced from. Paid upgrades never happen here: they go
// through checkout -> payment verification (gateway callback or super-admin review).
import { NextRequest, NextResponse } from 'next/server';
import { withTenantContext, checkUserRole } from '@/lib/api/middleware';
import { SubscriptionService, downgradeToFree } from '@/lib/subscriptions/management';
import { SUBSCRIPTION_PLANS } from '@/lib/constants';
import { logger } from '@/lib/logger';

export const dynamic = 'force-dynamic';

// GET: Get current subscription
export async function GET(request: NextRequest) {
  return withTenantContext(async (_req, context) => {
    try {
      const sub = await new SubscriptionService(context.tenantId).getSubscription();
      const plan = sub.plan in SUBSCRIPTION_PLANS ? sub.plan : 'free';
      const planDetails = SUBSCRIPTION_PLANS[plan as keyof typeof SUBSCRIPTION_PLANS];
      const record = sub as unknown as { renewDate?: Date; created_at?: string };
      return NextResponse.json({
        plan,
        status: sub.status,
        amount: planDetails.price || 0,
        // Free never renews; don't show the far-future sentinel date
        renewDate: plan === 'free' ? null : record.renewDate || null,
        features: planDetails,
        limits: sub.limits,
        startDate: record.created_at || null,
      });
    } catch (error) {
      logger.error('Subscription lookup failed', error, { tenantId: context.tenantId });
      return NextResponse.json({ error: 'Failed to load subscription' }, { status: 500 });
    }
  })(request);
}

// DELETE: Cancel subscription (owner only) -> free plan
export async function DELETE(request: NextRequest) {
  return withTenantContext(async (_req, context) => {
    try {
      const hasPermission = await checkUserRole(context.tenantId, context.userId, ['owner']);
      if (!hasPermission) {
        return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
      }
      await downgradeToFree(context.tenantId);
      logger.info('Subscription cancelled', { tenantId: context.tenantId, userId: context.userId });
      return NextResponse.json({
        success: true,
        message: 'Subscription cancelled. Downgraded to free plan.',
      });
    } catch (error) {
      logger.error('Subscription cancel failed', error, { tenantId: context.tenantId });
      return NextResponse.json({ error: 'Failed to cancel subscription' }, { status: 500 });
    }
  })(request);
}
