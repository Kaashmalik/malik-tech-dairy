// Admin API: Verify Bank Transfer Payment
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { verifyBankTransferPayment } from "@/lib/payments/bank-transfer";
import { updateTenantSubscription } from "@/lib/subscriptions/management";
import { z } from "zod";

export const dynamic = "force-dynamic";

const verifySchema = z.object({
  paymentId: z.string(),
  tenantId: z.string(),
  method: z.enum(["manual", "ocr"]).default("manual"),
  transactionId: z.string().optional(),
});

// POST: Verify bank transfer payment
export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // TODO: Check if user is admin/super-admin
    // For now, allow any authenticated user (restrict in production)

    const body = await request.json();
    const validated = verifySchema.parse(body);

    // Verify payment
    await verifyBankTransferPayment(
      validated.paymentId,
      validated.tenantId,
      userId,
      validated.method,
      validated.transactionId
    );

    // Get payment details to update subscription
    // This would typically fetch from database
    // For now, we'll need to pass plan/amount in the request

    return NextResponse.json({
      success: true,
      message: "Payment verified successfully",
    });
  } catch (error: any) {
    console.error("Error verifying bank transfer:", error);
    if (error.name === "ZodError") {
      return NextResponse.json(
        { error: "Validation failed", details: error.errors },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}

