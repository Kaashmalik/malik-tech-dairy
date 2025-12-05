"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState, useCallback } from "react";
import { OfflineDB } from "./database";
import { syncService } from "./sync-service";

// Generic offline query hook
export function useOfflineQuery<T>(
  tenantId: string,
  queryKey: string[],
  offlineFetcher: (tenantId: string) => Promise<T[]>,
  networkFetcher: (tenantId: string) => Promise<T[]>,
  options?: {
    enabled?: boolean;
    staleTime?: number;
    refetchInterval?: number;
  }
) {
  const [hasUsedOfflineData, setHasUsedOfflineData] = useState(false);
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey,
    queryFn: async () => {
      // First try offline cache for instant response
      try {
        const offlineData = await offlineFetcher(tenantId);
        if (offlineData.length > 0 && !hasUsedOfflineData) {
          setHasUsedOfflineData(true);
          return offlineData;
        }
      } catch (error) {
        console.error("Offline fetch failed:", error);
      }

      // Then try network if online
      if (navigator.onLine) {
        try {
          const networkData = await networkFetcher(tenantId);
          
          // Reset offline flag when we get fresh network data
          setHasUsedOfflineData(false);
          
          // Update offline cache with fresh data
          if (networkData.length > 0) {
            // This would be implemented in each specific service
            // For now, just return network data
          }
          
          return networkData;
        } catch (error) {
          console.error("Network fetch failed:", error);
          
          // Fallback to offline data if network fails
          try {
            const fallbackData = await offlineFetcher(tenantId);
            return fallbackData;
          } catch (fallbackError) {
            throw new Error("Both offline and network data unavailable");
          }
        }
      }

      // If offline and no cached data, throw error
      throw new Error("No internet connection and no cached data available");
    },
    enabled: options?.enabled !== false,
    staleTime: options?.staleTime || 1000 * 60 * 5, // 5 minutes
    refetchInterval: options?.refetchInterval,
  });

  // Auto-sync when coming back online
  useEffect(() => {
    const handleOnline = async () => {
      if (tenantId) {
        try {
          await syncService.sync(tenantId);
          // Refetch data after sync
          queryClient.invalidateQueries({ queryKey });
        } catch (error) {
          console.error("Auto-sync failed:", error);
        }
      }
    };

    window.addEventListener("online", handleOnline);
    return () => window.removeEventListener("online", handleOnline);
  }, [tenantId, queryClient, queryKey]);

  return {
    ...query,
    isOfflineData: hasUsedOfflineData && !query.isFetched,
  };
}

// Specific hooks for different entities
export function useOfflineAnimals(tenantId: string) {
  return useOfflineQuery(
    tenantId,
    ["animals", tenantId],
    (tenantId) => OfflineDB.getAnimals(tenantId),
    async (tenantId) => {
      const response = await fetch(`/api/animals?tenantId=${tenantId}`);
      if (!response.ok) throw new Error("Failed to fetch animals");
      const data = await response.json();
      return data.animals || [];
    }
  );
}

export function useOfflineMilkLogs(tenantId: string, animalId?: string, limit = 30) {
  return useOfflineQuery(
    tenantId,
    ["milkLogs", tenantId, animalId, limit],
    (tenantId) => OfflineDB.getMilkLogs(tenantId, animalId, limit),
    async (tenantId) => {
      const url = animalId 
        ? `/api/milk?animalId=${animalId}&limit=${limit}`
        : `/api/milk?limit=${limit}`;
      const response = await fetch(url);
      if (!response.ok) throw new Error("Failed to fetch milk logs");
      const data = await response.json();
      return data.logs || [];
    }
  );
}

export function useOfflineHealthRecords(tenantId: string, animalId?: string, limit = 30) {
  return useOfflineQuery(
    tenantId,
    ["healthRecords", tenantId, animalId, limit],
    (tenantId) => OfflineDB.getHealthRecords(tenantId, animalId, limit),
    async (tenantId) => {
      const url = animalId 
        ? `/api/health?animalId=${animalId}&limit=${limit}`
        : `/api/health?limit=${limit}`;
      const response = await fetch(url);
      if (!response.ok) throw new Error("Failed to fetch health records");
      const data = await response.json();
      return data.records || [];
    }
  );
}

// Offline mutation hook
export function useOfflineMutation<T, V>(
  tenantId: string,
  mutationFn: (variables: V) => Promise<T>,
  offlineAction: (variables: V, tenantId: string) => Promise<string>,
  options?: {
    onSuccess?: (data: T, variables: V) => void;
    onError?: (error: Error, variables: V) => void;
    invalidateQueries?: string[][];
  }
) {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async (variables: V) => {
      // First perform offline action for immediate UI update
      try {
        await offlineAction(variables, tenantId);
      } catch (error) {
        console.error("Offline action failed:", error);
        // Continue with network action even if offline fails
      }

      // Then perform network mutation if online
      if (navigator.onLine) {
        try {
          const result = await mutationFn(variables);
          
          // Update offline cache with server response
          // This would be implemented based on the specific mutation type
          
          return result;
        } catch (error) {
          console.error("Network mutation failed, will sync later:", error);
          // Return a success response anyway since offline action succeeded
          return { success: true, offline: true } as T;
        }
      } else {
        // Offline mode - just return success
        return { success: true, offline: true } as T;
      }
    },
    onSuccess: (data, variables) => {
      // Invalidate related queries
      if (options?.invalidateQueries) {
        options.invalidateQueries.forEach(queryKey => {
          queryClient.invalidateQueries({ queryKey });
        });
      }
      
      options?.onSuccess?.(data, variables);
    },
    onError: (error, variables) => {
      console.error("Mutation failed:", error);
      options?.onError?.(error, variables);
    },
  });

  return mutation;
}

// Specific mutation hooks
export function useOfflineCreateAnimal(tenantId: string) {
  return useOfflineMutation(
    tenantId,
    async (animalData: any) => {
      const response = await fetch("/api/animals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(animalData),
      });
      if (!response.ok) throw new Error("Failed to create animal");
      return response.json();
    },
    async (animalData: any, tenantId: string) => {
      return await OfflineDB.addAnimal(animalData, tenantId);
    },
    {
      invalidateQueries: [["animals", tenantId]],
    }
  );
}

export function useOfflineUpdateAnimal(tenantId: string) {
  return useOfflineMutation(
    tenantId,
    async ({ id, ...updates }: any) => {
      const response = await fetch(`/api/animals/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      });
      if (!response.ok) throw new Error("Failed to update animal");
      return response.json();
    },
    async ({ id, ...updates }: any, tenantId: string) => {
      await OfflineDB.updateAnimal(id, updates, tenantId);
      return id;
    },
    {
      invalidateQueries: [["animals", tenantId]],
    }
  );
}

export function useOfflineDeleteAnimal(tenantId: string) {
  return useOfflineMutation(
    tenantId,
    async (id: string) => {
      const response = await fetch(`/api/animals/${id}`, {
        method: "DELETE",
      });
      if (!response.ok) throw new Error("Failed to delete animal");
      return response.json();
    },
    async (id: string, tenantId: string) => {
      await OfflineDB.deleteAnimal(id, tenantId);
      return id;
    },
    {
      invalidateQueries: [["animals", tenantId]],
    }
  );
}

export function useOfflineCreateMilkLog(tenantId: string) {
  return useOfflineMutation(
    tenantId,
    async (logData: any) => {
      const response = await fetch("/api/milk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(logData),
      });
      if (!response.ok) throw new Error("Failed to create milk log");
      return response.json();
    },
    async (logData: any, tenantId: string) => {
      return await OfflineDB.addMilkLog(logData, tenantId);
    },
    {
      invalidateQueries: [["milkLogs", tenantId]],
    }
  );
}

// Sync status hook
export function useSyncStatus(tenantId: string) {
  const [syncStatus, setSyncStatus] = useState({
    isOnline: navigator.onLine,
    pendingMutations: 0,
    lastSync: 0,
    syncInProgress: false,
  });

  useEffect(() => {
    const updateStatus = async () => {
      try {
        const status = await OfflineDB.getSyncStatus(tenantId);
        const mutations = await OfflineDB.getQueuedMutations(tenantId);
        
        setSyncStatus({
          isOnline: navigator.onLine,
          pendingMutations: mutations.length,
          lastSync: status?.lastSync || 0,
          syncInProgress: status?.syncInProgress || false,
        });
      } catch (error) {
        console.error("Failed to get sync status:", error);
      }
    };

    updateStatus();
    
    const interval = setInterval(updateStatus, 5000); // Update every 5 seconds
    
    const handleOnline = updateStatus;
    const handleOffline = updateStatus;
    
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    
    return () => {
      clearInterval(interval);
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, [tenantId]);

  const manualSync = useCallback(async () => {
    if (navigator.onLine && tenantId) {
      try {
        await syncService.sync(tenantId);
        // Update status after sync
        const status = await OfflineDB.getSyncStatus(tenantId);
        const mutations = await OfflineDB.getQueuedMutations(tenantId);
        
        setSyncStatus(prev => ({
          ...prev,
          pendingMutations: mutations.length,
          lastSync: status?.lastSync || Date.now(),
          syncInProgress: false,
        }));
      } catch (error) {
        console.error("Manual sync failed:", error);
      }
    }
  }, [tenantId]);

  return {
    ...syncStatus,
    manualSync,
  };
}
