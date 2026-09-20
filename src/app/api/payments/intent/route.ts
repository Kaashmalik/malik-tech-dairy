// API Route: Create Payment Intent (store before redirecting to gateway)
import { NextRequest, NextResponse } from 'next/server';
import { withTenantContext } from '@/lib/api/middleware';
import { getDrizzle } from '@/lib/supabase/server';
import { payments } from '@/db/schema';
import { eq } from 'drizzle-orm';
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

      const db = getDrizzle();
      const now = new Date();
      const metadata = {
        orderId,
        userId: context.userId,
        originalAmount: originalAmount ?? amount,
        discountAmount: discountAmount || 0,
        couponCode: couponCode || null,
        couponId: couponId || null,
      };

      const [existing] = await db
        .select({ id: payments.id })
        .from(payments)
        .where(eq(payments.id, orderId))
        .limit(1);

      if (existing) {
        await db
          .update(payments)
          .set({
            amount: Math.round(amount),
            plan,
            gateway: (gateway || 'bank_transfer') as
              | 'jazzcash'
              | 'easypaisa'
              | 'xpay'
              | 'bank_transfer',
            status: 'pending',
            metadata,
            updatedAt: now,
          })
          .where(eq(payments.id, orderId));
      } else {
        await db.insert(payments).values({
          id: orderId,
          tenantId: context.tenantId,
          amount: Math.round(amount),
          currency: 'PKR',
          gateway: (gateway || 'bank_transfer') as
            | 'jazzcash'
            | 'easypaisa'
            | 'xpay'
            | 'bank_transfer',
          status: 'pending',
          transactionId: null,
          plan,
          metadata,
          createdAt: now,
          updatedAt: now,
        });
      }

      return NextResponse.json({ success: true, data: { orderId } });
    } catch (error) {
      console.error('Payment intent error:', error);
      return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
    }
  })(request);
}
