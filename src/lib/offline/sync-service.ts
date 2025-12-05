import { OfflineDB, QueuedMutation, db } from './database';
import { getSupabaseClient } from '@/lib/supabase';

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
      console.log('Sync already in progress');
      return;
    }

    this.syncInProgress = true;
    
    try {
      await OfflineDB.updateSyncStatus(tenantId, { syncInProgress: true });
      
      const mutations = await OfflineDB.getQueuedMutations(tenantId);
      
      if (mutations.length === 0) {
        console.log('No mutations to sync');
        await OfflineDB.updateSyncStatus(tenantId, {
          lastSync: Date.now(),
          syncInProgress: false,
        });
        return;
      }

      console.log(`Syncing ${mutations.length} mutations`);
      
      // Process mutations in order
      for (const mutation of mutations) {
        try {
          await this.processMutation(mutation);
          await OfflineDB.removeQueuedMutation(mutation.id);
          this.retryDelay = 1000; // Reset retry delay on success
        } catch (error) {
          console.error(`Failed to sync mutation ${mutation.id}:`, error);
          
          // Increment retry count
          await OfflineDB.incrementRetryCount(mutation.id);
          
          // Remove mutation if too many retries
          if (mutation.retryCount >= 5) {
            console.warn(`Removing mutation ${mutation.id} after 5 failed retries`);
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
      console.error('Sync failed:', error);
      await OfflineDB.updateSyncStatus(tenantId, { syncInProgress: false });
      throw error;
    } finally {
      this.syncInProgress = false;
    }
  }

  // Process individual mutation
  private async processMutation(mutation: QueuedMutation): Promise<void> {
    const supabase = getSupabaseClient();
    
    switch (mutation.table) {
      case 'animals':
        await this.processAnimalMutation(supabase, mutation);
        break;
      case 'milk_logs':
        await this.processMilkLogMutation(supabase, mutation);
        break;
      case 'health_records':
        await this.processHealthRecordMutation(supabase, mutation);
        break;
      default:
        throw new Error(`Unknown table: ${mutation.table}`);
    }
  }

  // Animal mutations
  private async processAnimalMutation(supabase: any, mutation: QueuedMutation): Promise<void> {
    switch (mutation.operation) {
      case 'create':
        const { error: createError } = await supabase
          .from('animals')
          .insert(mutation.data);
        if (createError) throw createError;
        
        // Mark as synced in IndexedDB
        await OfflineDB.updateAnimal(mutation.data.id, { _synced: true }, mutation.tenantId);
        break;

      case 'update':
        const { id, ...updates } = mutation.data;
        const { error: updateError } = await supabase
          .from('animals')
          .update(updates)
          .eq('id', id);
        if (updateError) throw updateError;
        
        // Mark as synced in IndexedDB
        await OfflineDB.updateAnimal(id, { _synced: true }, mutation.tenantId);
        break;

      case 'delete':
        const { error: deleteError } = await supabase
          .from('animals')
          .delete()
          .eq('id', mutation.data.id);
        if (deleteError) throw deleteError;
        
        // Remove from IndexedDB
        await db.animals.delete([mutation.data.id, mutation.tenantId]);
        break;
    }
  }

  // Milk log mutations
  private async processMilkLogMutation(supabase: any, mutation: QueuedMutation): Promise<void> {
    switch (mutation.operation) {
      case 'create':
        const { error: createError } = await supabase
          .from('milk_logs')
          .insert(mutation.data);
        if (createError) throw createError;
        
        // Mark as synced in IndexedDB
        await OfflineDB.updateMilkLog(mutation.data.id, { _synced: true }, mutation.tenantId);
        break;

      case 'update':
        const { id, ...updates } = mutation.data;
        const { error: updateError } = await supabase
          .from('milk_logs')
          .update(updates)
          .eq('id', id);
        if (updateError) throw updateError;
        
        // Mark as synced in IndexedDB
        await OfflineDB.updateMilkLog(id, { _synced: true }, mutation.tenantId);
        break;

      case 'delete':
        const { error: deleteError } = await supabase
          .from('milk_logs')
          .delete()
          .eq('id', mutation.data.id);
        if (deleteError) throw deleteError;
        
        // Remove from IndexedDB
        await db.milkLogs.delete([mutation.data.id, mutation.tenantId]);
        break;
    }
  }

  // Health record mutations
  private async processHealthRecordMutation(supabase: any, mutation: QueuedMutation): Promise<void> {
    switch (mutation.operation) {
      case 'create':
        const { error: createError } = await supabase
          .from('health_records')
          .insert(mutation.data);
        if (createError) throw createError;
        
        // Mark as synced in IndexedDB
        await OfflineDB.updateHealthRecord(mutation.data.id, { _synced: true }, mutation.tenantId);
        break;

      case 'update':
        const { id, ...updates } = mutation.data;
        const { error: updateError } = await supabase
          .from('health_records')
          .update(updates)
          .eq('id', id);
        if (updateError) throw updateError;
        
        // Mark as synced in IndexedDB
        await OfflineDB.updateHealthRecord(id, { _synced: true }, mutation.tenantId);
        break;

      case 'delete':
        const { error: deleteError } = await supabase
          .from('health_records')
          .delete()
          .eq('id', mutation.data.id);
        if (deleteError) throw deleteError;
        
        // Remove from IndexedDB
        await db.healthRecords.delete([mutation.data.id, mutation.tenantId]);
        break;
    }
  }

  // Pull latest data from server
  async pullLatestData(tenantId: string): Promise<void> {
    const supabase = getSupabaseClient();
    
    try {
      // Pull animals
      const { data: animals, error: animalsError } = await supabase
        .from('animals')
        .select('*')
        .eq('tenant_id', tenantId) as { data: any[]; error: any };

      if (!animalsError && animals) {
        for (const animal of animals) {
          const existing = await OfflineDB.getAnimal(animal.id, tenantId);
          
          if (!existing || animal.updated_at > new Date(existing._lastModified).toISOString()) {
            // Update or add animal
            await db.animals.put({
              ...animal,
              _synced: true,
              _lastModified: new Date(animal.updated_at).getTime(),
            });
          }
        }
      }

      // Pull recent milk logs (last 30 days)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      const { data: milkLogs, error: milkError } = await supabase
        .from('milk_logs')
        .select('*')
        .eq('tenant_id', tenantId)
        .gte('date', thirtyDaysAgo.toISOString().split('T')[0]) as { data: any[]; error: any };

      if (!milkError && milkLogs) {
        for (const log of milkLogs) {
          await db.milkLogs.put({
            ...log,
            _synced: true,
            _lastModified: new Date(log.created_at).getTime(),
          });
        }
      }

      // Pull recent health records (last 30 days)
      const { data: healthRecords, error: healthError } = await supabase
        .from('health_records')
        .select('*')
        .eq('tenant_id', tenantId)
        .gte('date', thirtyDaysAgo.toISOString().split('T')[0]) as { data: any[]; error: any };

      if (!healthError && healthRecords) {
        for (const record of healthRecords) {
          await db.healthRecords.put({
            ...record,
            _synced: true,
            _lastModified: new Date(record.created_at).getTime(),
          });
        }
      }

    } catch (error) {
      console.error('Failed to pull latest data:', error);
      throw error;
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
      console.error('Full sync failed:', error);
      throw error;
    }
  }

  // Auto-sync on interval
  startAutoSync(tenantId: string, interval = 60000): void { // Default 1 minute
    setInterval(async () => {
      try {
        const isOnline = navigator.onLine;
        if (isOnline) {
          await this.sync(tenantId);
        }
      } catch (error) {
        console.error('Auto-sync failed:', error);
      }
    }, interval);
  }
}

// Export singleton instance
export const syncService = SyncService.getInstance();
