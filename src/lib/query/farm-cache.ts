/**
 * Shared farm query prefixes for TanStack Query invalidation.
 * Prefer prefix invalidation so list/detail/filter variants all refresh.
 */
export const farmQueryKeys = {
  animals: ['animals'] as const,
  animalCount: ['animal-count'] as const,
  milkLogs: ['milk-logs'] as const,
  milkSummary: ['milk-summary'] as const,
  milk: ['milk'] as const,
  dashboardStats: ['dashboard-stats'] as const,
} as const;

export type QueryClientLike = {
  invalidateQueries: (filters: { queryKey: readonly unknown[] }) => Promise<unknown>;
};

/** After creating/updating/deleting an animal */
export async function invalidateAnimalQueries(queryClient: QueryClientLike) {
  await Promise.all([
    queryClient.invalidateQueries({ queryKey: farmQueryKeys.animals }),
    queryClient.invalidateQueries({ queryKey: farmQueryKeys.animalCount }),
    queryClient.invalidateQueries({ queryKey: farmQueryKeys.dashboardStats }),
  ]);
}

/** After creating/updating a milk log */
export async function invalidateMilkQueries(queryClient: QueryClientLike) {
  await Promise.all([
    queryClient.invalidateQueries({ queryKey: farmQueryKeys.milkLogs }),
    queryClient.invalidateQueries({ queryKey: farmQueryKeys.milkSummary }),
    queryClient.invalidateQueries({ queryKey: farmQueryKeys.milk }),
    queryClient.invalidateQueries({ queryKey: farmQueryKeys.dashboardStats }),
  ]);
}
