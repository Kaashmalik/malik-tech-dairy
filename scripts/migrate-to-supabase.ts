#!/usr/bin/env tsx
/**
 * Migration Script: Firestore → Supabase
 *
 * One-time migration of tenant metadata from Firestore to Supabase
 *
 * Usage:
 *   npx tsx scripts/migrate-to-supabase.ts [--dry-run] [--tenant-id=<id>]
 *
 * Options:
 *   --dry-run: Preview changes without writing to Supabase
 *   --tenant-id: Migrate specific tenant only
 */
import { adminDb } from '../src/lib/firebase/admin';
import { getDrizzle } from '../src/lib/supabase';
import {
  tenants,
  subscriptions,
  payments,
  apiKeys,
  auditLogs,
  customFieldsConfig,
} from '../src/db/schema';
import { eq } from 'drizzle-orm';
interface MigrationStats {
  tenants: number;
  subscriptions: number;
  payments: number;
  apiKeys: number;
  auditLogs: number;
  customFields: number;
  errors: string[];
}
async function migrateTenant(tenantId: string, dryRun: boolean = false): Promise<MigrationStats> {
  const stats: MigrationStats = {
    tenants: 0,
    subscriptions: 0,
    payments: 0,
    apiKeys: 0,
    auditLogs: 0,
    customFields: 0,
    errors: [],
  };
  if (!adminDb) {
    throw new Error('Firebase Admin not initialized');
  }
  const db = getDrizzle();
  try {
    // 1. Migrate Tenant Config
    const tenantDoc = await adminDb.collection('tenants').doc(tenantId).get();
    if (!tenantDoc.exists) {
      stats.errors.push(`Tenant ${tenantId} not found in Firestore`);
      return stats;
    }
    const configDoc = await adminDb
      .collection('tenants')
      .doc(tenantId)
      .collection('config')
      .doc('main')
      .get();
    if (configDoc.exists) {
      const configData = configDoc.data();
      const tenantData = {
        id: tenantId,
        slug: configData?.subdomain || tenantId.slice(0, 8),
        farmName: configData?.farmName || 'Unnamed Farm',
        logoUrl: configData?.logoUrl || null,
        primaryColor: configData?.primaryColor || '#1F7A3D',
        accentColor: configData?.accentColor || '#F59E0B',
        language: configData?.language || 'en',
        currency: configData?.currency || 'PKR',
        timezone: configData?.timezone || 'Asia/Karachi',
        animalTypes: configData?.animalTypes || ['cow', 'buffalo', 'chicken'],
        createdAt: configData?.createdAt?.toDate() || new Date(),
        updatedAt: configData?.updatedAt?.toDate() || new Date(),
        deletedAt: configData?.deletedAt?.toDate() || null,
      };
      if (!dryRun) {
        await db
          .insert(tenants)
          .values(tenantData)
          .onConflictDoUpdate({
            target: tenants.id,
            set: {
              farmName: tenantData.farmName,
              logoUrl: tenantData.logoUrl,
              primaryColor: tenantData.primaryColor,
              accentColor: tenantData.accentColor,
              language: tenantData.language,
              currency: tenantData.currency,
              timezone: tenantData.timezone,
              animalTypes: tenantData.animalTypes,
              updatedAt: new Date(),
            },
          });
      }
      stats.tenants++;
    }
    // 2. Migrate Subscription
    const subDoc = await adminDb
      .collection('tenants')
      .doc(tenantId)
      .collection('subscription')
      .doc('main')
      .get();
    if (subDoc.exists) {
      const subData = subDoc.data();
      const subscriptionData = {
        id: `${tenantId}_subscription`,
        tenantId,
        plan: subData?.plan || 'free',
        status: subData?.status || 'trial',
        gateway: subData?.gateway || 'bank_transfer',
        renewDate: subData?.renewDate?.toDate() || new Date(),
        token: subData?.token || null,
        amount: subData?.amount || 0,
        currency: subData?.currency || 'PKR',
        trialEndsAt: subData?.trialEndsAt?.toDate() || null,
        createdAt: subData?.createdAt?.toDate() || new Date(),
        updatedAt: subData?.updatedAt?.toDate() || new Date(),
      };
      if (!dryRun) {
        await db
          .insert(subscriptions)
          .values(subscriptionData)
          .onConflictDoUpdate({
            target: subscriptions.id,
            set: {
              plan: subscriptionData.plan,
              status: subscriptionData.status,
              gateway: subscriptionData.gateway,
              renewDate: subscriptionData.renewDate,
              token: subscriptionData.token,
              amount: subscriptionData.amount,
              trialEndsAt: subscriptionData.trialEndsAt,
              updatedAt: new Date(),
            },
          });
      }
      stats.subscriptions++;
    }
    // 3. Migrate Payments
    const paymentsSnapshot = await adminDb
      .collection('payments')
      .where('tenantId', '==', tenantId)
      .get();
    if (!dryRun && !paymentsSnapshot.empty) {
      const paymentsData = paymentsSnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          tenantId,
          amount: data.amount || 0,
          currency: data.currency || 'PKR',
          gateway: data.gateway || 'bank_transfer',
          status: data.status || 'pending',
          transactionId: data.transactionId || null,
          plan: data.plan || 'free',
          metadata: data.metadata || {},
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate() || new Date(),
        };
      });
      await db.insert(payments).values(paymentsData).onConflictDoNothing();
      stats.payments += paymentsData.length;
    } else if (paymentsSnapshot.empty) {
    }
    // 4. Migrate API Keys
    const apiKeysSnapshot = await adminDb
      .collection('tenants')
      .doc(tenantId)
      .collection('api_keys')
      .get();
    if (!dryRun && !apiKeysSnapshot.empty) {
      const apiKeysData = apiKeysSnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          tenantId,
          name: data.name,
          description: data.description || null,
          keyHash: data.keyHash,
          keyPrefix: data.keyPrefix,
          permissions: data.permissions || [],
          isActive: data.isActive !== false,
          lastUsedAt: data.lastUsedAt?.toDate() || null,
          expiresAt: data.expiresAt?.toDate() || null,
          createdAt: data.createdAt?.toDate() || new Date(),
          createdBy: data.createdBy,
        };
      });
      await db.insert(apiKeys).values(apiKeysData).onConflictDoNothing();
      stats.apiKeys += apiKeysData.length;
    }
    // 5. Migrate Custom Fields Config
    const customFieldsDoc = await adminDb
      .collection('tenants')
      .doc(tenantId)
      .collection('config')
      .doc('customFields')
      .get();
    if (customFieldsDoc.exists) {
      const fieldsData = customFieldsDoc.data();
      const customFieldsData = {
        id: `${tenantId}_custom_fields`,
        tenantId,
        fields: fieldsData?.fields || [],
        updatedAt: fieldsData?.updatedAt?.toDate() || new Date(),
      };
      if (!dryRun) {
        await db
          .insert(customFieldsConfig)
          .values(customFieldsData)
          .onConflictDoUpdate({
            target: customFieldsConfig.tenantId,
            set: {
              fields: customFieldsData.fields,
              updatedAt: new Date(),
            },
          });
      }
      stats.customFields++;
    }
    // Note: Audit logs are typically not migrated (historical data)
    // They will start being written to Supabase after migration
    return stats;
  } catch (error: any) {
    stats.errors.push(`Error migrating ${tenantId}: ${error.message}`);
    return stats;
  }
}
async function main() {
  const args = process.argv.slice(2);
  const dryRun = args.includes('--dry-run');
  const tenantIdArg = args.find(arg => arg.startsWith('--tenant-id='));
  const specificTenantId = tenantIdArg?.split('=')[1];
  if (dryRun) {
  }
  if (!adminDb) {
    process.exit(1);
  }
  const totalStats: MigrationStats = {
    tenants: 0,
    subscriptions: 0,
    payments: 0,
    apiKeys: 0,
    auditLogs: 0,
    customFields: 0,
    errors: [],
  };
  try {
    if (specificTenantId) {
      // Migrate specific tenant
      const stats = await migrateTenant(specificTenantId, dryRun);
      Object.keys(totalStats).forEach(key => {
        if (key === 'errors') {
          totalStats.errors.push(...stats.errors);
        } else {
          (totalStats as any)[key] += (stats as any)[key];
        }
      });
    } else {
      // Migrate all tenants
      const tenantsSnapshot = await adminDb.collection('tenants').get();
      for (const doc of tenantsSnapshot.docs) {
        const stats = await migrateTenant(doc.id, dryRun);
        Object.keys(totalStats).forEach(key => {
          if (key === 'errors') {
            totalStats.errors.push(...stats.errors);
          } else {
            (totalStats as any)[key] += (stats as any)[key];
          }
        });
      }
    }
    // Print summary
    console.log('\n' + '='.repeat(50));
    console.log('='.repeat(50));
    if (totalStats.errors.length > 0) {
      totalStats.errors.forEach(error => console.log(`  - ${error}`));
    }
    if (dryRun) {
    } else {
    }
  } catch (error: any) {
    process.exit(1);
  }
}
main();