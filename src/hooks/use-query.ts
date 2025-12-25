/**
 * Enhanced Query Hooks
 * Provides optimized and reusable query hooks for common operations
 */

import { useQuery, useMutation, useQueryClient, useInfiniteQuery } from '@tanstack/react-query';
import { queryKeys } from '@/components/providers/QueryProvider';
import { useCallback } from 'react';

// Generic query hook with error handling
export function useApiQuery<T>(
  queryKey: readonly unknown[],
  queryFn: () => Promise<T>,
  options?: {
    staleTime?: number;
    gcTime?: number;
    enabled?: boolean;
    refetchOnWindowFocus?: boolean;
    suspense?: boolean;
  }
) {
  return useQuery({
    queryKey,
    queryFn: async () => {
      return await queryFn();
    },
    staleTime: options?.staleTime ?? 1000 * 60 * 5, // 5 minutes default
    gcTime: options?.gcTime ?? 1000 * 60 * 30, // 30 minutes default
    enabled: options?.enabled ?? true,
    refetchOnWindowFocus: options?.refetchOnWindowFocus ?? false,
    ...options,
  });
}

// Generic mutation hook with optimistic updates
export function useApiMutation<TData, TVariables>(
  mutationFn: (variables: TVariables) => Promise<TData>,
  options?: {
    onSuccess?: (data: TData, variables: TVariables) => void;
    onError?: (error: unknown, variables: TVariables) => void;
    onMutate?: (variables: TVariables) => Promise<unknown> | unknown;
    invalidateQueries?: readonly unknown[][];
    updateQuery?: (queryKey: readonly unknown[], oldData: unknown, newData: TData) => unknown;
  }
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (variables) => {
      return await mutationFn(variables);
    },
    onMutate: async (variables) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries();
      
      // Call custom onMutate
      if (options?.onMutate) {
        await options.onMutate(variables);
      }
    },
    onSuccess: (data, variables) => {
      // Invalidate specified queries
      if (options?.invalidateQueries) {
        options.invalidateQueries.forEach(queryKey => {
          queryClient.invalidateQueries({ queryKey });
        });
      }
      
      // Call custom onSuccess
      if (options?.onSuccess) {
        options.onSuccess(data, variables);
      }
    },
    onError: options?.onError,
  });
}

// Infinite scroll hook
export function useApiInfiniteQuery<T>(
  queryKey: readonly unknown[],
  queryFn: ({ pageParam }: { pageParam: unknown }) => Promise<{
    data: T[];
    nextCursor?: unknown;
    hasMore?: boolean;
  }>,
  options?: {
    enabled?: boolean;
    staleTime?: number;
  }
) {
  return useInfiniteQuery({
    queryKey,
    queryFn: async ({ pageParam }) => {
      return await queryFn({ pageParam });
    },
    initialPageParam: undefined,
    getNextPageParam: (lastPage: { data: T[]; nextCursor?: unknown; hasMore?: boolean }) => {
      return lastPage.nextCursor ?? (lastPage.hasMore ? true : undefined);
    },
    staleTime: options?.staleTime ?? 1000 * 60 * 5,
    enabled: options?.enabled ?? true,
  });
}

// Prefetch hook
export function usePrefetch() {
  const queryClient = useQueryClient();

  const prefetch = useCallback((
    queryKey: readonly unknown[],
    queryFn: () => Promise<unknown>,
    options?: { staleTime?: number }
  ) => {
    queryClient.prefetchQuery({
      queryKey,
      queryFn: async () => {
        return await queryFn();
      },
      staleTime: options?.staleTime ?? 1000 * 60 * 5,
    });
  }, [queryClient]);

  return { prefetch };
}

// Optimistic update helper
export function useOptimisticUpdate<T>(
  queryKey: readonly unknown[],
  updateFn: (oldData: T | undefined, variables: unknown) => T
) {
  const queryClient = useQueryClient();

  return useCallback((variables: unknown) => {
    queryClient.setQueryData(queryKey, (oldData: T | undefined) => 
      updateFn(oldData, variables)
    );
  }, [queryClient, queryKey, updateFn]);
}

// Background refetch hook
export function useBackgroundRefetch(
  queryKey: readonly unknown[],
  interval: number = 1000 * 60 * 5 // 5 minutes default
) {
  const queryClient = useQueryClient();

  React.useEffect(() => {
    const intervalId = setInterval(() => {
      queryClient.invalidateQueries({ queryKey });
    }, interval);

    return () => clearInterval(intervalId);
  }, [queryClient, queryKey, interval]);
}

// Query invalidation hook
export function useInvalidateQueries() {
  const queryClient = useQueryClient();

  return useCallback((queryKeys: readonly unknown[][]) => {
    queryKeys.forEach(key => {
      queryClient.invalidateQueries({ queryKey: key });
    });
  }, [queryClient]);
}

// Reset queries hook
export function useResetQueries() {
  const queryClient = useQueryClient();

  return useCallback((queryKeys?: readonly unknown[][]) => {
    if (queryKeys) {
      queryKeys.forEach(key => {
        queryClient.resetQueries({ queryKey: key });
      });
    } else {
      queryClient.resetQueries();
    }
  }, [queryClient]);
}

// Specific hooks for common operations
export function useAnimals(options?: { enabled?: boolean }) {
  return useApiQuery(
    queryKeys.animals.list(),
    () => fetch('/api/animals').then(res => res.json()),
    options
  );
}

export function useAnimal(id: string, options?: { enabled?: boolean }) {
  return useApiQuery(
    queryKeys.animals.detail(id),
    () => fetch(`/api/animals/${id}`).then(res => res.json()),
    options
  );
}

export function useCreateAnimal() {
  return useApiMutation(
    (data: unknown) => 
      fetch('/api/animals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      }).then(res => res.json()),
    {
      invalidateQueries: [[...queryKeys.animals.all]],
    }
  );
}

export function useUpdateAnimal() {
  return useApiMutation(
    ({ id, data }: { id: string; data: unknown }) => 
      fetch(`/api/animals/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      }).then(res => res.json()),
    {
      invalidateQueries: [[...queryKeys.animals.all]],
    }
  );
}

export function useDeleteAnimal() {
  return useApiMutation(
    (id: string) => 
      fetch(`/api/animals/${id}`, {
        method: 'DELETE',
      }).then(res => res.json()),
    {
      invalidateQueries: [[...queryKeys.animals.all]],
    }
  );
}

export function useMilkLogs(params?: Record<string, string>) {
  return useApiQuery(
    queryKeys.milk.list(params),
    () => {
      const searchParams = new URLSearchParams(params);
      return fetch(`/api/milk?${searchParams}`).then(res => res.json());
    }
  );
}

export function useCreateMilkLog() {
  return useApiMutation(
    (data: unknown) => 
      fetch('/api/milk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      }).then(res => res.json()),
    {
      invalidateQueries: [[...queryKeys.milk.all]],
    }
  );
}

export function useHealthRecords(animalId?: string) {
  return useApiQuery(
    queryKeys.health.records(animalId),
    () => {
      const url = animalId ? `/api/health/records?animalId=${animalId}` : '/api/health/records';
      return fetch(url).then(res => res.json());
    }
  );
}

export function useCreateHealthRecord() {
  return useApiMutation(
    (data: unknown) => 
      fetch('/api/health/records', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      }).then(res => res.json()),
    {
      invalidateQueries: [[...queryKeys.health.all]],
    }
  );
}

export function useBreedingRecords() {
  return useApiQuery(
    queryKeys.breeding.list(),
    () => fetch('/api/breeding').then(res => res.json())
  );
}

export function useCreateBreedingRecord() {
  return useApiMutation(
    (data: unknown) => 
      fetch('/api/breeding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      }).then(res => res.json()),
    {
      invalidateQueries: [[...queryKeys.breeding.all]],
    }
  );
}

// React import for useEffect
import React from 'react';
