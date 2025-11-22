// API Route: Payment Gateway Callbacks
import { NextRequest, NextResponse } from "next/server";
import { verifyJazzCashResponse } from "@/lib/payments/jazzcash-server";
import { verifyEasyPaisaResponse } from "@/lib/payments/easypaisa-server";
import { verifyXPayResponse } from "@/lib/payments/xpay-server";
import { adminDb } from "@/lib/firebase/admin";
import { updateTenantSubscription } from "@/lib/subscriptions/management";
import { recordCouponUsage } from "@/lib/coupons/validation";
import type { PaymentGateway } from "@/types";

export const dynamic = "force-dynamic";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ gateway: string }> }
) {
  try {
    const { gateway } = await params;
    const { searchParams } = new URL(request.url);

    // Get all query parameters
    const responseData: Record<string, string> = {};
    searchParams.forEach((value, key) => {
      responseData[key] = value;
    });

    // Verify payment based on gateway
    let verification: {
      valid: boolean;
      transactionId?: string;
      amount?: number;
      status?: string;
    };

    if (gateway === "jazzcash") {
      const config = {
        merchantId: process.env.JAZZCASH_MERCHANT_ID!,
        password: process.env.JAZZCASH_PASSWORD!,
        integritySalt: process.env.JAZZCASH_INTEGRETY_SALT!,
        returnUrl: request.url.split("?")[0],
        isSandbox: process.env.NODE_ENV !== "production",
      };
      verification = verifyJazzCashResponse(config, responseData);
    } else if (gateway === "easypaisa") {
      const config = {
        storeId: process.env.EASYPAISA_STORE_ID!,
        hashKey: process.env.EASYPAISA_HASH_KEY!,
        returnUrl: request.url.split("?")[0],
        isSandbox: process.env.NODE_ENV !== "production",
      };
      verification = verifyEasyPaisaResponse(config, responseData);
    } else if (gateway === "xpay") {
      const config = {
        merchantId: process.env.XPAY_MERCHANT_ID!,
        merchantKey: process.env.XPAY_MERCHANT_KEY!,
        returnUrl: request.url.split("?")[0],
        isSandbox: process.env.NODE_ENV !== "production",
      };
      verification = verifyXPayResponse(config, responseData);
    } else {
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/dashboard/subscription?error=invalid_gateway`
      );
    }

    if (!verification.valid || verification.status !== "success") {
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/dashboard/subscription?error=payment_failed`
      );
    }

    // Extract order ID from transaction ID or response
    const orderId = responseData.orderId || responseData.pp_TxnRefNo || verification.transactionId;
    
    if (!orderId || !adminDb) {
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/dashboard/subscription?error=invalid_order`
      );
    }

    // Find payment intent by order ID
    const paymentIntents = await adminDb
      .collection("payment_intents")
      .where("orderId", "==", orderId)
      .limit(1)
      .get();

    if (paymentIntents.empty) {
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/dashboard/subscription?error=order_not_found`
      );
    }

    const paymentIntent = paymentIntents.docs[0].data();
    const { tenantId, plan, userId, couponCode, discountAmount } = paymentIntent;

    // Record payment in Supabase
    const { getDrizzle } = await import("@/lib/supabase");
    const { payments } = await import("@/db/schema");
    const { nanoid } = await import("nanoid");
    const db = getDrizzle();
    
    await db.insert(payments).values({
      id: nanoid(),
      tenantId,
      amount: (verification.amount || paymentIntent.amount) * 100, // Convert to paise
      currency: "PKR",
      gateway: gateway as any,
      status: "completed",
      transactionId: verification.transactionId || null,
      plan: plan as any,
      metadata: { orderId, couponCode, discountAmount },
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    // Record coupon usage if applicable
    if (couponCode && discountAmount > 0) {
      await recordCouponUsage(
        paymentIntent.couponId,
        tenantId,
        userId,
        orderId,
        discountAmount
      );
    }

    // Update tenant subscription
    await updateTenantSubscription(tenantId, {
      plan,
      status: "active",
      gateway: gateway as PaymentGateway,
      renewDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
      amount: verification.amount || paymentIntent.amount,
      currency: "PKR",
    });

    // Mark payment intent as completed
    await adminDb
      .collection("payment_intents")
      .doc(paymentIntents.docs[0].id)
      .update({
        status: "completed",
        completedAt: new Date(),
      });

    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/dashboard/subscription?success=true`
    );
  } catch (error) {
    console.error("Error processing payment callback:", error);
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/dashboard/subscription?error=processing_error`
    );
  }
}

