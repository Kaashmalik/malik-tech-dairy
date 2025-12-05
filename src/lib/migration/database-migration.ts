// Database Migration Plan: Firebase to Supabase
// This file outlines the complete migration strategy

import { getSupabaseClient } from '@/lib/supabase';
import { adminDb } from '@/lib/firebase/admin';

interface MigrationPlan {
  collection: string;
  supabaseTable: string;
  transform: (firebaseDoc: any) => any;
  batchSize: number;
}

const MIGRATION_PLANS: MigrationPlan[] = [
  {
    collection: 'milkLogs',
    supabaseTable: 'milk_logs',
    batchSize: 100,
    transform: (doc) => ({
      id: doc.id,
      tenant_id: doc.tenantId,
      animal_id: doc.animalId,
      date: doc.date,
      session: doc.session,
      yield: doc.yield,
      quality: doc.quality || null,
      notes: doc.notes || null,
      created_at: doc.createdAt || new Date().toISOString(),
      updated_at: doc.updatedAt || new Date().toISOString(),
    }),
  },
  {
    collection: 'healthRecords',
    supabaseTable: 'health_records',
    batchSize: 100,
    transform: (doc) => ({
      id: doc.id,
      tenant_id: doc.tenantId,
      animal_id: doc.animalId,
      date: doc.date,
      type: doc.type,
      diagnosis: doc.diagnosis || null,
      treatment: doc.treatment || null,
      veterinarian: doc.veterinarian || null,
      cost: doc.cost || null,
      notes: doc.notes || null,
      created_at: doc.createdAt || new Date().toISOString(),
      updated_at: doc.updatedAt || new Date().toISOString(),
    }),
  },
];

export class DatabaseMigrator {
  private supabase = getSupabaseClient();

  async migrateCollection(plan: MigrationPlan): Promise<void> {
    console.log(`Starting migration: ${plan.collection} -> ${plan.supabaseTable}`);
    
    let lastDoc: any = null;
    let totalMigrated = 0;
    
    while (true) {
      // Get batch from Firebase
      let query = adminDb
        .collection('tenants')
        .doc('global')
        .collection(plan.collection)
        .orderBy('createdAt')
        .limit(plan.batchSize);
      
      if (lastDoc) {
        query = query.startAfter(lastDoc);
      }
      
      const snapshot = await query.get();
      
      if (snapshot.empty) {
        break;
      }
      
      // Transform and insert into Supabase
      const records = snapshot.docs.map(doc => plan.transform({
        id: doc.id,
        ...doc.data(),
      }));
      
      const { error } = await this.supabase
        .from(plan.supabaseTable)
        .upsert(records, { onConflict: 'id' });
      
      if (error) {
        console.error(`Migration error for batch:`, error);
        throw error;
      }
      
      totalMigrated += records.length;
      lastDoc = snapshot.docs[snapshot.docs.length - 1];
      
      console.log(`Migrated ${totalMigrated} records for ${plan.collection}`);
    }
    
    console.log(`Completed migration: ${plan.collection}. Total: ${totalMigrated}`);
  }

  async migrateAll(): Promise<void> {
    console.log('Starting complete database migration from Firebase to Supabase');
    
    for (const plan of MIGRATION_PLANS) {
      try {
        await this.migrateCollection(plan);
      } catch (error) {
        console.error(`Failed to migrate ${plan.collection}:`, error);
        throw error;
      }
    }
    
    console.log('Database migration completed successfully');
  }

  async verifyMigration(): Promise<void> {
    console.log('Verifying migration integrity...');
    
    for (const plan of MIGRATION_PLANS) {
      // Count Firebase documents
      const firebaseCount = await adminDb
        .collection('tenants')
        .doc('global')
        .collection(plan.collection)
        .count()
        .get();
      
      // Count Supabase rows
      const { count: supabaseCount } = await this.supabase
        .from(plan.supabaseTable)
        .select('*', { count: 'exact', head: true });
      
      console.log(`${plan.collection}: Firebase=${firebaseCount.data().count}, Supabase=${supabaseCount}`);
      
      if (firebaseCount.data().count !== supabaseCount) {
        throw new Error(`Migration verification failed for ${plan.collection}`);
      }
    }
    
    console.log('Migration verification completed successfully');
  }
}

// Usage:
// const migrator = new DatabaseMigrator();
// await migrator.migrateAll();
// await migrator.verifyMigration();
