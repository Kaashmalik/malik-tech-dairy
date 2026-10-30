// API Route: Payment Gateway Callbacks (Postgres payment intents — no Firebase)
import { NextRequest, NextResponse } from 'next/server';
import { verifyJazzCashResponse } from '@/lib/payments/jazzcash-server';
import { verifyEasyPaisaResponse } from '@/lib/payments/easypaisa-server';
import { verifyXPayResponse } from '@/lib/payments/xpay-server';
import { updateTenantSubscription, type SubscriptionUpdate } from '@/lib/subscriptions/management';
import { recordCouponUsage } from '@/lib/coupons/validation';
import { db, tenantDb, unwrap } from '@/lib/supabase/tenant-db';
import { logger } from '@/lib/logger';

const ORDER_ID_PATTERN = /^[A-Za-z0-9_-]{1,100}$/;

interface PaymentRow {
  id: string;
  tenant_id: string;
  status: string;
  plan: string;
  amount: number;
  transaction_id: string | null;
  metadata: Record<string, unknown> | null;
}
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
    // orderId comes from the gateway response; validate before using it in a filter
    if (!orderId || !ORDER_ID_PATTERN.test(String(orderId))) {
      return redirectWith('error=invalid_order');
    }

    // Callback has no session: look the intent up globally, then act within its tenant
    const [paymentIntent] = unwrap(
      await db()
        .from('payments')
        .select('id, tenant_id, status, plan, amount, transaction_id, metadata')
        .or(`id.eq.${orderId},transaction_id.eq.${orderId},metadata->>orderId.eq.${orderId}`)
        .limit(1),
      'Load payment intent'
    ) as PaymentRow[];

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

    // Never activate a plan for less than the amount the intent was created for
    if (Math.round(paidAmount) < Math.round(paymentIntent.amount)) {
      logger.error('Payment amount below intent amount', undefined, {
        orderId,
        paidAmount,
        expected: paymentIntent.amount,
      });
      return redirectWith('error=amount_mismatch');
    }

    const tenantId = paymentIntent.tenant_id;
    unwrap(
      await tenantDb(tenantId)
        .update('payments', {
          status: 'completed',
          transaction_id: verification.transactionId || paymentIntent.transaction_id,
          amount: Math.round(paidAmount),
          metadata: {
            ...metadata,
            orderId,
            completedAt: new Date().toISOString(),
          },
          updated_at: new Date().toISOString(),
        })
        .eq('id', paymentIntent.id),
      'Complete payment'
    );

    if (couponCode && couponId && discountAmount > 0 && userId) {
      await recordCouponUsage(couponId, tenantId, userId, orderId, discountAmount);
    }

    await updateTenantSubscription(tenantId, {
      plan: paymentIntent.plan as SubscriptionUpdate['plan'],
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
