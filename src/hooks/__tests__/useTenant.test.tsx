import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useTenant } from '@/hooks/useTenant';

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

describe('useTenant', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should fetch tenant config successfully', async () => {
    const mockConfig = {
      farmName: 'Test Farm',
      farmAddress: '123 Test St',
      primaryColor: '#1F7A3D',
      secondaryColor: '#2E8B57',
      logoUrl: 'https://example.com/logo.png',
      language: 'en',
      animalTypes: ['cow', 'buffalo'],
    };

    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => mockConfig,
    });

    const { result } = renderHook(() => useTenant(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.config).toEqual(mockConfig);
    expect(result.current.error).toBe(null);
  });

  it('should handle fetch error', async () => {
    (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

    const { result } = renderHook(() => useTenant(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.config).toBe(null);
    expect(result.current.error).toBeTruthy();
  });

  it('should handle non-ok response', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      status: 404,
    });

    const { result } = renderHook(() => useTenant(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.config).toBe(null);
  });
});
