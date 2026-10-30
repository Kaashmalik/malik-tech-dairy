import { OfflineDB, QueuedMutation, db } from './database';

// The browser never writes Supabase tables directly (the anon key is public and the
// user has no Supabase identity). Mutations replay through the same tenant-checked
// server APIs the app uses online.
type Endpoint = { method: 'POST' | 'PUT' | 'DELETE'; url: string; body?: unknown };

const ENDPOINTS: Record<
  string,
  Partial<Record<QueuedMutation['operation'], (d: any) => Endpoint>>
> = {
  animals: {
    create: d => ({ method: 'POST', url: '/api/animals', body: d }),
    update: ({ id, ...rest }) => ({
      method: 'PUT',
      url: `/api/animals/${encodeURIComponent(id)}`,
      body: rest,
    }),
    delete: d => ({ method: 'DELETE', url: `/api/animals/${encodeURIComponent(d.id)}` }),
  },
  milk_logs: {
    create: d => ({ method: 'POST', url: '/api/milk', body: d }),
  },
  health_records: {
    create: d => ({ method: 'POST', url: '/api/health/records', body: d }),
    update: ({ id, ...rest }) => ({
      method: 'PUT',
      url: `/api/health/records/${encodeURIComponent(id)}`,
      body: rest,
    }),
    delete: d => ({ method: 'DELETE', url: `/api/health/records/${encodeURIComponent(d.id)}` }),
  },
};

async function callApi({ method, url, body }: Endpoint): Promise<void> {
  const res = await fetch(url, {
    method,
    headers: body ? { 'Content-Type': 'application/json' } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) {
    const json = await res.json().catch(() => ({}));
    throw new Error(json.error || `${method} ${url} failed (${res.status})`);
  }
}

async function getJson<T>(url: string): Promise<T> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`GET ${url} failed (${res.status})`);
  return res.json();
}
export class SyncService {
  private static instance: SyncService;
  private syncInProgress = false;
  private retryDelay = 1000; // Start with 1 second
  private maxRetryDelay = 30000; // Max 30 seconds
  static getInstance(): SyncService {
    if (!SyncService.instance) {
      SyncService.instance = new SyncService();
    }
    return SyncService.instance;
  }
  // Start sync process
  async sync(tenantId: string): Promise<void> {
    if (this.syncInProgress) {
      return;
    }
    this.syncInProgress = true;
    try {
      await OfflineDB.updateSyncStatus(tenantId, { syncInProgress: true });
      const mutations = await OfflineDB.getQueuedMutations(tenantId);
      if (mutations.length === 0) {
        await OfflineDB.updateSyncStatus(tenantId, {
          lastSync: Date.now(),
          syncInProgress: false,
        });
        return;
      }
      // Process mutations in order
      for (const mutation of mutations) {
        try {
          await this.processMutation(mutation);
          await OfflineDB.removeQueuedMutation(mutation.id);
          this.retryDelay = 1000; // Reset retry delay on success
        } catch (error) {
          // Increment retry count
          await OfflineDB.incrementRetryCount(mutation.id);
          // Remove mutation if too many retries
          if (mutation.retryCount >= 5) {
            await OfflineDB.removeQueuedMutation(mutation.id);
          }
        }
      }
      // Update sync status
      const pendingMutations = await OfflineDB.getQueuedMutations(tenantId);
      await OfflineDB.updateSyncStatus(tenantId, {
        lastSync: Date.now(),
        syncInProgress: false,
        pendingMutations: pendingMutations.length,
      });
      // Cleanup old data
      await OfflineDB.cleanupOldData(tenantId);
    } catch (error) {
      await OfflineDB.updateSyncStatus(tenantId, { syncInProgress: false });
      throw error;
    } finally {
      this.syncInProgress = false;
    }
  }
  // Process individual mutation
  private async processMutation(mutation: QueuedMutation): Promise<void> {
    const build = ENDPOINTS[mutation.table]?.[mutation.operation];
    if (!build) {
      throw new Error(`Unsupported offline mutation: ${mutation.table}.${mutation.operation}`);
    }
    await callApi(build(mutation.data));

    const { id } = mutation.data;
    const { tenantId } = mutation;
    if (mutation.table === 'animals') {
      if (mutation.operation === 'delete') await db.animals.delete([id, tenantId]);
      else await OfflineDB.updateAnimal(id, { _synced: true }, tenantId);
    } else if (mutation.table === 'milk_logs') {
      await OfflineDB.updateMilkLog(id, { _synced: true }, tenantId);
    } else if (mutation.table === 'health_records') {
      if (mutation.operation === 'delete') await db.healthRecords.delete([id, tenantId]);
      else await OfflineDB.updateHealthRecord(id, { _synced: true }, tenantId);
    }
  }
  // Pull latest data from server (tenant comes from the session, not the argument)
  async pullLatestData(tenantId: string): Promise<void> {
    // Animals: page through the list API
    for (let page = 1; page <= 50; page++) {
      const json = await getJson<{ data: { animals: any[]; pagination: { totalPages: number } } }>(
        `/api/animals?page=${page}&limit=100`
      );
      for (const animal of json.data.animals) {
        const existing = await OfflineDB.getAnimal(animal.id, tenantId);
        const updatedAt = new Date(animal.updatedAt).getTime();
        if (!existing || updatedAt > existing._lastModified) {
          await db.animals.put({ ...animal, tenantId, _synced: true, _lastModified: updatedAt });
        }
      }
      if (page >= json.data.pagination.totalPages) break;
    }

    // Recent milk logs (last 30 days)
    const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const milk = await getJson<{ data: { logs: any[] } }>(`/api/milk?startDate=${since}&limit=100`);
    for (const log of milk.data.logs) {
      await db.milkLogs.put({
        ...log,
        tenantId,
        _synced: true,
        _lastModified: new Date(log.createdAt || Date.now()).getTime(),
      });
    }

    // Recent health records
    const health = await getJson<{ records: any[] }>('/api/health/records');
    for (const record of health.records || []) {
      await db.healthRecords.put({
        ...record,
        tenantId,
        _synced: true,
        _lastModified: new Date(record.createdAt || Date.now()).getTime(),
      });
    }
  }
  // Full sync (pull + push)
  async fullSync(tenantId: string): Promise<void> {
    try {
      // First pull latest data
      await this.pullLatestData(tenantId);
      // Then push local changes
      await this.sync(tenantId);
    } catch (error) {
      throw error;
    }
  }
  // Auto-sync on interval
  startAutoSync(tenantId: string, interval = 60000): void {
    // Default 1 minute
    setInterval(async () => {
      try {
        const isOnline = navigator.onLine;
        if (isOnline) {
          await this.sync(tenantId);
        }
      } catch (error) {}
    }, interval);
  }
}
// Export singleton instance
export const syncService = SyncService.getInstance();
