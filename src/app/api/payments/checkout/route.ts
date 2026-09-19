// API Route: Create Payment Checkout
import { NextRequest, NextResponse } from 'next/server';
import { withTenantContext } from '@/lib/api/middleware';
import { PaymentRegistry } from '@/lib/payments/provider-registry';
import { validateCoupon } from '@/lib/coupons/validation';
import { SUBSCRIPTION_PLANS } from '@/lib/constants';
import { getSupabaseClient } from '@/lib/supabase/server';
import type { PaymentGateway, SubscriptionPlan } from '@/types';
export const dynamic = 'force-dynamic';
export async function POST(request: NextRequest) {
  return withTenantContext(async (req, context) => {
    try {
      const body = await req.json();
      const { plan, gateway, couponCode, proofUrl } = body;
      // Validate plan
      if (!plan || !SUBSCRIPTION_PLANS[plan as SubscriptionPlan]) {
        return NextResponse.json({ error: 'Invalid subscription plan' }, { status: 400 });
      }
      // Validate gateway
      const validGateways: PaymentGateway[] = ['jazzcash', 'easypaisa', 'xpay', 'bank_transfer'];
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
      const returnUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/payments/callback/${gateway}`;

      const provider = PaymentRegistry.getProvider(gateway as any);
      const checkoutResult = await provider.createCheckout({
        tenantId: context.tenantId,
        userId: context.userId,
        plan: plan as SubscriptionPlan,
        amount,
        currency: 'PKR',
        description: `MTK Dairy - ${planDetails.name} Plan`,
        returnUrl,
      });

      const orderId = checkoutResult.orderId;
      const checkoutUrl = checkoutResult.checkoutUrl;
      // Store payment intent in database (for tracking)
      // Store payment intent in Supabase
      const supabase = getSupabaseClient();

      const { error: dbError } = await supabase.from('payments').insert({
        id: orderId,
        tenant_id: context.tenantId,
        amount,
        currency: 'PKR',
        gateway,
        status: ['bank_transfer', 'jazzcash', 'easypaisa', 'xpay'].includes(gateway)
          ? 'manual_verification'
          : 'pending',
        transaction_id: null,
        plan: plan as SubscriptionPlan,
        metadata: {
          original_amount: couponCalculation?.originalAmount || amount,
          discount_amount: couponCalculation?.discountAmount || 0,
          coupon_code: couponCode || null,
          coupon_id: couponCalculation?.coupon?.id || null,
          proof_url: proofUrl || null, // Store proof URL
        },
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });

      if (dbError) {
        console.error('Database error storing payment:', dbError);
        // Continue anyway as we returned the checkout URL, but log critical error
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
      console.error('Checkout error:', error);
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
  })(request);
}
