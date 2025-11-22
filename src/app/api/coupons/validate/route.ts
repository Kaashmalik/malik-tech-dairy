// API Route: Validate Coupon Code
import { NextRequest, NextResponse } from "next/server";
import { validateCoupon } from "@/lib/coupons/validation";
import type { SubscriptionPlan } from "@/types";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { code, plan, amount, tenantId, userId } = body;

    if (!code || !plan || !amount || !tenantId || !userId) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const result = await validateCoupon(
      code,
      plan as SubscriptionPlan,
      amount,
      tenantId,
      userId
    );

    if (!result.valid) {
      return NextResponse.json(
        { valid: false, error: result.error },
        { status: 200 }
      );
    }

    return NextResponse.json({
      valid: true,
      calculation: result.calculation,
    });
  } catch (error) {
    console.error("Error validating coupon:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

