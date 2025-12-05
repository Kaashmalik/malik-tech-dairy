// Dual-Write API Wrapper for Zero-Downtime Migration
// Writes to both Firebase and Supabase during transition period

import { getSupabaseClient } from '@/lib/supabase';
import { adminDb } from '@/lib/firebase/admin';
import { FeatureFlagManager, getFeatureFlagsForRequest } from '@/lib/feature-flags/manager';
import { MIGRATION_PHASES } from '@/lib/feature-flags/manager';

interface DualWriteResult {
  success: boolean;
  supabaseResult?: any;
  firebaseResult?: any;
  errors: string[];
  writeTargets: string[];
}

export class DualWriteAPI {
  private supabase = getSupabaseClient();
  private featureFlagManager = FeatureFlagManager.getInstance();

  // Enhanced Dual-Write with Exponential Backoff Retry Logic
  async createMilkRecordWithRetry(request: Request, data: any, maxRetries: number = 3): Promise<DualWriteResult> {
    let lastError: any = null;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const result = await this.createMilkRecord(request, data);
        
        if (result.success) {
          // Log successful operation
          await this.logOperation('milk_record_create', data, true, attempt);
          return result;
        } else if (attempt < maxRetries) {
          // Retry with exponential backoff
          const delay = Math.min(1000 * Math.pow(2, attempt - 1), 10000); // Max 10 seconds
          console.log(`🔄 Retry attempt ${attempt} for milk record creation in ${delay}ms`);
          await this.sleep(delay);
        } else {
          lastError = new Error('Max retries exceeded');
        }
      } catch (error) {
        lastError = error;
        if (attempt < maxRetries) {
          const delay = Math.min(1000 * Math.pow(2, attempt - 1), 10000);
          console.log(`🔄 Retry attempt ${attempt} for milk record creation in ${delay}ms`);
          await this.sleep(delay);
        }
      }
    }
    
    // Log failed operation
    await this.logOperation('milk_record_create', data, false, maxRetries, lastError?.message);
    
    return {
      success: false,
      errors: [lastError?.message || 'Max retries exceeded'],
      writeTargets: [],
    };
  }

  private async sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private async logOperation(
    operationType: string, 
    data: any, 
    success: boolean, 
    attempts: number, 
    errorMessage?: string
  ): Promise<void> {
    try {
      await this.supabase
        .from('migration_logs')
        .insert({
          operation_type: operationType,
          tenant_id: data.tenantId,
          user_id: data.userId,
          success,
          failure: !success,
          error_message: errorMessage,
          duration_ms: attempts * 1000, // Approximate duration
          metadata: {
            attempts,
            data: JSON.stringify(data),
          },
          created_at: new Date().toISOString(),
        });
    } catch (logError) {
      console.error('Failed to log operation:', logError);
    }
  }

  // Milk Records Dual Write with Proper Failure Handling
  async createMilkRecord(request: Request, data: any): Promise<DualWriteResult> {
    const flags = await getFeatureFlagsForRequest(request);
    const result: DualWriteResult = {
      success: true,
      errors: [],
      writeTargets: [],
    };

    let supabaseError: any = null;
    let firebaseError: any = null;

    try {
      // Write to Supabase if enabled
      if (flags.useSupabaseAPIs || flags.enableDualWrite) {
        try {
          const supabaseData = this.transformMilkRecordForSupabase(data);
          result.supabaseResult = await this.supabase
            .from('milk_logs')
            .insert(supabaseData as any)
            .select()
            .single();
          result.writeTargets.push('supabase');
        } catch (error) {
          supabaseError = error;
          result.errors.push(`Supabase write failed: ${error}`);
        }
      }

      // Write to Firebase if enabled
      if (flags.writeToFirebase || flags.enableDualWrite) {
        try {
          const firebaseData = this.transformMilkRecordForFirebase(data);
          const docRef = await adminDb
            .collection('tenants')
            .doc('global')
            .collection('milkLogs')
            .add(firebaseData);
          result.firebaseResult = { id: docRef.id };
          result.writeTargets.push('firebase');
        } catch (error) {
          firebaseError = error;
          result.errors.push(`Firebase write failed: ${error}`);
        }
      }

      // Handle dual-write consistency
      if (flags.enableDualWrite) {
        // In dual-write mode, both writes must succeed
        if (supabaseError || firebaseError) {
          result.success = false;
          result.errors.push('Dual-write consistency check failed: both writes must succeed');
          
          // Attempt rollback if one write succeeded
          await this.rollbackMilkRecord(result, data);
        }
      } else if (flags.useSupabaseAPIs) {
        // In Supabase-only mode, Supabase write must succeed
        if (supabaseError) {
          result.success = false;
        }
      } else {
        // In Firebase-only mode, Firebase write must succeed
        if (firebaseError) {
          result.success = false;
        }
      }

      return result;
    } catch (error) {
      result.success = false;
      result.errors.push(`Dual write failed: ${error}`);
      return result;
    }
  }

  // Health Records Dual Write with Proper Failure Handling
  async createHealthRecord(request: Request, data: any): Promise<DualWriteResult> {
    const flags = await getFeatureFlagsForRequest(request);
    const result: DualWriteResult = {
      success: true,
      errors: [],
      writeTargets: [],
    };

    let supabaseError: any = null;
    let firebaseError: any = null;

    try {
      // Write to Supabase if enabled
      if (flags.useSupabaseAPIs || flags.enableDualWrite) {
        try {
          const supabaseData = this.transformHealthRecordForSupabase(data);
          result.supabaseResult = await this.supabase
            .from('health_records')
            .insert(supabaseData as any)
            .select()
            .single();
          result.writeTargets.push('supabase');
        } catch (error) {
          supabaseError = error;
          result.errors.push(`Supabase write failed: ${error}`);
        }
      }

      // Write to Firebase if enabled
      if (flags.writeToFirebase || flags.enableDualWrite) {
        try {
          const firebaseData = this.transformHealthRecordForFirebase(data);
          const docRef = await adminDb
            .collection('tenants')
            .doc('global')
            .collection('healthRecords')
            .add(firebaseData);
          result.firebaseResult = { id: docRef.id };
          result.writeTargets.push('firebase');
        } catch (error) {
          firebaseError = error;
          result.errors.push(`Firebase write failed: ${error}`);
        }
      }

      // Handle dual-write consistency
      if (flags.enableDualWrite) {
        // In dual-write mode, both writes must succeed
        if (supabaseError || firebaseError) {
          result.success = false;
          result.errors.push('Dual-write consistency check failed: both writes must succeed');
          
          // Attempt rollback if one write succeeded
          await this.rollbackHealthRecord(result, data);
        }
      } else if (flags.useSupabaseAPIs) {
        // In Supabase-only mode, Supabase write must succeed
        if (supabaseError) {
          result.success = false;
        }
      } else {
        // In Firebase-only mode, Firebase write must succeed
        if (firebaseError) {
          result.success = false;
        }
      }

      return result;
    } catch (error) {
      result.success = false;
      result.errors.push(`Dual write failed: ${error}`);
      return result;
    }
  }

  // Read Operations with Source Selection
  async getMilkRecords(request: Request, query: any): Promise<any> {
    const flags = await getFeatureFlagsForRequest(request);

    // Read from Supabase if enabled, otherwise Firebase
    if (flags.readFromSupabase) {
      return this.getMilkRecordsFromSupabase(query);
    } else {
      return this.getMilkRecordsFromFirebase(query);
    }
  }

  async getHealthRecords(request: Request, query: any): Promise<any> {
    const flags = await getFeatureFlagsForRequest(request);

    // Read from Supabase if enabled, otherwise Firebase
    if (flags.readFromSupabase) {
      return this.getHealthRecordsFromSupabase(query);
    } else {
      return this.getHealthRecordsFromFirebase(query);
    }
  }

  // Data Transformation Methods
  private transformMilkRecordForSupabase(data: any): any {
    return {
      tenant_id: data.tenantId,
      animal_id: data.animalId,
      date: data.date,
      session: data.session,
      yield: data.yield,
      quality: data.quality || null,
      notes: data.notes || null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
  }

  private transformMilkRecordForFirebase(data: any): any {
    return {
      tenantId: data.tenantId,
      animalId: data.animalId,
      date: data.date,
      session: data.session,
      yield: data.yield,
      quality: data.quality || null,
      notes: data.notes || null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  }

  private transformHealthRecordForSupabase(data: any): any {
    return {
      tenant_id: data.tenantId,
      animal_id: data.animalId,
      date: data.date,
      type: data.type,
      diagnosis: data.diagnosis || null,
      treatment: data.treatment || null,
      veterinarian: data.veterinarian || null,
      cost: data.cost || null,
      notes: data.notes || null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
  }

  private transformHealthRecordForFirebase(data: any): any {
    return {
      tenantId: data.tenantId,
      animalId: data.animalId,
      date: data.date,
      type: data.type,
      diagnosis: data.diagnosis || null,
      treatment: data.treatment || null,
      veterinarian: data.veterinarian || null,
      cost: data.cost || null,
      notes: data.notes || null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  }

  // Read Implementation Methods
  private async getMilkRecordsFromSupabase(query: any): Promise<any> {
    let supabaseQuery = this.supabase
      .from('milk_logs')
      .select('*', { count: 'exact' })
      .eq('tenant_id', query.tenantId);

    if (query.animalId) {
      supabaseQuery = supabaseQuery.eq('animal_id', query.animalId);
    }

    if (query.date) {
      supabaseQuery = supabaseQuery.eq('date', query.date);
    }

    if (query.startDate && query.endDate) {
      supabaseQuery = supabaseQuery
        .gte('date', query.startDate)
        .lte('date', query.endDate);
    }

    return await supabaseQuery
      .order('date', { ascending: false })
      .range(query.offset || 0, (query.offset || 0) + (query.limit || 30) - 1);
  }

  private async getMilkRecordsFromFirebase(query: any): Promise<any> {
    const collectionRef = adminDb
      .collection('tenants')
      .doc('global')
      .collection('milkLogs');

    let firebaseQuery = collectionRef.where('tenantId', '==', query.tenantId);

    if (query.animalId) {
      firebaseQuery = firebaseQuery.where('animalId', '==', query.animalId);
    }

    if (query.date) {
      firebaseQuery = firebaseQuery.where('date', '==', query.date);
    }

    if (query.startDate && query.endDate) {
      firebaseQuery = firebaseQuery
        .where('date', '>=', query.startDate)
        .where('date', '<=', query.endDate);
    }

    return await firebaseQuery
      .orderBy('date', 'desc')
      .limit(query.limit || 30)
      .get();
  }

  private async getHealthRecordsFromSupabase(query: any): Promise<any> {
    let supabaseQuery = this.supabase
      .from('health_records')
      .select('*', { count: 'exact' })
      .eq('tenant_id', query.tenantId);

    if (query.animalId) {
      supabaseQuery = supabaseQuery.eq('animal_id', query.animalId);
    }

    if (query.type) {
      supabaseQuery = supabaseQuery.eq('type', query.type);
    }

    if (query.date) {
      supabaseQuery = supabaseQuery.eq('date', query.date);
    }

    return await supabaseQuery
      .order('date', { ascending: false })
      .range(query.offset || 0, (query.offset || 0) + (query.limit || 30) - 1);
  }

  private async getHealthRecordsFromFirebase(query: any): Promise<any> {
    const collectionRef = adminDb
      .collection('tenants')
      .doc('global')
      .collection('healthRecords');

    let firebaseQuery = collectionRef.where('tenantId', '==', query.tenantId);

    if (query.animalId) {
      firebaseQuery = firebaseQuery.where('animalId', '==', query.animalId);
    }

    if (query.type) {
      firebaseQuery = firebaseQuery.where('type', '==', query.type);
    }

    if (query.date) {
      firebaseQuery = firebaseQuery.where('date', '==', query.date);
    }

    return await firebaseQuery
      .orderBy('date', 'desc')
      .limit(query.limit || 30)
      .get();
  }

  // Migration Phase Management
  async setMigrationPhase(phase: keyof typeof MIGRATION_PHASES): Promise<void> {
    const flags = MIGRATION_PHASES[phase];
    
    for (const [key, value] of Object.entries(flags)) {
      await this.featureFlagManager.updateFlag(key.replace(/([A-Z])/g, '_$1').toLowerCase(), {
        enabled: value,
        rolloutPercentage: value ? 100 : 0,
      });
    }
  }

  async getMigrationStatus(): Promise<{
    phase: string;
    flags: any;
    dataIntegrity: {
      supabaseCount: number;
      firebaseCount: number;
      discrepancy: number;
    };
  }> {
    const flags = await this.featureFlagManager.getFeatureFlags();
    
    // Get data counts for integrity check
    const [supabaseCount, firebaseCount] = await Promise.all([
      this.supabase.from('milk_logs').select('*', { count: 'exact', head: true }),
      adminDb.collection('tenants').doc('global').collection('milkLogs').count().get(),
    ]);

    const discrepancy = Math.abs(
      (supabaseCount.count || 0) - firebaseCount.data().count
    );

    // Determine current phase
    let currentPhase = 'UNKNOWN';
    for (const [phaseName, phaseFlags] of Object.entries(MIGRATION_PHASES)) {
      if (JSON.stringify(flags) === JSON.stringify(phaseFlags)) {
        currentPhase = phaseName;
        break;
      }
    }

    return {
      phase: currentPhase,
      flags,
      dataIntegrity: {
        supabaseCount: supabaseCount.count || 0,
        firebaseCount: firebaseCount.data().count,
        discrepancy,
      },
    };
  }

  // Rollback Methods for Dual-Write Consistency
  private async rollbackMilkRecord(result: DualWriteResult, data: any): Promise<void> {
    console.log('🔄 Attempting rollback for milk record due to dual-write failure');
    
    try {
      // Rollback Supabase if it succeeded
      if (result.supabaseResult && result.supabaseResult.id) {
        await this.supabase
          .from('milk_logs')
          .delete()
          .eq('id', result.supabaseResult.id);
        console.log('✅ Rolled back Supabase milk record');
      }
    } catch (rollbackError) {
      console.error('❌ Failed to rollback Supabase milk record:', rollbackError);
    }

    try {
      // Rollback Firebase if it succeeded
      if (result.firebaseResult && result.firebaseResult.id) {
        await adminDb
          .collection('tenants')
          .doc('global')
          .collection('milkLogs')
          .doc(result.firebaseResult.id)
          .delete();
        console.log('✅ Rolled back Firebase milk record');
      }
    } catch (rollbackError) {
      console.error('❌ Failed to rollback Firebase milk record:', rollbackError);
    }
  }

  private async rollbackHealthRecord(result: DualWriteResult, data: any): Promise<void> {
    console.log('🔄 Attempting rollback for health record due to dual-write failure');
    
    try {
      // Rollback Supabase if it succeeded
      if (result.supabaseResult && result.supabaseResult.id) {
        await this.supabase
          .from('health_records')
          .delete()
          .eq('id', result.supabaseResult.id);
        console.log('✅ Rolled back Supabase health record');
      }
    } catch (rollbackError) {
      console.error('❌ Failed to rollback Supabase health record:', rollbackError);
    }

    try {
      // Rollback Firebase if it succeeded
      if (result.firebaseResult && result.firebaseResult.id) {
        await adminDb
          .collection('tenants')
          .doc('global')
          .collection('healthRecords')
          .doc(result.firebaseResult.id)
          .delete();
        console.log('✅ Rolled back Firebase health record');
      }
    } catch (rollbackError) {
      console.error('❌ Failed to rollback Firebase health record:', rollbackError);
    }
  }

  // Data Reconciliation System
  async performDataReconciliation(): Promise<{
    discrepancies: Array<{
      tenantId: string;
      table: string;
      supabaseCount: number;
      firebaseCount: number;
      difference: number;
    }>;
    totalDiscrepancies: number;
    reconciliationStatus: 'PASSED' | 'FAILED' | 'WARNING';
  }> {
    console.log('🔍 Starting data reconciliation between Firebase and Supabase');
    
    const discrepancies = [];
    const tables = [
      { name: 'milk_logs', firebaseCollection: 'milkLogs' },
      { name: 'health_records', firebaseCollection: 'healthRecords' },
      { name: 'breeding_records', firebaseCollection: 'breedingRecords' },
      { name: 'expenses', firebaseCollection: 'expenses' },
      { name: 'sales', firebaseCollection: 'sales' },
    ];

    for (const table of tables) {
      try {
        // Get all tenant IDs from Supabase
        const { data: tenants } = await this.supabase
          .from('tenants')
          .select('id');

        if (!tenants) continue;

        for (const tenant of tenants) {
          const tenantId = tenant.id;
          
          // Count records in Supabase
          const { count: supabaseCount } = await this.supabase
            .from(table.name)
            .select('*', { count: 'exact', head: true })
            .eq('tenant_id', tenantId);

          // Count records in Firebase
          const firebaseSnapshot = await adminDb
            .collection('tenants')
            .doc('global')
            .collection(table.firebaseCollection)
            .where('tenantId', '==', tenantId)
            .count()
            .get();

          const firebaseCount = firebaseSnapshot.data().count;
          const difference = Math.abs((supabaseCount || 0) - firebaseCount);

          if (difference > 0) {
            discrepancies.push({
              tenantId,
              table: table.name,
              supabaseCount: supabaseCount || 0,
              firebaseCount,
              difference,
            });
          }
        }
      } catch (error) {
        console.error(`Error reconciling ${table.name}:`, error);
      }
    }

    const totalDiscrepancies = discrepancies.length;
    let reconciliationStatus: 'PASSED' | 'FAILED' | 'WARNING' = 'PASSED';

    if (totalDiscrepancies === 0) {
      reconciliationStatus = 'PASSED';
    } else if (totalDiscrepancies > 10) {
      reconciliationStatus = 'FAILED';
    } else {
      reconciliationStatus = 'WARNING';
    }

    console.log(`📊 Data reconciliation completed: ${reconciliationStatus} (${totalDiscrepancies} discrepancies)`);

    return {
      discrepancies,
      totalDiscrepancies,
      reconciliationStatus,
    };
  }

  // Automatic Data Sync for Discrepancies
  async syncDiscrepancies(discrepancies: any[]): Promise<void> {
    console.log(`🔄 Starting automatic sync for ${discrepancies.length} discrepancies`);
    
    for (const discrepancy of discrepancies) {
      try {
        if (discrepancy.supabaseCount > discrepancy.firebaseCount) {
          // Sync from Supabase to Firebase
          await this.syncSupabaseToFirebase(discrepancy.table, discrepancy.tenantId);
        } else if (discrepancy.firebaseCount > discrepancy.supabaseCount) {
          // Sync from Firebase to Supabase
          await this.syncFirebaseToSupabase(discrepancy.table, discrepancy.tenantId);
        }
      } catch (error) {
        console.error(`Failed to sync ${discrepancy.table} for tenant ${discrepancy.tenantId}:`, error);
      }
    }
  }

  private async syncSupabaseToFirebase(table: string, tenantId: string): Promise<void> {
    console.log(`📤 Syncing ${table} from Supabase to Firebase for tenant ${tenantId}`);
    
    // Get records from Supabase
    const { data: supabaseRecords } = await this.supabase
      .from(table)
      .select('*')
      .eq('tenant_id', tenantId);

    if (!supabaseRecords) return;

    const firebaseCollection = this.getFirebaseCollection(table);
    const batch = adminDb.batch();

    for (const record of supabaseRecords) {
      const firebaseData = this.transformToFirebase(record, table);
      const docRef = adminDb
        .collection('tenants')
        .doc('global')
        .collection(firebaseCollection)
        .doc(record.id);
      
      batch.set(docRef, firebaseData);
    }

    await batch.commit();
    console.log(`✅ Synced ${supabaseRecords.length} records to Firebase`);
  }

  private async syncFirebaseToSupabase(table: string, tenantId: string): Promise<void> {
    console.log(`📥 Syncing ${table} from Firebase to Supabase for tenant ${tenantId}`);
    
    const firebaseCollection = this.getFirebaseCollection(table);
    const firebaseSnapshot = await adminDb
      .collection('tenants')
      .doc('global')
      .collection(firebaseCollection)
      .where('tenantId', '==', tenantId)
      .get();

    if (firebaseSnapshot.empty) return;

    const supabaseData = firebaseSnapshot.docs.map(doc => 
      this.transformToSupabase(doc.data(), table)
    );

    const { error } = await this.supabase
      .from(table)
      .insert(supabaseData as any);

    if (error) {
      throw error;
    }

    console.log(`✅ Synced ${supabaseData.length} records to Supabase`);
  }

  private getFirebaseCollection(table: string): string {
    const collectionMap: Record<string, string> = {
      'milk_logs': 'milkLogs',
      'health_records': 'healthRecords',
      'breeding_records': 'breedingRecords',
      'expenses': 'expenses',
      'sales': 'sales',
    };
    return collectionMap[table] || table;
  }

  private transformToFirebase(data: any, table: string): any {
    // Convert snake_case to camelCase for Firebase
    const transformed: any = {};
    for (const [key, value] of Object.entries(data)) {
      const camelKey = key.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
      transformed[camelKey] = value;
    }
    return transformed;
  }

  private transformToSupabase(data: any, table: string): any {
    // Convert camelCase to snake_case for Supabase
    const transformed: any = {};
    for (const [key, value] of Object.entries(data)) {
      const snakeKey = key.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
      transformed[snakeKey] = value;
    }
    return transformed;
  }
}

export const dualWriteAPI = new DualWriteAPI();
