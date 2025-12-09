// API Route: Create Payment Checkout
import { NextRequest, NextResponse } from 'next/server';
import { withTenantContext } from '@/lib/api/middleware';
import { createJazzCashCheckout } from '@/lib/payments/jazzcash-server';
import { createEasyPaisaCheckout } from '@/lib/payments/easypaisa-server';
import { createXPayCheckout } from '@/lib/payments/xpay-server';
import { validateCoupon } from '@/lib/coupons/validation';
import { SUBSCRIPTION_PLANS } from '@/lib/constants';
import { adminDb } from '@/lib/firebase/admin';
import type { PaymentGateway, SubscriptionPlan } from '@/types';
import { v4 as uuidv4 } from 'uuid';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  return withTenantContext(async (req, context) => {
    try {
      const body = await req.json();
      const { plan, gateway, couponCode } = body;

      // Validate plan
      if (!plan || !SUBSCRIPTION_PLANS[plan as SubscriptionPlan]) {
        return NextResponse.json({ error: 'Invalid subscription plan' }, { status: 400 });
      }

      // Validate gateway
      const validGateways: PaymentGateway[] = ['jazzcash', 'easypaisa', 'xpay'];
      if (!gateway || !validGateways.includes(gateway)) {
        return NextResponse.json({ error: 'Invalid payment gateway' }, { status: 400 });
      }

      const planDetails = SUBSCRIPTION_PLANS[plan as SubscriptionPlan];
      let amount: number = planDetails.price;

      // Validate coupon if provided
      let couponCalculation = null;
      if (couponCode) {
        const couponResult = await validateCoupon(
          couponCode,
          plan as SubscriptionPlan,
          amount,
          context.tenantId,
          context.userId
        );

        if (!couponResult.valid) {
          return NextResponse.json(
            { error: couponResult.error || 'Invalid coupon' },
            { status: 400 }
          );
        }

        if (couponResult.calculation) {
          couponCalculation = couponResult.calculation;
          amount = couponCalculation.finalAmount;
        }
      }

      // Generate order ID
      const orderId = `ORD-${context.tenantId}-${Date.now()}-${uuidv4().slice(0, 8)}`;

      // Create checkout based on gateway
      let checkoutUrl: string;

      const paymentRequest = {
        amount,
        orderId,
        description: `MTK Dairy - ${planDetails.name} Plan`,
        customerEmail: context.userId, // Will be replaced with actual email
        customerPhone: '', // Will be replaced with actual phone
      };

      const returnUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/payments/callback/${gateway}`;

      if (gateway === 'jazzcash') {
        const config = {
          merchantId: process.env.JAZZCASH_MERCHANT_ID!,
          password: process.env.JAZZCASH_PASSWORD!,
          integritySalt: process.env.JAZZCASH_INTEGRETY_SALT!,
          returnUrl,
          isSandbox: process.env.NODE_ENV !== 'production',
        };

        const result = createJazzCashCheckout(config, paymentRequest);
        checkoutUrl = result.checkoutUrl;
      } else if (gateway === 'easypaisa') {
        const config = {
          storeId: process.env.EASYPAISA_STORE_ID!,
          hashKey: process.env.EASYPAISA_HASH_KEY!,
          returnUrl,
          isSandbox: process.env.NODE_ENV !== 'production',
        };

        const result = createEasyPaisaCheckout(config, paymentRequest);
        checkoutUrl = result.checkoutUrl;
      } else if (gateway === 'xpay') {
        const config = {
          merchantId: process.env.XPAY_MERCHANT_ID!,
          merchantKey: process.env.XPAY_MERCHANT_KEY!,
          returnUrl,
          isSandbox: process.env.NODE_ENV !== 'production',
        };

        const result = createXPayCheckout(config, paymentRequest);
        checkoutUrl = result.checkoutUrl;
      } else {
        return NextResponse.json({ error: 'Unsupported payment gateway' }, { status: 400 });
      }

      // Store payment intent in database (for tracking)
      if (adminDb) {
        await adminDb.collection('payment_intents').add({
          tenantId: context.tenantId,
          userId: context.userId,
          orderId,
          plan,
          amount,
          originalAmount: couponCalculation?.originalAmount || amount,
          discountAmount: couponCalculation?.discountAmount || 0,
          couponCode: couponCode || null,
          couponId: couponCalculation?.coupon?.id || null,
          status: 'pending',
          createdAt: new Date(),
        });
      }

      return NextResponse.json({
        success: true,
        checkoutUrl,
        orderId,
        amount,
        originalAmount: couponCalculation?.originalAmount || amount,
        discountAmount: couponCalculation?.discountAmount || 0,
        couponCode: couponCode || null,
      });
    } catch (error) {
      console.error('Error creating checkout:', error);
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
  })(request);
}
