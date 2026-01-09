/**
 * Offline Support Utilities
 * Handles offline data storage and synchronization
 */

const DB_NAME = 'mtk-dairy-offline';
const DB_VERSION = 1;
const STORE_NAME = 'offline-actions';

export interface OfflineAction {
  id: string;
  url: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  data?: unknown;
  timestamp: number;
  synced: boolean;
}

/**
 * Initialize IndexedDB
 */
function initDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    request.onupgradeneeded = event => {
      const db = (event.target as IDBOpenDBRequest).result;

      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
        store.createIndex('timestamp', 'timestamp', { unique: false });
        store.createIndex('synced', 'synced', { unique: false });
      }
    };
  });
}

/**
 * Save offline action
 */
export async function saveOfflineAction(
  action: Omit<OfflineAction, 'id' | 'timestamp' | 'synced'>
): Promise<void> {
  const db = await initDB();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);

    const offlineAction: OfflineAction = {
      ...action,
      id: crypto.randomUUID(),
      timestamp: Date.now(),
      synced: false,
    };

    const request = store.add(offlineAction);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      // Register for background sync
      if ('serviceWorker' in navigator && 'sync' in (navigator.serviceWorker as any)) {
        (navigator.serviceWorker as any).sync.register('sync-offline-data');
      }
      resolve();
    };
  });
}

/**
 * Get all offline actions
 */
export async function getOfflineActions(): Promise<OfflineAction[]> {
  const db = await initDB();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.getAll();

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
  });
}

/**
 * Get unsynced actions
 */
export async function getUnsyncedActions(): Promise<OfflineAction[]> {
  const db = await initDB();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    const index = store.index('synced');
    const request = index.getAll(IDBKeyRange.only(false));

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
  });
}

/**
 * Mark action as synced
 */
export async function markActionAsSynced(id: string): Promise<void> {
  const db = await initDB();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.get(id);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      const action = request.result;
      if (action) {
        action.synced = true;
        const updateRequest = store.put(action);
        updateRequest.onerror = () => reject(updateRequest.error);
        updateRequest.onsuccess = () => resolve();
      } else {
        resolve();
      }
    };
  });
}

/**
 * Delete action
 */
export async function deleteAction(id: string): Promise<void> {
  const db = await initDB();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.delete(id);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve();
  });
}

/**
 * Clear all synced actions
 */
export async function clearSyncedActions(): Promise<void> {
  const db = await initDB();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const index = store.index('synced');
    const request = index.openCursor(IDBKeyRange.only(true));

    request.onerror = () => reject(request.error);
    request.onsuccess = event => {
      const cursor = (event.target as IDBRequest).result;

      if (cursor) {
        cursor.delete();
        cursor.continue();
      } else {
        resolve();
      }
    };
  });
}

/**
 * Check if online
 */
export function isOnline(): boolean {
  return navigator.onLine;
}

/**
 * Listen for online/offline events
 */
export function setupNetworkListeners(onOnline?: () => void, onOffline?: () => void): () => void {
  const handleOnline = () => {
    onOnline?.();
  };

  const handleOffline = () => {
    onOffline?.();
  };

  window.addEventListener('online', handleOnline);
  window.addEventListener('offline', handleOffline);

  return () => {
    window.removeEventListener('online', handleOnline);
    window.removeEventListener('offline', handleOffline);
  };
}

/**
 * Sync offline data
 */
export async function syncOfflineData(): Promise<{ success: number; failed: number }> {
  const actions = await getUnsyncedActions();

  let success = 0;
  let failed = 0;

  for (const action of actions) {
    try {
      const response = await fetch(action.url, {
        method: action.method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: action.data ? JSON.stringify(action.data) : undefined,
      });

      if (response.ok) {
        await markActionAsSynced(action.id);
        success++;
      } else {
        failed++;
      }
    } catch (error) {
      console.error('Failed to sync action:', action.id, error);
      failed++;
    }
  }

  // Clean up synced actions
  await clearSyncedActions();

  return { success, failed };
}

/**
 * Cache data for offline use
 */
export async function cacheData(key: string, data: unknown): Promise<void> {
  if ('caches' in window) {
    const cache = await caches.open('mtk-dairy-data');
    await cache.put(key, new Response(JSON.stringify(data)));
  }
}

/**
 * Get cached data
 */
export async function getCachedData<T>(key: string): Promise<T | null> {
  if ('caches' in window) {
    const cache = await caches.open('mtk-dairy-data');
    const response = await cache.match(key);

    if (response) {
      return response.json() as Promise<T>;
    }
  }

  return null;
}

/**
 * Clear cached data
 */
export async function clearCachedData(): Promise<void> {
  if ('caches' in window) {
    await caches.delete('mtk-dairy-data');
  }
}

/**
 * Queue API request for offline support
 */
export async function queueApiRequest<T>(url: string, options: RequestInit = {}): Promise<T> {
  if (!isOnline()) {
    // Save for later sync
    await saveOfflineAction({
      url,
      method: (options.method as 'GET' | 'POST' | 'PUT' | 'DELETE') || 'GET',
      data: options.body ? JSON.parse(options.body as string) : undefined,
    });

    // Try to get cached data
    const cachedData = await getCachedData<T>(url);
    if (cachedData) {
      return cachedData;
    }

    throw new Error('Offline - No cached data available');
  }

  // Online - make request
  const response = await fetch(url, {
    ...options,
    headers: {
      ...options.headers,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`Request failed: ${response.statusText}`);
  }

  const data = await response.json();

  // Cache GET requests
  if (options.method === 'GET' || !options.method) {
    await cacheData(url, data);
  }

  return data;
}
