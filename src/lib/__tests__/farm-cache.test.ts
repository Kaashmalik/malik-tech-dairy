import {
  invalidateAnimalQueries,
  invalidateMilkQueries,
  invalidateHealthQueries,
  invalidateBreedingQueries,
  invalidateFinanceQueries,
  farmQueryKeys,
} from '@/lib/query/farm-cache';

describe('farm-cache invalidation helpers', () => {
  it('invalidates animal list, count, and dashboard prefixes', async () => {
    const calls: unknown[][] = [];
    const queryClient = {
      invalidateQueries: jest.fn(async ({ queryKey }: { queryKey: readonly unknown[] }) => {
        calls.push([...queryKey]);
      }),
    };

    await invalidateAnimalQueries(queryClient);

    expect(calls).toEqual([
      [...farmQueryKeys.animals],
      [...farmQueryKeys.animalCount],
      [...farmQueryKeys.dashboardStats],
    ]);
  });

  it('invalidates milk list, summary, milk, and dashboard prefixes', async () => {
    const calls: unknown[][] = [];
    const queryClient = {
      invalidateQueries: jest.fn(async ({ queryKey }: { queryKey: readonly unknown[] }) => {
        calls.push([...queryKey]);
      }),
    };

    await invalidateMilkQueries(queryClient);

    expect(calls).toEqual([
      [...farmQueryKeys.milkLogs],
      [...farmQueryKeys.milkSummary],
      [...farmQueryKeys.milk],
      [...farmQueryKeys.dashboardStats],
    ]);
  });

  it('invalidates health records and dashboard', async () => {
    const calls: unknown[][] = [];
    const queryClient = {
      invalidateQueries: jest.fn(async ({ queryKey }: { queryKey: readonly unknown[] }) => {
        calls.push([...queryKey]);
      }),
    };

    await invalidateHealthQueries(queryClient);

    expect(calls).toEqual([[...farmQueryKeys.healthRecords], [...farmQueryKeys.dashboardStats]]);
  });

  it('invalidates breeding, pregnancy, semen, and dashboard', async () => {
    const calls: unknown[][] = [];
    const queryClient = {
      invalidateQueries: jest.fn(async ({ queryKey }: { queryKey: readonly unknown[] }) => {
        calls.push([...queryKey]);
      }),
    };

    await invalidateBreedingQueries(queryClient);

    expect(calls).toEqual([
      [...farmQueryKeys.breedingRecords],
      [...farmQueryKeys.pregnantAnimals],
      [...farmQueryKeys.semenInventory],
      [...farmQueryKeys.dashboardStats],
    ]);
  });

  it('invalidates expenses, sales, and dashboard', async () => {
    const calls: unknown[][] = [];
    const queryClient = {
      invalidateQueries: jest.fn(async ({ queryKey }: { queryKey: readonly unknown[] }) => {
        calls.push([...queryKey]);
      }),
    };

    await invalidateFinanceQueries(queryClient);

    expect(calls).toEqual([
      [...farmQueryKeys.expenses],
      [...farmQueryKeys.sales],
      [...farmQueryKeys.dashboardStats],
    ]);
  });
});
