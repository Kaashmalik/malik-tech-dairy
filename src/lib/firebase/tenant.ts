// Firestore Helpers for Tenant-Isolated Data Access
// Enhanced with Redis caching for all Firestore reads
import { adminDb } from "./admin";
import { withCache, cacheKeys, invalidateTenantCache } from "@/lib/redis/cache";
import type {
  TenantConfig,
  TenantSubscription,
  TenantLimits,
  Animal,
  MilkLog,
  EggLog,
} from "@/types";

/**
 * Get tenant config from Firestore (with Redis cache)
 */
export async function getTenantConfig(tenantId: string): Promise<TenantConfig | null> {
  if (!adminDb) {
    return null;
  }

  return withCache(
    cacheKeys.tenantConfig(tenantId),
    async () => {
      try {
        const configDoc = await adminDb
          .collection("tenants")
          .doc(tenantId)
          .collection("config")
          .doc("main")
          .get();

        if (!configDoc.exists) {
          return null;
        }

        const data = configDoc.data();
        return {
          ...data,
          createdAt: data?.createdAt?.toDate() || new Date(),
          updatedAt: data?.updatedAt?.toDate() || new Date(),
        } as TenantConfig;
      } catch (error) {
        console.error("Error fetching tenant config:", error);
        return null;
      }
    },
    300 // 5 minutes cache
  );
}

/**
 * Create or update tenant config (invalidates cache)
 */
export async function setTenantConfig(
  tenantId: string,
  config: Partial<TenantConfig>
): Promise<void> {
  if (!adminDb) {
    throw new Error("Firebase Admin not initialized");
  }

  try {
    await adminDb
      .collection("tenants")
      .doc(tenantId)
      .collection("config")
      .doc("main")
      .set(
        {
          ...config,
          updatedAt: new Date(),
        },
        { merge: true }
      );
    
    // Invalidate cache
    await invalidateTenantCache(tenantId);
  } catch (error) {
    console.error("Error setting tenant config:", error);
    throw error;
  }
}

/**
 * Get tenant subscription (with Redis cache)
 */
export async function getTenantSubscription(
  tenantId: string
): Promise<TenantSubscription | null> {
  if (!adminDb) {
    return null;
  }

  return withCache(
    cacheKeys.tenantSubscription(tenantId),
    async () => {
      try {
        const subDoc = await adminDb
          .collection("tenants")
          .doc(tenantId)
          .collection("subscription")
          .doc("main")
          .get();

        if (!subDoc.exists) {
          return null;
        }

        const data = subDoc.data();
        return {
          ...data,
          renewDate: data?.renewDate?.toDate() || new Date(),
          trialEndsAt: data?.trialEndsAt?.toDate(),
        } as TenantSubscription;
      } catch (error) {
        console.error("Error fetching tenant subscription:", error);
        return null;
      }
    },
    300 // 5 minutes cache
  );
}

/**
 * Get tenant limits (with Redis cache)
 */
export async function getTenantLimits(tenantId: string): Promise<TenantLimits | null> {
  if (!adminDb) {
    return null;
  }

  return withCache(
    cacheKeys.tenantLimits(tenantId),
    async () => {
      try {
        const limitsDoc = await adminDb
          .collection("tenants")
          .doc(tenantId)
          .collection("limits")
          .doc("main")
          .get();

        if (!limitsDoc.exists) {
          return null;
        }

        return limitsDoc.data() as TenantLimits;
      } catch (error) {
        console.error("Error fetching tenant limits:", error);
        return null;
      }
    },
    300 // 5 minutes cache
  );
}

/**
 * Initialize tenant in Firestore (called when organization is created)
 */
export async function initializeTenant(
  tenantId: string,
  tenantSlug: string,
  ownerId: string,
  ownerEmail: string
): Promise<void> {
  if (!adminDb) {
    throw new Error("Firebase Admin not initialized");
  }

  const batch = adminDb.batch();

  // Create tenant config
  const configRef = adminDb
    .collection("tenants")
    .doc(tenantId)
    .collection("config")
    .doc("main");

  batch.set(configRef, {
    farmName: tenantSlug.charAt(0).toUpperCase() + tenantSlug.slice(1) + " Farm",
    subdomain: tenantSlug,
    primaryColor: "#1F7A3D",
    accentColor: "#F59E0B",
    language: "en",
    currency: "PKR",
    timezone: "Asia/Karachi",
    animalTypes: ["cow", "buffalo", "chicken"],
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  // Create default subscription (free tier)
  const subRef = adminDb
    .collection("tenants")
    .doc(tenantId)
    .collection("subscription")
    .doc("main");

  batch.set(subRef, {
    plan: "free",
    status: "trial",
    gateway: "bank_transfer",
    renewDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
    amount: 0,
    currency: "PKR",
    trialEndsAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14-day trial
  });

  // Create tenant limits (free tier)
  const limitsRef = adminDb
    .collection("tenants")
    .doc(tenantId)
    .collection("limits")
    .doc("main");

  batch.set(limitsRef, {
    maxAnimals: 30,
    maxUsers: 1,
    features: ["basic_reports", "mobile_app"],
  });

  // Create user document
  const userRef = adminDb.collection("users").doc(ownerId);
  batch.set(userRef, {
    email: ownerEmail,
    tenantId: tenantId,
    role: "owner",
    createdAt: new Date(),
    updatedAt: new Date(),
  }, { merge: true });

  await batch.commit();
}

/**
 * Get collection reference for tenant data
 * Collection naming: tenants_data/{tenantId}_{collectionName}
 */
export function getTenantCollection(tenantId: string, collectionName: string) {
  if (!adminDb) {
    throw new Error("Firebase Admin not initialized");
  }

  // Return collection reference for tenant-scoped data
  return adminDb.collection(`tenants_data`).doc(`${tenantId}_${collectionName}`);
}

/**
 * Get subcollection reference for tenant data
 * Example: tenants_data/{tenantId}_animals/animals/{animalId}
 */
export function getTenantSubcollection(
  tenantId: string,
  collectionName: string,
  subcollectionName: string
) {
  if (!adminDb) {
    throw new Error("Firebase Admin not initialized");
  }

  return adminDb
    .collection("tenants_data")
    .doc(`${tenantId}_${collectionName}`)
    .collection(subcollectionName);
}

