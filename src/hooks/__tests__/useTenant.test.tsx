import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useTenant } from '@/hooks/useTenant';

// Mock the TenantProvider
const mockTenantContext = {
  tenantId: 'test-tenant-id',
  tenantSlug: 'test-tenant',
  config: {
    farmName: 'Test Farm',
    farmAddress: '123 Test St',
    primaryColor: '#1F7A3D',
    secondaryColor: '#2E8B57',
    logoUrl: 'https://example.com/logo.png',
    language: 'en',
    animalTypes: ['cow', 'buffalo'],
  },
  limits: {
    maxAnimals: 100,
    maxUsers: 10,
    features: [],
  },
  isLoading: false,
  refetch: jest.fn(),
};

jest.mock('@/components/tenant/TenantProvider', () => ({
  useTenantContext: jest.fn(() => mockTenantContext),
}));

// Mock Clerk - this is also in jest.setup but we need to ensure it's applied
jest.mock('@clerk/nextjs', () => ({
  useAuth: jest.fn(() => ({
    userId: 'test-user-id',
    isLoaded: true,
  })),
  useOrganization: jest.fn(() => ({
    organization: {
      id: 'test-org-id',
      slug: 'test-org',
      name: 'Test Organization',
    },
    isLoaded: true,
  })),
  useUser: jest.fn(() => ({
    user: {
      id: 'test-user-id',
      firstName: 'Test',
      lastName: 'User',
      emailAddresses: [{ emailAddress: 'test@example.com' }],
    },
    isLoaded: true,
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

describe('useTenant', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return tenant data from context', async () => {
    const { result } = renderHook(() => useTenant(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.tenant).toBeDefined();
    expect(result.current.tenant?.farmName).toBe('Test Farm');
    expect(result.current.tenantId).toBe('test-org-id');
  });

  it('should return tenantSlug from organization', async () => {
    const { result } = renderHook(() => useTenant(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.tenantSlug).toBe('test-org');
  });

  it('should return isLoaded when both context and org are loaded', async () => {
    const { result } = renderHook(() => useTenant(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isLoaded).toBe(true);
    });
  });

  it('should handle loading state', async () => {
    // Import and update mock to simulate loading
    const { useTenantContext } = require('@/components/tenant/TenantProvider');
    useTenantContext.mockReturnValueOnce({
      ...mockTenantContext,
      isLoading: true,
    });

    const { result } = renderHook(() => useTenant(), {
      wrapper: createWrapper(),
    });

    expect(result.current.isLoading).toBe(true);
  });
});
