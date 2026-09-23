// API Route: Payment Gateway Callbacks (Postgres payment intents — no Firebase)
import { NextRequest, NextResponse } from 'next/server';
import { verifyJazzCashResponse } from '@/lib/payments/jazzcash-server';
import { verifyEasyPaisaResponse } from '@/lib/payments/easypaisa-server';
import { verifyXPayResponse } from '@/lib/payments/xpay-server';
import { updateTenantSubscription } from '@/lib/subscriptions/management';
import { recordCouponUsage } from '@/lib/coupons/validation';
import { getDrizzle } from '@/lib/supabase/server';
import { payments } from '@/db/schema';
import { eq, or, sql } from 'drizzle-orm';
import type { PaymentGateway } from '@/types';

export const dynamic = 'force-dynamic';

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://dairy.mtkcodex.site';

function redirectWith(query: string) {
  return NextResponse.redirect(`${APP_URL}/subscription?${query}`);
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ gateway: string }> }
) {
  try {
    const { gateway } = await params;
    const { searchParams } = new URL(request.url);
    const responseData: Record<string, string> = {};
    searchParams.forEach((value, key) => {
      responseData[key] = value;
    });

    let verification: {
      valid: boolean;
      transactionId?: string;
      amount?: number;
      status?: string;
    };

    if (gateway === 'jazzcash') {
      verification = verifyJazzCashResponse(
        {
          merchantId: process.env.JAZZCASH_MERCHANT_ID!,
          password: process.env.JAZZCASH_PASSWORD!,
          integritySalt: process.env.JAZZCASH_INTEGRETY_SALT!,
          returnUrl: request.url.split('?')[0],
          isSandbox: process.env.NODE_ENV !== 'production',
        },
        responseData
      );
    } else if (gateway === 'easypaisa') {
      verification = verifyEasyPaisaResponse(
        {
          storeId: process.env.EASYPAISA_STORE_ID!,
          hashKey: process.env.EASYPAISA_HASH_KEY!,
          returnUrl: request.url.split('?')[0],
          isSandbox: process.env.NODE_ENV !== 'production',
        },
        responseData
      );
    } else if (gateway === 'xpay') {
      verification = verifyXPayResponse(
        {
          merchantId: process.env.XPAY_MERCHANT_ID!,
          merchantKey: process.env.XPAY_MERCHANT_KEY!,
          returnUrl: request.url.split('?')[0],
          isSandbox: process.env.NODE_ENV !== 'production',
        },
        responseData
      );
    } else {
      return redirectWith('error=invalid_gateway');
    }

    if (!verification.valid || verification.status !== 'success') {
      return redirectWith('error=payment_failed');
    }

    const orderId = responseData.orderId || responseData.pp_TxnRefNo || verification.transactionId;
    if (!orderId) {
      return redirectWith('error=invalid_order');
    }

    const db = getDrizzle();
    const [paymentIntent] = await db
      .select()
      .from(payments)
      .where(
        or(
          eq(payments.id, orderId),
          eq(payments.transactionId, orderId),
          sql`${payments.metadata}->>'orderId' = ${orderId}`
        )
      )
      .limit(1);

    if (!paymentIntent) {
      return redirectWith('error=order_not_found');
    }

    if (paymentIntent.status === 'completed') {
      return redirectWith('success=true');
    }

    const metadata = (paymentIntent.metadata || {}) as Record<string, unknown>;
    const couponCode = (metadata.couponCode || metadata.coupon_code) as string | null;
    const couponId = (metadata.couponId || metadata.coupon_id) as string | null;
    const discountAmount = Number(metadata.discountAmount || metadata.discount_amount || 0);
    const userId = (metadata.userId || metadata.user_id) as string | undefined;
    const paidAmount = verification.amount ?? paymentIntent.amount;

    await db
      .update(payments)
      .set({
        status: 'completed',
        transactionId: verification.transactionId || paymentIntent.transactionId,
        amount: Math.round(paidAmount),
        metadata: {
          ...metadata,
          orderId,
          completedAt: new Date().toISOString(),
        },
        updatedAt: new Date(),
      })
      .where(eq(payments.id, paymentIntent.id));

    if (couponCode && couponId && discountAmount > 0 && userId) {
      await recordCouponUsage(couponId, paymentIntent.tenantId, userId, orderId, discountAmount);
    }

    await updateTenantSubscription(paymentIntent.tenantId, {
      plan: paymentIntent.plan,
      status: 'active',
      gateway: gateway as PaymentGateway,
      renewDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      amount: paidAmount,
      currency: 'PKR',
    });

    return redirectWith('success=true');
  } catch (error) {
    console.error('Payment callback error:', error);
    return redirectWith('error=processing_error');
  }
}
