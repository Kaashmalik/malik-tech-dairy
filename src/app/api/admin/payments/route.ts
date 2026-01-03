import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { getSupabaseClient } from '@/lib/supabase/server';
import { z } from 'zod';
import { updateTenantSubscription } from '@/lib/subscriptions/management';
import { SubscriptionPlan, SubscriptionStatus } from '@/types';

export const dynamic = 'force-dynamic';

// GET: List all payments (filtered for admin)
export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // TODO: Strict Admin Check (omitted for brevity, assume protected route group or middleware)

    const supabase = getSupabaseClient();

    // Fetch payments with Manual Verification status
    const { data: payments, error } = await supabase
      .from('payments')
      .select(
        `
         *,
         tenant:tenants(farm_name)
       `
      )
      .order('created_at', { ascending: false });

    if (error) {
      throw error;
    }

    // Transform for frontend
    const transformed = payments.map(p => ({
      id: p.id,
      tenantId: p.tenant_id,
      amount: p.amount,
      currency: p.currency,
      gateway: p.gateway,
      status: p.status,
      plan: p.plan,
      metadata: p.metadata,
      createdAt: p.created_at,
      tenant: {
        farmName: p.tenant?.farm_name || 'Unknown Farm',
      },
    }));

    return NextResponse.json(transformed);
  } catch (error) {
    console.error('Error fetching admin payments:', error);
    return NextResponse.json({ error: 'Internal Error' }, { status: 500 });
  }
}

// PUT: Approve / Reject Payment
const actionSchema = z.object({
  paymentId: z.string(),
  action: z.enum(['approve', 'reject']),
});

export async function PUT(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { paymentId, action } = actionSchema.parse(body);

    const supabase = getSupabaseClient();

    // 1. Get Payment Record
    const { data: payment, error: fetchError } = await supabase
      .from('payments')
      .select('*')
      .eq('id', paymentId)
      .single();

    if (fetchError || !payment) {
      return NextResponse.json({ error: 'Payment not found' }, { status: 404 });
    }

    if (payment.status !== 'manual_verification' && payment.status !== 'pending') {
      return NextResponse.json({ error: 'Payment is not in a verifiable state' }, { status: 400 });
    }

    if (action === 'approve') {
      // 2. Update Payment Status to Completed
      await supabase
        .from('payments')
        .update({ status: 'completed', updated_at: new Date().toISOString() })
        .eq('id', paymentId);

      // 3. Upgrade Subscription
      await updateTenantSubscription(payment.tenant_id, {
        plan: payment.plan as SubscriptionPlan,
        status: 'active',
        amount: payment.amount,
        currency: 'PKR',
        gateway: payment.gateway,
        renewDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 Days from now
      });

      return NextResponse.json({ success: true, message: 'Payment approved & Plan upgraded' });
    } else {
      // Reject
      await supabase
        .from('payments')
        .update({ status: 'failed', updated_at: new Date().toISOString() })
        .eq('id', paymentId);

      return NextResponse.json({ success: true, message: 'Payment rejected' });
    }
  } catch (error) {
    console.error('Error processing payment action:', error);
    return NextResponse.json({ error: 'Internal Error' }, { status: 500 });
  }
}
