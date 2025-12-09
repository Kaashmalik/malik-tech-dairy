// API Route: Create Payment Intent (store before redirecting to gateway)
import { NextRequest, NextResponse } from 'next/server';
import { withTenantContext } from '@/lib/api/middleware';
import { adminDb } from '@/lib/firebase/admin';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  return withTenantContext(async (req, context) => {
    try {
      if (!adminDb) {
        return NextResponse.json({ error: 'Database not available' }, { status: 500 });
      }

      const body = await req.json();
      const { orderId, plan, amount, originalAmount, discountAmount, couponCode, couponId } = body;

      // Store payment intent
      await adminDb.collection('payment_intents').add({
        tenantId: context.tenantId,
        userId: context.userId,
        orderId,
        plan,
        amount,
        originalAmount: originalAmount || amount,
        discountAmount: discountAmount || 0,
        couponCode: couponCode || null,
        couponId: couponId || null,
        status: 'pending',
        createdAt: new Date(),
      });

      return NextResponse.json({ success: true });
    } catch (error) {
      console.error('Error creating payment intent:', error);
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
  })(request);
}
