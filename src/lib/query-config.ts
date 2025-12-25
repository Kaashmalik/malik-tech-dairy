/**
 * Query Configuration
 * Centralized configuration for different query types and environments
 */

export const queryConfig = {
  // Default configuration
  default: {
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 30, // 30 minutes
    refetchOnWindowFocus: false,
    refetchOnReconnect: true,
    refetchOnMount: true,
    retry: 2,
    retryDelay: (attemptIndex: number) => Math.min(1000 * 2 ** attemptIndex, 30000),
    networkMode: 'offlineFirst' as const,
  },

  // Real-time data (e.g., notifications, live updates)
  realtime: {
    staleTime: 0, // Always stale
    gcTime: 1000 * 60 * 1, // 1 minute
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
    refetchOnMount: true,
    retry: 3,
    retryDelay: (attemptIndex: number) => Math.min(1000 * 2 ** attemptIndex, 10000),
    networkMode: 'online' as const,
  },

  // Static data (e.g., user profile, settings)
  static: {
    staleTime: 1000 * 60 * 60, // 1 hour
    gcTime: 1000 * 60 * 60 * 24, // 24 hours
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    refetchOnMount: false,
    retry: 1,
    retryDelay: 1000,
    networkMode: 'offlineFirst' as const,
  },

  // User-generated content (e.g., posts, comments)
  userContent: {
    staleTime: 1000 * 60 * 10, // 10 minutes
    gcTime: 1000 * 60 * 60, // 1 hour
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
    refetchOnMount: true,
    retry: 2,
    retryDelay: (attemptIndex: number) => Math.min(1000 * 2 ** attemptIndex, 30000),
    networkMode: 'offlineFirst' as const,
  },

  // Analytics data (e.g., charts, reports)
  analytics: {
    staleTime: 1000 * 60 * 30, // 30 minutes
    gcTime: 1000 * 60 * 60 * 2, // 2 hours
    refetchOnWindowFocus: false,
    refetchOnReconnect: true,
    refetchOnMount: false,
    retry: 1,
    retryDelay: 2000,
    networkMode: 'offlineFirst' as const,
  },

  // Search results
  search: {
    staleTime: 1000 * 60 * 2, // 2 minutes
    gcTime: 1000 * 60 * 10, // 10 minutes
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    refetchOnMount: false,
    retry: 1,
    retryDelay: 1000,
    networkMode: 'online' as const,
  },

  // File uploads
  upload: {
    staleTime: Infinity, // Never stale
    gcTime: Infinity, // Never garbage collect
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    refetchOnMount: false,
    retry: 3,
    retryDelay: (attemptIndex: number) => Math.min(1000 * 2 ** attemptIndex, 10000),
    networkMode: 'online' as const,
  },

  // Background sync
  backgroundSync: {
    staleTime: 1000 * 60 * 15, // 15 minutes
    gcTime: 1000 * 60 * 60, // 1 hour
    refetchOnWindowFocus: false,
    refetchOnReconnect: true,
    refetchOnMount: false,
    retry: 5,
    retryDelay: (attemptIndex: number) => Math.min(1000 * 2 ** attemptIndex, 60000),
    networkMode: 'offlineFirst' as const,
  },
};

// Mutation configurations
export const mutationConfig = {
  default: {
    retry: false,
    networkMode: 'offlineFirst' as const,
  },

  critical: {
    retry: 1,
    retryDelay: 1000,
    networkMode: 'online' as const,
  },

  optimistic: {
    retry: false,
    networkMode: 'offlineFirst' as const,
    onMutate: async () => {
      // Cancel outgoing refetches
      // await queryClient.cancelQueries();
    },
    onError: (error: unknown) => {
      // Rollback optimistic update
    },
  },
};

// Environment-specific configurations
export const envConfig = {
  development: {
    ...queryConfig.default,
    staleTime: 1000 * 60, // 1 minute in dev
    gcTime: 1000 * 60 * 10, // 10 minutes in dev
    refetchOnWindowFocus: true, // Enable in dev for debugging
  },

  production: {
    ...queryConfig.default,
    // Production defaults are already optimal
  },

  test: {
    ...queryConfig.default,
    staleTime: 0, // No caching in tests
    gcTime: 0,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    refetchOnMount: false,
    retry: false,
    networkMode: 'online' as const,
  },
};

// Get configuration based on type
export function getQueryConfig(
  type: keyof typeof queryConfig = 'default',
  env: keyof typeof envConfig = 'production'
) {
  if (env !== 'production') {
    return envConfig[env];
  }
  return queryConfig[type];
}

// Get mutation configuration
export function getMutationConfig(
  type: keyof typeof mutationConfig = 'default'
) {
  return mutationConfig[type];
}

// Query-specific configurations
export const querySpecificConfig = {
  // Animals
  animals: getQueryConfig('userContent'),
  animalDetail: getQueryConfig('static'),
  
  // Milk logs
  milkLogs: getQueryConfig('userContent'),
  milkStats: getQueryConfig('analytics'),
  
  // Health records
  healthRecords: getQueryConfig('userContent'),
  healthRecordDetail: getQueryConfig('static'),
  
  // Breeding records
  breedingRecords: getQueryConfig('userContent'),
  
  // Financial data
  expenses: getQueryConfig('userContent'),
  sales: getQueryConfig('userContent'),
  
  // User data
  userProfile: getQueryConfig('static'),
  userSettings: getQueryConfig('static'),
  
  // Notifications
  notifications: getQueryConfig('realtime'),
  
  // Analytics
  analytics: getQueryConfig('analytics'),
  
  // Search
  search: getQueryConfig('search'),
  
  // File operations
  upload: getQueryConfig('upload'),
  
  // Background sync
  sync: getQueryConfig('backgroundSync'),
};

// Helper to merge configurations
export function mergeConfig<T extends Record<string, unknown>>(
  base: T,
  overrides: Partial<T>
): T {
  return { ...base, ...overrides };
}

// Presets for common patterns
export const presets = {
  // Infinite scroll with background refetch
  infiniteScroll: {
    ...getQueryConfig('userContent'),
    initialPageParam: 0,
    getNextPageParam: (lastPage: any, allPages: any) => {
      if (lastPage.hasMore) {
        return allPages.length;
      }
      return undefined;
    },
  },

  // Real-time subscription
  subscription: {
    ...getQueryConfig('realtime'),
    refetchInterval: 1000 * 30, // Refetch every 30 seconds
  },

  // Cached with manual refresh
  cachedManual: {
    ...getQueryConfig('static'),
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  },

  // Optimistic updates
  optimistic: {
    ...getQueryConfig('userContent'),
    // onMutate and onError should be implemented in the hook
  },
};