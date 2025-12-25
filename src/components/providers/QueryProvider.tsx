'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState, useCallback } from 'react';
import { toast } from 'sonner';

// Query keys for type-safe invalidation
export const queryKeys = {
  animals: {
    all: ['animals'] as const,
    list: () => [...queryKeys.animals.all, 'list'] as const,
    detail: (id: string) => [...queryKeys.animals.all, 'detail', id] as const,
    count: () => [...queryKeys.animals.all, 'count'] as const,
  },
  milk: {
    all: ['milk'] as const,
    list: (params?: Record<string, string>) => [...queryKeys.milk.all, 'list', params] as const,
    stats: (days?: number) => [...queryKeys.milk.all, 'stats', days] as const,
  },
  health: {
    all: ['health'] as const,
    records: (animalId?: string) => [...queryKeys.health.all, 'records', animalId] as const,
    detail: (id: string) => [...queryKeys.health.all, 'detail', id] as const,
  },
  breeding: {
    all: ['breeding'] as const,
    list: () => [...queryKeys.breeding.all, 'list'] as const,
    detail: (id: string) => [...queryKeys.breeding.all, 'detail', id] as const,
  },
  user: {
    all: ['user'] as const,
    farms: () => [...queryKeys.user.all, 'farms'] as const,
    permissions: (userId: string, tenantId: string) => 
      [...queryKeys.user.all, 'permissions', userId, tenantId] as const,
  },
  tenant: {
    all: ['tenant'] as const,
    config: () => [...queryKeys.tenant.all, 'config'] as const,
    limits: () => [...queryKeys.tenant.all, 'limits'] as const,
    customFields: () => [...queryKeys.tenant.all, 'custom-fields'] as const,
  },
  eggs: {
    all: ['eggs'] as const,
    list: (date?: string) => [...queryKeys.eggs.all, 'list', date] as const,
  },
} as const;

// Error handler for queries
function handleQueryError(error: unknown) {
  const message = error instanceof Error ? error.message : 'An error occurred';
  
  // Don't show toast for certain errors (like 401 which will redirect)
  if (message.includes('Unauthorized') || message.includes('401')) {
    return;
  }
  
  toast.error('Error', {
    description: message,
    duration: 5000,
  });
}

// Retry logic - don't retry on certain errors
function shouldRetry(failureCount: number, error: unknown): boolean {
  // Don't retry more than 2 times
  if (failureCount >= 2) return false;
  
  // Don't retry on auth errors or validation errors
  if (error instanceof Error) {
    const message = error.message.toLowerCase();
    if (
      message.includes('unauthorized') ||
      message.includes('forbidden') ||
      message.includes('validation') ||
      message.includes('not found')
    ) {
      return false;
    }
  }
  
  return true;
}

export function QueryProvider({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            // Data freshness
            staleTime: 1000 * 60 * 5, // 5 minutes - data is fresh for 5 mins
            gcTime: 1000 * 60 * 30, // 30 minutes - cache kept for 30 mins (formerly cacheTime)
            
            // Refetch behavior
            refetchOnWindowFocus: false, // Don't refetch when window regains focus
            refetchOnReconnect: true, // Refetch when network reconnects
            refetchOnMount: true, // Refetch when component mounts if stale
            
            // Retry configuration
            retry: shouldRetry,
            retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
            
            // Network mode
            networkMode: 'offlineFirst', // Return cached data even when offline
          },
          mutations: {
            // Mutations shouldn't retry by default
            retry: false,
            
            // Show error toast on mutation failure
            onError: handleQueryError,
            
            networkMode: 'offlineFirst',
          },
        },
      })
  );

  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}

// Custom hook for prefetching data
export function usePrefetch() {
  const [queryClient] = useState(() => new QueryClient());
  
  const prefetchAnimals = useCallback(() => {
    queryClient.prefetchQuery({
      queryKey: queryKeys.animals.list(),
      queryFn: () => fetch('/api/animals').then(res => res.json()),
      staleTime: 1000 * 60 * 5,
    });
  }, [queryClient]);

  const prefetchAnimal = useCallback((id: string) => {
    queryClient.prefetchQuery({
      queryKey: queryKeys.animals.detail(id),
      queryFn: () => fetch(`/api/animals/${id}`).then(res => res.json()),
      staleTime: 1000 * 60 * 5,
    });
  }, [queryClient]);

  return {
    prefetchAnimals,
    prefetchAnimal,
  };
}
