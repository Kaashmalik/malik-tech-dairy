// API Route: Create Payment Intent (store before redirecting to gateway)
import { NextRequest, NextResponse } from 'next/server';
import { withTenantContext } from '@/lib/api/middleware';
import { tenantDb, unwrap } from '@/lib/supabase/tenant-db';
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  return withTenantContext(async (req, context) => {
    try {
      const body = await req.json();
      const {
        orderId,
        plan,
        amount,
        originalAmount,
        discountAmount,
        couponCode,
        couponId,
        gateway,
      } = body;

      if (!orderId || !plan || typeof amount !== 'number') {
        return NextResponse.json(
          { success: false, error: 'orderId, plan, and amount are required' },
          { status: 400 }
        );
      }

      const t = tenantDb(context.tenantId);
      const now = new Date().toISOString();
      const metadata = {
        orderId,
        userId: context.userId,
        originalAmount: originalAmount ?? amount,
        discountAmount: discountAmount || 0,
        couponCode: couponCode || null,
        couponId: couponId || null,
      };
      const values = {
        amount: Math.round(amount),
        plan,
        gateway: gateway || 'bank_transfer',
        status: 'pending',
        metadata,
        updated_at: now,
      };

      // Scoped to this farm: an orderId belonging to another farm is never touched
      const existing = unwrap(
        await t.select('payments', 'id').eq('id', orderId).maybeSingle(),
        'Load payment intent'
      );

      if (existing) {
        unwrap(await t.update('payments', values).eq('id', orderId), 'Update payment intent');
      } else {
        const { error } = await t.insert('payments', {
          id: orderId,
          ...values,
          currency: 'PKR',
          transaction_id: null,
          created_at: now,
        });
        if (error?.code === '23505') {
          // orderId exists under a different farm
          return NextResponse.json(
            { success: false, error: 'Order ID already in use' },
            { status: 409 }
          );
        }
        if (error) {
          throw new Error(`Create payment intent: ${error.message}`);
        }
      }

      return NextResponse.json({ success: true, data: { orderId } });
    } catch (error) {
      console.error('Payment intent error:', error);
      return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
    }
  })(request);
}
