import {
  invalidateAnimalQueries,
  invalidateMilkQueries,
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
});
