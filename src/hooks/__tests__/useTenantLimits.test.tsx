import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useTenantLimits } from '../useTenantLimits';
import * as limitsUtils from '@/lib/utils/limits';

// Mock the TenantProvider
jest.mock('@/components/tenant/TenantProvider', () => ({
  useTenantContext: jest.fn(() => ({
    limits: {
      maxAnimals: 10,
      maxUsers: 5,
      features: ['reports'],
    },
    tenantId: 'test-tenant',
  })),
}));

// Mock fetch
global.fetch = jest.fn();

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
};

describe('useTenantLimits', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({ count: 5 }),
    });
  });

  it('should return limits and counts', async () => {
    const { result } = renderHook(() => useTenantLimits(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.limits).toBeDefined();
      expect(result.current.animalCount).toBe(5);
    });
  });

  it('should call canAddAnimal with correct parameters', async () => {
    const canAddAnimalSpy = jest.spyOn(limitsUtils, 'canAddAnimal');

    const { result } = renderHook(() => useTenantLimits(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.canAddAnimal).toBeDefined();
    });

    expect(canAddAnimalSpy).toHaveBeenCalled();
  });

  it('should fetch animal count', async () => {
    const { result } = renderHook(() => useTenantLimits(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith('/api/animals/count');
      expect(result.current.animalCount).toBe(5);
    });
  });

  it('should fetch user count', async () => {
    const { result } = renderHook(() => useTenantLimits(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith('/api/users/count');
      expect(result.current.userCount).toBe(5);
    });
  });

  it('should handle API errors gracefully', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: false,
    });

    const { result } = renderHook(() => useTenantLimits(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.animalCount).toBe(0);
      expect(result.current.userCount).toBe(0);
    });
  });

  it('should provide hasFeature function', async () => {
    const hasFeatureSpy = jest.spyOn(limitsUtils, 'hasFeature');

    const { result } = renderHook(() => useTenantLimits(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.hasFeature).toBeDefined();
    });

    result.current.hasFeature('reports');
    expect(hasFeatureSpy).toHaveBeenCalled();
  });
});
