// Offline Sync Service for MTK Dairy
// IndexedDB wrapper with sync capabilities

import { openDB, DBSchema, IDBPDatabase } from 'idb';

interface MTKDairyDB extends DBSchema {
  // Offline data stores
  animals: {
    key: string;
    value: any;
    indexes: {
      'by-tenant': string;
      'by-status': string;
      'updated-at': number;
    };
  };
  milk_logs: {
    key: string;
    value: any;
    indexes: {
      'by-tenant': string;
      'by-animal': string;
      'by-date': string;
    };
  };
  health_records: {
    key: string;
    value: any;
    indexes: {
      'by-tenant': string;
      'by-animal': string;
      'by-date': string;
    };
  };
  // Sync queue
  sync_queue: {
    key: string;
    value: {
      id: string;
      table: string;
      operation: 'create' | 'update' | 'delete';
      data: any;
      timestamp: number;
      retries: number;
    };
  };
  // App state
  app_state: {
    app_state: {
      key: string;
      value: {
        key: string;
        value: any;
      };
    };
  };
}

class OfflineSyncService {
  private db: IDBPDatabase<MTKDairyDB> | null = null;
  private syncInProgress = false;
  private syncCallbacks: ((success: boolean) => void)[] = [];

  async init() {
    try {
      this.db = await openDB<MTKDairyDB>('MTKDairy', 1, {
        upgrade(db) {
          // Animals store
          const animalStore = db.createObjectStore('animals', { keyPath: 'id' });
          animalStore.createIndex('by-tenant', 'tenant_id');
          animalStore.createIndex('by-status', 'status');
          animalStore.createIndex('updated-at', 'updated_at');

          // Milk logs store
          const milkStore = db.createObjectStore('milk_logs', { keyPath: 'id' });
          milkStore.createIndex('by-tenant', 'tenant_id');
          milkStore.createIndex('by-animal', 'animal_id');
          milkStore.createIndex('by-date', 'date');

          // Health records store
          const healthStore = db.createObjectStore('health_records', { keyPath: 'id' });
          healthStore.createIndex('by-tenant', 'tenant_id');
          healthStore.createIndex('by-animal', 'animal_id');
          healthStore.createIndex('by-date', 'date');

          // Sync queue
          db.createObjectStore('sync_queue', { keyPath: 'id' });

          // App state
          db.createObjectStore('app_state', { keyPath: 'key' });
        },
      });

      console.log('Offline DB initialized');
    } catch (error) {
      console.error('Failed to initialize offline DB:', error);
      throw error;
    }
  }

  // Save data to IndexedDB
  async save(tableName: keyof MTKDairyDB, data: any) {
    if (!this.db) throw new Error('DB not initialized');

    const tx = this.db.transaction(tableName as any, 'readwrite');
    await tx.store.put(data);
    await tx.done;

    // Add to sync queue
    await this.addToSyncQueue(tableName as string, 'update', data);
  }

  // Get data from IndexedDB
  async get(tableName: keyof MTKDairyDB, id: string) {
    if (!this.db) throw new Error('DB not initialized');
    return await this.db.get(tableName, id);
  }

  // Query data with index
  async query(
    tableName: 'animals' | 'milk_logs' | 'health_records',
    indexName: string,
    value: string
  ) {
    if (!this.db) throw new Error('DB not initialized');

    const tx = this.db.transaction(tableName, 'readonly');
    const index = tx.store.index(indexName);
    return await index.getAll(value);
  }

  // Add operation to sync queue
  private async addToSyncQueue(
    table: string,
    operation: 'create' | 'update' | 'delete',
    data: any
  ) {
    if (!this.db) return;

    const syncItem = {
      id: `${table}_${data.id}_${Date.now()}`,
      table,
      operation,
      data,
      timestamp: Date.now(),
      retries: 0,
    };

    const tx = this.db.transaction('sync_queue', 'readwrite');
    await tx.store.put(syncItem);
    await tx.done;

    // Trigger sync if online
    if (navigator.onLine) {
      this.sync();
    }
  }

  // Sync with server
  async sync() {
    if (!this.db || this.syncInProgress) return;

    this.syncInProgress = true;

    try {
      const tx = this.db.transaction('sync_queue', 'readonly');
      const pendingItems = await tx.store.getAll();
      await tx.done;

      if (pendingItems.length === 0) {
        this.updateLastSync();
        this.notifySyncCallbacks(true);
        return;
      }

      // Process each item
      for (const item of pendingItems) {
        try {
          await this.syncItem(item);
          await this.removeFromSyncQueue(item.id);
        } catch (error) {
          console.error('Failed to sync item:', item, error);
          await this.incrementRetryCount(item.id);
        }
      }

      this.updateLastSync();
      this.notifySyncCallbacks(true);
    } catch (error) {
      console.error('Sync failed:', error);
      this.notifySyncCallbacks(false);
    } finally {
      this.syncInProgress = false;
    }
  }

  // Sync individual item
  private async syncItem(item: any) {
    const { table, operation, data } = item;
    const endpoint = `/api/${table}`;

    if (operation === 'delete') {
      await fetch(`${endpoint}/${data.id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      });
    } else {
      await fetch(endpoint, {
        method: operation === 'create' ? 'POST' : 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });
    }
  }

  // Remove item from sync queue
  private async removeFromSyncQueue(id: string) {
    if (!this.db) return;
    const tx = this.db.transaction('sync_queue', 'readwrite');
    await tx.store.delete(id);
    await tx.done;
  }

  // Increment retry count
  private async incrementRetryCount(id: string) {
    if (!this.db) return;
    const item = await this.db.get('sync_queue', id);
    if (item && item.retries < 3) {
      item.retries++;
      item.timestamp = Date.now() + (item.retries * 60000); // Exponential backoff
      const tx = this.db.transaction('sync_queue', 'readwrite');
      await tx.store.put(item);
      await tx.done;
    }
  }

  // Update last sync timestamp
  private async updateLastSync() {
    if (!this.db) return;
    const tx = this.db.transaction('app_state', 'readwrite');
    await tx.store.put({
      key: 'last_sync',
      value: Date.now(),
    });
    await tx.done;
  }

  // Get last sync time
  async getLastSync(): Promise<number | null> {
    if (!this.db) return null;
    const state = await this.db.get('app_state', 'last_sync');
    return state?.value || null;
  }

  // Subscribe to sync events
  onSyncComplete(callback: (success: boolean) => void) {
    this.syncCallbacks.push(callback);
    return () => {
      this.syncCallbacks = this.syncCallbacks.filter(cb => cb !== callback);
    };
  }

  private notifySyncCallbacks(success: boolean) {
    this.syncCallbacks.forEach(cb => cb(success));
  }

  // Clear all data (for logout)
  async clear() {
    if (!this.db) return;

    const stores = ['animals', 'milk_logs', 'health_records', 'sync_queue', 'app_state'];
    for (const store of stores) {
      const tx = this.db.transaction(store as any, 'readwrite');
      await tx.store.clear();
      await tx.done;
    }
  }

  // Preload essential data
  async preloadData(tenantId: string) {
    if (!this.db) return;

    try {
      // Fetch animals
      const animalsRes = await fetch(`/api/animals?tenantId=${tenantId}`);
      const animals = await animalsRes.json();

      const tx = this.db.transaction('animals', 'readwrite');
      for (const animal of animals.data?.animals || []) {
        await tx.store.put(animal);
      }
      await tx.done;

      console.log('Preloaded data for offline use');
    } catch (error) {
      console.error('Failed to preload data:', error);
    }
  }
}

// Export singleton
export const offlineSync = new OfflineSyncService();

// React hook for offline status
import { useEffect, useState } from 'react';

export function useOfflineSync() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [lastSync, setLastSync] = useState<Date | null>(null);
  const [syncing, setSyncing] = useState(false);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      offlineSync.sync();
    };

    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Load last sync time
    offlineSync.getLastSync().then(timestamp => {
      if (timestamp) setLastSync(new Date(timestamp));
    });

    // Subscribe to sync events
    const unsubscribe = offlineSync.onSyncComplete((success) => {
      setSyncing(false);
      if (success) {
        setLastSync(new Date());
      }
    });

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      unsubscribe();
    };
  }, []);

  const triggerSync = () => {
    setSyncing(true);
    offlineSync.sync();
  };

  return {
    isOnline,
    lastSync,
    syncing,
    triggerSync,
  };
}
