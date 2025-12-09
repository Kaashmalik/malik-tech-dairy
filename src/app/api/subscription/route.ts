// API Route: Get & Update Subscription
import { NextRequest, NextResponse } from 'next/server';
import { withTenantContext } from '@/lib/api/middleware';
import { getTenantSubscription } from '@/lib/firebase/tenant';
import { cancelSubscription, downgradeToFree } from '@/lib/subscriptions/management';
import { checkUserRole } from '@/lib/api/middleware';

export const dynamic = 'force-dynamic';

// GET: Get current subscription
export async function GET(request: NextRequest) {
  return withTenantContext(async (req, context) => {
    try {
      const subscription = await getTenantSubscription(context.tenantId);

      if (!subscription) {
        return NextResponse.json({ error: 'Subscription not found' }, { status: 404 });
      }

      return NextResponse.json(subscription);
    } catch (error) {
      console.error('Error fetching subscription:', error);
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
  })(request);
}

// DELETE: Cancel subscription
export async function DELETE(request: NextRequest) {
  return withTenantContext(async (req, context) => {
    try {
      // Only owner can cancel
      const hasPermission = await checkUserRole(context.tenantId, context.userId, ['owner']);

      if (!hasPermission) {
        return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
      }

      await cancelSubscription(context.tenantId);

      // Downgrade to free tier
      await downgradeToFree(context.tenantId);

      return NextResponse.json({ success: true });
    } catch (error) {
      console.error('Error cancelling subscription:', error);
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
  })(request);
}
