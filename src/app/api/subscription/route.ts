// API Route: Get & Update Subscription (Supabase-based)
import { NextRequest, NextResponse } from 'next/server';
import { withTenantContext } from '@/lib/api/middleware';
import { getSupabaseClient } from '@/lib/supabase';
import { checkUserRole } from '@/lib/api/middleware';
import { SUBSCRIPTION_PLANS } from '@/lib/constants';
export const dynamic = 'force-dynamic';
// GET: Get current subscription
export async function GET(request: NextRequest) {
  return withTenantContext(async (req, context) => {
    try {
      const supabase = getSupabaseClient();
      // Get tenant subscription from Supabase
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: tenant, error } = (await supabase
        .from('tenants')
        .select('subscription_plan, subscription_status, subscription_expires_at, created_at')
        .eq('id', context.tenantId)
        .single()) as { data: any; error: any };
      if (error || !tenant) {
        // Return default free subscription if tenant not found
        return NextResponse.json({
          plan: 'free',
          status: 'trial',
          amount: 0,
          renewDate: null,
          features: SUBSCRIPTION_PLANS.free,
        });
      }
      const plan = tenant.subscription_plan || 'free';
      const planDetails = SUBSCRIPTION_PLANS[plan as keyof typeof SUBSCRIPTION_PLANS] || SUBSCRIPTION_PLANS.free;
      return NextResponse.json({
        plan,
        status: tenant.subscription_status || 'trial',
        amount: planDetails.price || 0,
        renewDate: tenant.subscription_expires_at,
        features: planDetails,
        startDate: tenant.created_at,
      });
    } catch (error) {
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
  })(request);
}
// PUT: Update subscription
export async function PUT(request: NextRequest) {
  return withTenantContext(async (req, context) => {
    try {
      // Only owner can update subscription
      const hasPermission = await checkUserRole(context.tenantId, context.userId, ['owner']);
      if (!hasPermission) {
        return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
      }
      const body = await req.json();
      const { plan, gateway, transactionId } = body;
      if (!plan || !SUBSCRIPTION_PLANS[plan as keyof typeof SUBSCRIPTION_PLANS]) {
        return NextResponse.json({ error: 'Invalid plan' }, { status: 400 });
      }
      const supabase = getSupabaseClient();
      const now = new Date();
      const expiresAt = new Date(now.setMonth(now.getMonth() + 1)).toISOString();
      // Update tenant subscription
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = (await supabase
        .from('tenants')
        .update({
          subscription_plan: plan,
          subscription_status: 'active',
          subscription_expires_at: expiresAt,
          updated_at: new Date().toISOString(),
        })
        .eq('id', context.tenantId)) as { error: any };
      if (error) {
        return NextResponse.json({ error: 'Failed to update subscription' }, { status: 500 });
      }
      // Log the payment/subscription change
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (supabase
        .from('subscription_history')
        .insert({
          tenant_id: context.tenantId,
          user_id: context.userId,
          plan,
          gateway: gateway || 'manual',
          transaction_id: transactionId || null,
          amount: SUBSCRIPTION_PLANS[plan as keyof typeof SUBSCRIPTION_PLANS].price,
          status: 'completed',
          created_at: new Date().toISOString(),
        }) as any);
      return NextResponse.json({
        success: true,
        message: 'Subscription updated successfully',
        plan,
        expiresAt,
      });
    } catch (error) {
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
      const supabase = getSupabaseClient();
      // Downgrade to free plan
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = (await supabase
        .from('tenants')
        .update({
          subscription_plan: 'free',
          subscription_status: 'cancelled',
          subscription_expires_at: null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', context.tenantId)) as { error: any };
      if (error) {
        return NextResponse.json({ error: 'Failed to cancel subscription' }, { status: 500 });
      }
      return NextResponse.json({
        success: true,
        message: 'Subscription cancelled. Downgraded to free plan.',
      });
    } catch (error) {
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
  })(request);
}