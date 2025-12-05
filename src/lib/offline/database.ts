import Dexie, { Table } from 'dexie';
import type { Animal, MilkLog, HealthRecord } from '@/types';

// Define offline data interfaces
export interface OfflineAnimal extends Animal {
  _synced: boolean;
  _lastModified: number;
  _deleted?: boolean;
}

export interface OfflineMilkLog extends MilkLog {
  _synced: boolean;
  _lastModified: number;
  _deleted?: boolean;
}

export interface OfflineHealthRecord extends HealthRecord {
  _synced: boolean;
  _lastModified: number;
  _deleted?: boolean;
}

export interface QueuedMutation {
  id: string;
  tenantId: string;
  table: 'animals' | 'milk_logs' | 'health_records';
  operation: 'create' | 'update' | 'delete';
  data: any;
  timestamp: number;
  retryCount: number;
}

export interface SyncStatus {
  lastSync: number;
  isOnline: boolean;
  pendingMutations: number;
  syncInProgress: boolean;
}

class OfflineDatabase extends Dexie {
  animals!: Table<OfflineAnimal>;
  milkLogs!: Table<OfflineMilkLog>;
  healthRecords!: Table<OfflineHealthRecord>;
  queuedMutations!: Table<QueuedMutation>;
  syncStatus!: Table<SyncStatus>;

  constructor() {
    super('MTKDairyOffline');
    
    // Define schema
    this.version(1).stores({
      animals: 'id, tenant_id, tag, species, _synced, _lastModified, _deleted',
      milkLogs: 'id, tenant_id, animal_id, date, _synced, _lastModified, _deleted',
      healthRecords: 'id, tenant_id, animal_id, date, _synced, _lastModified, _deleted',
      queuedMutations: 'id, tenantId, table, timestamp, retryCount',
      syncStatus: 'tenantId',
    });
  }
}

export const db = new OfflineDatabase();

// Database operations
export class OfflineDB {
  // ANIMALS
  static async getAnimals(tenantId: string): Promise<OfflineAnimal[]> {
    return await db.animals
      .where('tenant_id')
      .equals(tenantId)
      .and(animal => !animal._deleted)
      .toArray();
  }

  static async getAnimal(id: string, tenantId: string): Promise<OfflineAnimal | undefined> {
    return await db.animals
      .where('[id+tenant_id]')
      .equals([id, tenantId])
      .and(animal => !animal._deleted)
      .first();
  }

  static async addAnimal(animal: Omit<OfflineAnimal, 'id' | '_synced' | '_lastModified'>, tenantId: string): Promise<string> {
    const id = crypto.randomUUID();
    const now = Date.now();
    
    await db.animals.add({
      ...animal,
      id,
      tenant_id: tenantId,
      _synced: false,
      _lastModified: now,
    });

    // Queue for sync
    await this.queueMutation({
      id: crypto.randomUUID(),
      tenantId,
      table: 'animals',
      operation: 'create',
      data: { ...animal, id, tenant_id: tenantId },
      timestamp: now,
      retryCount: 0,
    });

    return id;
  }

  static async updateAnimal(id: string, updates: Partial<OfflineAnimal>, tenantId: string): Promise<void> {
    const now = Date.now();
    
    await db.animals.update([id, tenantId], {
      ...updates,
      _synced: false,
      _lastModified: now,
    });

    // Queue for sync
    await this.queueMutation({
      id: crypto.randomUUID(),
      tenantId,
      table: 'animals',
      operation: 'update',
      data: { id, ...updates, tenant_id: tenantId },
      timestamp: now,
      retryCount: 0,
    });
  }

  static async deleteAnimal(id: string, tenantId: string): Promise<void> {
    const now = Date.now();
    
    // Soft delete
    await db.animals.update([id, tenantId], {
      _deleted: true,
      _synced: false,
      _lastModified: now,
    });

    // Queue for sync
    await this.queueMutation({
      id: crypto.randomUUID(),
      tenantId,
      table: 'animals',
      operation: 'delete',
      data: { id, tenant_id: tenantId },
      timestamp: now,
      retryCount: 0,
    });
  }

  // MILK LOGS
  static async getMilkLogs(tenantId: string, animalId?: string, limit = 30): Promise<OfflineMilkLog[]> {
    let query = db.milkLogs
      .where('tenant_id')
      .equals(tenantId)
      .and(log => !log._deleted);

    if (animalId) {
      query = query.and(log => log.animal_id === animalId);
    }

    return await query
      .reverse()
      .sortBy('date')
      .then(logs => logs.slice(-limit));
  }

  static async addMilkLog(log: Omit<OfflineMilkLog, 'id' | '_synced' | '_lastModified'>, tenantId: string): Promise<string> {
    const id = crypto.randomUUID();
    const now = Date.now();
    
    await db.milkLogs.add({
      ...log,
      id,
      tenant_id: tenantId,
      _synced: false,
      _lastModified: now,
    });

    // Queue for sync
    await this.queueMutation({
      id: crypto.randomUUID(),
      tenantId,
      table: 'milk_logs',
      operation: 'create',
      data: { ...log, id, tenant_id: tenantId },
      timestamp: now,
      retryCount: 0,
    });

    return id;
  }

  // HEALTH RECORDS
  static async getHealthRecords(tenantId: string, animalId?: string, limit = 30): Promise<OfflineHealthRecord[]> {
    let query = db.healthRecords
      .where('tenant_id')
      .equals(tenantId)
      .and(record => !record._deleted);

    if (animalId) {
      query = query.and(record => record.animal_id === animalId);
    }

    return await query
      .reverse()
      .sortBy('date')
      .then(records => records.slice(-limit));
  }

  // Helper methods for updating records (used by sync service)
  static async updateMilkLog(id: string, updates: any, tenantId: string): Promise<void> {
    await db.milkLogs.update([id, tenantId], updates);
  }

  static async updateHealthRecord(id: string, updates: any, tenantId: string): Promise<void> {
    await db.healthRecords.update([id, tenantId], updates);
  }

  static async addHealthRecord(record: Omit<OfflineHealthRecord, 'id' | '_synced' | '_lastModified'>, tenantId: string): Promise<string> {
    const id = crypto.randomUUID();
    const now = Date.now();
    
    await db.healthRecords.add({
      ...record,
      id,
      tenant_id: tenantId,
      _synced: false,
      _lastModified: now,
    });

    // Queue for sync
    await this.queueMutation({
      id: crypto.randomUUID(),
      tenantId,
      table: 'health_records',
      operation: 'create',
      data: { ...record, id, tenant_id: tenantId },
      timestamp: now,
      retryCount: 0,
    });

    return id;
  }

  // SYNC QUEUE
  static async queueMutation(mutation: QueuedMutation): Promise<void> {
    await db.queuedMutations.add(mutation);
  }

  static async getQueuedMutations(tenantId: string): Promise<QueuedMutation[]> {
    return await db.queuedMutations
      .where('tenantId')
      .equals(tenantId)
      .toArray();
  }

  static async removeQueuedMutation(id: string): Promise<void> {
    await db.queuedMutations.delete(id);
  }

  static async incrementRetryCount(id: string): Promise<void> {
    await db.queuedMutations.update(id, {
      retryCount: Dexie.raw('retryCount + 1'),
    });
  }

  // SYNC STATUS
  static async getSyncStatus(tenantId: string): Promise<SyncStatus | undefined> {
    return await db.syncStatus.get(tenantId);
  }

  static async updateSyncStatus(tenantId: string, updates: Partial<SyncStatus>): Promise<void> {
    await db.syncStatus.put({
      tenantId,
      ...updates,
    });
  }

  // CLEANUP
  static async cleanupOldData(tenantId: string): Promise<void> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - 30); // Keep 30 days

    // Delete old synced records
    await db.milkLogs
      .where('tenant_id')
      .equals(tenantId)
      .and(log => log._synced && new Date(log.date) < cutoffDate)
      .delete();

    await db.healthRecords
      .where('tenant_id')
      .equals(tenantId)
      .and(record => record._synced && new Date(record.date) < cutoffDate)
      .delete();

    // Delete old queued mutations (older than 7 days)
    const mutationCutoff = Date.now() - (7 * 24 * 60 * 60 * 1000);
    await db.queuedMutations
      .where('tenantId')
      .equals(tenantId)
      .and(mutation => mutation.timestamp < mutationCutoff)
      .delete();
  }
}
