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
  healthRecords: ['health-records'] as const,
  breedingRecords: ['breeding-records'] as const,
  pregnantAnimals: ['pregnant-animals'] as const,
  semenInventory: ['semen-inventory'] as const,
  expenses: ['expenses'] as const,
  sales: ['sales'] as const,
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

/** After creating/updating/deleting a health record */
export async function invalidateHealthQueries(queryClient: QueryClientLike) {
  await Promise.all([
    queryClient.invalidateQueries({ queryKey: farmQueryKeys.healthRecords }),
    queryClient.invalidateQueries({ queryKey: farmQueryKeys.dashboardStats }),
  ]);
}

/** After creating/updating/deleting a breeding record */
export async function invalidateBreedingQueries(queryClient: QueryClientLike) {
  await Promise.all([
    queryClient.invalidateQueries({ queryKey: farmQueryKeys.breedingRecords }),
    queryClient.invalidateQueries({ queryKey: farmQueryKeys.pregnantAnimals }),
    queryClient.invalidateQueries({ queryKey: farmQueryKeys.semenInventory }),
    queryClient.invalidateQueries({ queryKey: farmQueryKeys.dashboardStats }),
  ]);
}

/** After creating expenses or sales */
export async function invalidateFinanceQueries(queryClient: QueryClientLike) {
  await Promise.all([
    queryClient.invalidateQueries({ queryKey: farmQueryKeys.expenses }),
    queryClient.invalidateQueries({ queryKey: farmQueryKeys.sales }),
    queryClient.invalidateQueries({ queryKey: farmQueryKeys.dashboardStats }),
  ]);
}
