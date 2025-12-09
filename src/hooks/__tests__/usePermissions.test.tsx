import { renderHook } from '@testing-library/react';
import { usePermissions } from '@/hooks/usePermissions';

// Mock useTenantContext
jest.mock('@/components/tenant/TenantProvider', () => ({
  useTenantContext: jest.fn(),
}));

// Mock useUser from Clerk
jest.mock('@clerk/nextjs', () => ({
  useUser: jest.fn(),
}));

// Mock Firebase
jest.mock('firebase/firestore', () => ({
  doc: jest.fn(),
  getDoc: jest.fn(),
}));

jest.mock('@/lib/firebase/client', () => ({
  db: {},
}));

import { useTenantContext } from '@/components/tenant/TenantProvider';
import { useUser } from '@clerk/nextjs';
import { getDoc } from 'firebase/firestore';

describe('usePermissions', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return permissions structure', () => {
    (useTenantContext as jest.Mock).mockReturnValue({
      tenantId: 'tenant123',
    });

    (useUser as jest.Mock).mockReturnValue({
      user: { id: 'user123' },
    });

    (getDoc as jest.Mock).mockResolvedValue({
      exists: () => false,
    });

    const { result } = renderHook(() => usePermissions());

    // Verify structure exists
    expect(result.current).toHaveProperty('userRole');
    expect(result.current).toHaveProperty('loading');
    expect(result.current).toHaveProperty('hasPermission');
    expect(result.current).toHaveProperty('hasRole');
    expect(result.current).toHaveProperty('canAccessModule');
    expect(result.current).toHaveProperty('isSuperAdmin');
    expect(result.current).toHaveProperty('isOwner');
    expect(result.current).toHaveProperty('isManager');
  });
});
