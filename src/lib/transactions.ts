/**
 * Database Transaction Utilities
 * Provides transaction support for multi-step operations
 */

import { getDrizzle } from '@/lib/supabase/server';
import { sql } from 'drizzle-orm';

/**
 * Execute a callback within a database transaction
 * All operations will be committed together or rolled back on error
 */
export async function withTransaction<T>(callback: (tx: any) => Promise<T>): Promise<T> {
  const db = getDrizzle();

  try {
    return await db.transaction(async tx => {
      return await callback(tx);
    });
  } catch (error) {
    console.error('Transaction failed:', error);
    throw new Error(
      'Transaction failed: ' + (error instanceof Error ? error.message : 'Unknown error')
    );
  }
}

/**
 * Create an animal with initial health record in a transaction
 */
export async function createAnimalWithHealthRecord(params: {
  animalData: any;
  healthData: any;
  tenantId: string;
  userId: string;
}): Promise<any> {
  return withTransaction(async tx => {
    const schema = await import('@/db/schema');
    const { animals, health_records } = schema as any;

    // Create animal
    const [animal] = await tx
      .insert(animals)
      .values({
        ...params.animalData,
        tenant_id: params.tenantId,
        created_by: params.userId,
        created_at: new Date(),
        updated_at: new Date(),
      })
      .returning();

    // Create health record
    await tx.insert(health_records).values({
      ...params.healthData,
      tenant_id: params.tenantId,
      animal_id: animal.id,
      recorded_by: params.userId,
      created_at: new Date(),
      updated_at: new Date(),
    });

    return animal;
  });
}

/**
 * Create a milk log with automatic animal update in a transaction
 */
export async function createMilkLogWithAnimalUpdate(params: {
  milkData: any;
  animalId: string;
  tenantId: string;
  userId: string;
}): Promise<any> {
  return withTransaction(async tx => {
    const schema = await import('@/db/schema');
    const { milk_logs, animals } = schema as any;

    // Create milk log
    const [milkLog] = await tx
      .insert(milk_logs)
      .values({
        ...params.milkData,
        tenant_id: params.tenantId,
        animal_id: params.animalId,
        recorded_by: params.userId,
        created_at: new Date(),
        updated_at: new Date(),
      })
      .returning();

    // Update animal's last milked timestamp
    await tx
      .update(animals)
      .set({
        updated_at: new Date(),
      })
      .eq('id', params.animalId);

    return milkLog;
  });
}

/**
 * Create a breeding record with animal status update in a transaction
 */
export async function createBreedingRecordWithAnimalUpdate(params: {
  breedingData: any;
  femaleId: string;
  tenantId: string;
  userId: string;
}): Promise<any> {
  return withTransaction(async tx => {
    const schema = await import('@/db/schema');
    const { breeding_records, animals } = schema as any;

    // Create breeding record
    const [breedingRecord] = await tx
      .insert(breeding_records)
      .values({
        ...params.breedingData,
        tenant_id: params.tenantId,
        female_id: params.femaleId,
        created_at: new Date(),
        updated_at: new Date(),
      })
      .returning();

    // Update animal status if breeding was successful
    if (params.breedingData.status === 'pregnant') {
      await tx
        .update(animals)
        .set({
          status: 'breeding',
          updated_at: new Date(),
        })
        .eq('id', params.femaleId);
    }

    return breedingRecord;
  });
}

/**
 * Bulk create records in a transaction
 */
export async function bulkCreateRecords<T>(
  tableName: string,
  records: T[],
  tenantId: string,
  userId: string
): Promise<T[]> {
  return withTransaction(async tx => {
    const schema = await import('@/db/schema');
    const table = schema[tableName as keyof typeof schema];

    const recordsWithMetadata = records.map(record => ({
      ...record,
      tenant_id: tenantId,
      created_by: userId,
      created_at: new Date(),
      updated_at: new Date(),
    }));

    const result = await tx.insert(table).values(recordsWithMetadata).returning();
    return result;
  });
}

/**
 * Update multiple related records in a transaction
 */
export async function updateRelatedRecords(params: {
  updates: Array<{
    table: string;
    id: string;
    data: any;
  }>;
  tenantId: string;
  userId: string;
}): Promise<void> {
  return withTransaction(async tx => {
    const { eq } = await import('drizzle-orm');
    const schema = await import('@/db/schema');

    for (const update of params.updates) {
      const table = schema[update.table as keyof typeof schema] as any;

      // Skip if table doesn't have an id column (e.g., enums)
      if (!table || typeof table !== 'object' || !('id' in table)) {
        continue;
      }

      await tx
        .update(table)
        .set({
          ...update.data,
          updated_at: new Date(),
        })
        .where(eq(table.id, update.id));
    }
  });
}

/**
 * Transfer ownership of multiple animals in a transaction
 */
export async function transferAnimalOwnership(params: {
  animalIds: string[];
  fromTenantId: string;
  toTenantId: string;
  userId: string;
}): Promise<void> {
  return withTransaction(async tx => {
    const schema = await import('@/db/schema');
    const { animals, audit_logs } = schema as any;
    const { eq, inArray } = await import('drizzle-orm');

    // Update all animals
    await tx
      .update(animals)
      .set({
        tenant_id: params.toTenantId,
        updated_at: new Date(),
      })
      .where(inArray(animals.id, params.animalIds));

    // Create audit log for each animal
    for (const animalId of params.animalIds) {
      await tx.insert(audit_logs).values({
        tenant_id: params.toTenantId,
        user_id: params.userId,
        action: 'transfer',
        resource: 'animal',
        resource_id: animalId,
        details: {
          from_tenant_id: params.fromTenantId,
          to_tenant_id: params.toTenantId,
        },
        created_at: new Date(),
      });
    }
  });
}
