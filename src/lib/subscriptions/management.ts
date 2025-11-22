// Subscription Management Utilities
import { adminDb } from "@/lib/firebase/admin";
import { SUBSCRIPTION_PLANS } from "@/lib/constants";
import type { TenantSubscription, SubscriptionPlan } from "@/types";

export interface SubscriptionUpdate {
  plan: SubscriptionPlan;
  status: "active" | "trial" | "expired" | "cancelled" | "past_due";
  gateway?: string;
  renewDate: Date;
  amount: number;
  currency: "PKR";
  token?: string;
  trialEndsAt?: Date;
}

/**
 * Update tenant subscription
 */
export async function updateTenantSubscription(
  tenantId: string,
  update: SubscriptionUpdate
): Promise<void> {
  if (!adminDb) {
    throw new Error("Firebase Admin not initialized");
  }

  const subscriptionRef = adminDb
    .collection("tenants")
    .doc(tenantId)
    .collection("subscription")
    .doc("main");

  await subscriptionRef.set(update, { merge: true });

  // Update limits based on plan
  const planDetails = SUBSCRIPTION_PLANS[update.plan];
  const limitsRef = adminDb
    .collection("tenants")
    .doc(tenantId)
    .collection("limits")
    .doc("main");

  await limitsRef.set(
    {
      maxAnimals: planDetails.maxAnimals,
      maxUsers: planDetails.maxUsers,
      features: planDetails.features,
    },
    { merge: true }
  );
}

/**
 * Cancel subscription
 */
export async function cancelSubscription(tenantId: string): Promise<void> {
  if (!adminDb) {
    throw new Error("Firebase Admin not initialized");
  }

  const subscriptionRef = adminDb
    .collection("tenants")
    .doc(tenantId)
    .collection("subscription")
    .doc("main");

  await subscriptionRef.update({
    status: "cancelled",
    updatedAt: new Date(),
  });
}

/**
 * Downgrade to free tier
 */
export async function downgradeToFree(tenantId: string): Promise<void> {
  await updateTenantSubscription(tenantId, {
    plan: "free",
    status: "active",
    gateway: "bank_transfer",
    renewDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year
    amount: 0,
    currency: "PKR",
  });
}

