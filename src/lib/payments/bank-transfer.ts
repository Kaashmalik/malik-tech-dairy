// Bank Transfer Payment Method for Enterprise Customers
// Generates payment reference codes and handles manual verification
import crypto from "crypto";
import { adminDb } from "@/lib/firebase/admin";
import type { SubscriptionPlan } from "@/types";

export interface BankTransferPayment {
  id: string;
  tenantId: string;
  userId: string;
  plan: SubscriptionPlan;
  amount: number;
  referenceCode: string;
  bankName?: string;
  accountNumber?: string;
  transactionId?: string;
  status: "pending" | "verified" | "rejected";
  verificationMethod?: "manual" | "ocr";
  verifiedBy?: string;
  verifiedAt?: Date;
  createdAt: Date;
  expiresAt: Date;
}

/**
 * Generate unique payment reference code
 * Format: MT-{YYYYMMDD}-{8char-random}
 */
export function generatePaymentReference(tenantId: string): string {
  const date = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  const random = crypto.randomBytes(4).toString("hex").toUpperCase();
  const tenantPrefix = tenantId.slice(0, 4).toUpperCase();
  return `MT-${date}-${tenantPrefix}-${random}`;
}

/**
 * Create bank transfer payment request
 */
export async function createBankTransferPayment(
  tenantId: string,
  userId: string,
  plan: SubscriptionPlan,
  amount: number,
  bankName?: string,
  accountNumber?: string
): Promise<BankTransferPayment> {
  if (!adminDb) {
    throw new Error("Database not initialized");
  }

  const referenceCode = generatePaymentReference(tenantId);
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

  const paymentData: Omit<BankTransferPayment, "id"> = {
    tenantId,
    userId,
    plan,
    amount,
    referenceCode,
    bankName: bankName || "Any Bank",
    accountNumber: accountNumber || undefined,
    status: "pending",
    createdAt: new Date(),
    expiresAt,
  };

  const docRef = await adminDb
    .collection("tenants")
    .doc(tenantId)
    .collection("bank_transfers")
    .add(paymentData);

  return {
    id: docRef.id,
    ...paymentData,
  };
}

/**
 * Verify bank transfer payment (manual or OCR)
 */
export async function verifyBankTransferPayment(
  paymentId: string,
  tenantId: string,
  verifiedBy: string,
  method: "manual" | "ocr" = "manual",
  transactionId?: string
): Promise<void> {
  if (!adminDb) {
    throw new Error("Database not initialized");
  }

  const paymentRef = adminDb
    .collection("tenants")
    .doc(tenantId)
    .collection("bank_transfers")
    .doc(paymentId);

  const paymentDoc = await paymentRef.get();
  if (!paymentDoc.exists) {
    throw new Error("Payment not found");
  }

  const payment = paymentDoc.data() as BankTransferPayment;
  if (payment.status !== "pending") {
    throw new Error("Payment already processed");
  }

  await paymentRef.update({
    status: "verified",
    verificationMethod: method,
    verifiedBy,
    verifiedAt: new Date(),
    transactionId: transactionId || payment.transactionId,
  });
}

/**
 * Get bank transfer payment by reference code
 */
export async function getBankTransferByReference(
  referenceCode: string
): Promise<BankTransferPayment | null> {
  if (!adminDb) {
    throw new Error("Database not initialized");
  }

  const snapshot = await adminDb
    .collectionGroup("bank_transfers")
    .where("referenceCode", "==", referenceCode)
    .where("status", "==", "pending")
    .limit(1)
    .get();

  if (snapshot.empty) {
    return null;
  }

  const doc = snapshot.docs[0];
  return {
    id: doc.id,
    ...doc.data(),
    createdAt: doc.data().createdAt?.toDate(),
    expiresAt: doc.data().expiresAt?.toDate(),
    verifiedAt: doc.data().verifiedAt?.toDate(),
  } as BankTransferPayment;
}

/**
 * Get bank account details for display
 */
export function getBankAccountDetails() {
  return {
    accountName: process.env.BANK_ACCOUNT_NAME || "MTK Dairy Pvt Ltd",
    accountNumber: process.env.BANK_ACCOUNT_NUMBER || "1234567890123",
    bankName: process.env.BANK_NAME || "Bank Alfalah",
    iban: process.env.BANK_IBAN || "PK12ALFH1234567890123456",
    branch: process.env.BANK_BRANCH || "Main Branch, Lahore",
  };
}

