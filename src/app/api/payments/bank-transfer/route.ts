// API Route: Bank Transfer Payment
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { createBankTransferPayment, getBankAccountDetails } from "@/lib/payments/bank-transfer";
import { updateTenantSubscription } from "@/lib/subscriptions/management";
import { z } from "zod";

export const dynamic = "force-dynamic";

const bankTransferSchema = z.object({
  plan: z.enum(["free", "professional", "farm", "enterprise"]),
  amount: z.number().positive(),
  bankName: z.string().optional(),
  accountNumber: z.string().optional(),
});

// POST: Create bank transfer payment request
export async function POST(request: NextRequest) {
  try {
    const { userId, orgId } = await auth();

    if (!userId || !orgId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const validated = bankTransferSchema.parse(body);

    // Create bank transfer payment
    const payment = await createBankTransferPayment(
      orgId,
      userId,
      validated.plan,
      validated.amount,
      validated.bankName,
      validated.accountNumber
    );

    // Get bank account details
    const bankDetails = getBankAccountDetails();

    return NextResponse.json({
      success: true,
      payment: {
        id: payment.id,
        referenceCode: payment.referenceCode,
        amount: payment.amount,
        expiresAt: payment.expiresAt,
      },
      bankDetails,
      instructions: `Please transfer PKR ${payment.amount.toLocaleString()} to the account above and include reference code: ${payment.referenceCode} in the transfer description.`,
    });
  } catch (error: any) {
    console.error("Error creating bank transfer payment:", error);
    if (error.name === "ZodError") {
      return NextResponse.json(
        { error: "Validation failed", details: error.errors },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// GET: Get bank account details
export async function GET() {
  const bankDetails = getBankAccountDetails();
  return NextResponse.json({ bankDetails });
}

