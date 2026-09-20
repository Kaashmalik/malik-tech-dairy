import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { getSupabaseClient } from '@/lib/supabase/server';
import { z } from 'zod';
import { updateTenantSubscription } from '@/lib/subscriptions/management';
import { SubscriptionPlan } from '@/types';
import { TablesUpdate } from '@/types/database';
import { isPlatformSuperAdmin } from '@/lib/admin/require-super-admin';

export const dynamic = 'force-dynamic';

// GET: List all payments (super admin)
export async function GET(_request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId || !(await isPlatformSuperAdmin(userId))) {
      return NextResponse.json(
        { success: false, error: 'Forbidden - Super Admin access required' },
        { status: 403 }
      );
    }

    const supabase = getSupabaseClient();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: payments, error } = await (supabase.from('payments') as any)
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

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const transformed = (payments || []).map((p: any) => ({
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

    return NextResponse.json({ success: true, data: transformed });
  } catch (error) {
    console.error('Error fetching admin payments:', error);
    return NextResponse.json({ success: false, error: 'Internal Error' }, { status: 500 });
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
    if (!userId || !(await isPlatformSuperAdmin(userId))) {
      return NextResponse.json(
        { success: false, error: 'Forbidden - Super Admin access required' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { paymentId, action } = actionSchema.parse(body);

    const supabase = getSupabaseClient();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: payment, error: fetchError } = await (supabase.from('payments') as any)
      .select('*')
      .eq('id', paymentId)
      .single();

    if (fetchError || !payment) {
      return NextResponse.json({ success: false, error: 'Payment not found' }, { status: 404 });
    }

    if (payment.status !== 'manual_verification' && payment.status !== 'pending') {
      return NextResponse.json(
        { success: false, error: 'Payment is not in a verifiable state' },
        { status: 400 }
      );
    }

    if (action === 'approve') {
      await supabase
        .from('payments')
        .update({
          status: 'completed',
          updated_at: new Date().toISOString(),
        } as TablesUpdate<'payments'>)
        .eq('id', paymentId);

      await updateTenantSubscription(payment.tenant_id, {
        plan: payment.plan as SubscriptionPlan,
        status: 'active',
        amount: payment.amount,
        currency: 'PKR',
        gateway: payment.gateway,
        renewDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      });

      return NextResponse.json({ success: true, message: 'Payment approved & Plan upgraded' });
    }

    await supabase
      .from('payments')
      .update({
        status: 'failed',
        updated_at: new Date().toISOString(),
      } as TablesUpdate<'payments'>)
      .eq('id', paymentId);

    return NextResponse.json({ success: true, message: 'Payment rejected' });
  } catch (error) {
    console.error('Error processing payment action:', error);
    return NextResponse.json({ success: false, error: 'Internal Error' }, { status: 500 });
  }
}
