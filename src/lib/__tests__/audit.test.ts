/**
 * Unit Tests for Audit Logging
 */

import {
  logAuditEvent,
  logUserLogin,
  logUserLogout,
  logCreate,
  logUpdate,
  logDelete,
  logExport,
  getClientIp,
  getUserAgent,
  getAuditLogs,
} from '@/lib/audit';

// Mock Supabase client
jest.mock('@/lib/supabase/server', () => ({
  getSupabaseClient: jest.fn(() => ({
    from: jest.fn(() => ({
      insert: jest.fn().mockResolvedValue({ error: null }),
    })),
  })),
}));

describe('Audit Logging', () => {
  const mockTenantId = 'tenant-123';
  const mockUserId = 'user-123';
  const mockIpAddress = '192.168.1.1';
  const mockUserAgent = 'Mozilla/5.0';

  describe('logAuditEvent', () => {
    it('should log audit event successfully', async () => {
      await expect(
        logAuditEvent({
          tenantId: mockTenantId,
          userId: mockUserId,
          action: 'create',
          resource: 'animal',
          resourceId: 'animal-123',
          details: { tag: 'TAG001' },
          ipAddress: mockIpAddress,
          userAgent: mockUserAgent,
        })
      ).resolves.not.toThrow();
    });

    it('should handle database errors gracefully', async () => {
      const { getSupabaseClient } = require('@/lib/supabase/server');
      getSupabaseClient.mockImplementationOnce(() => ({
        from: jest.fn(() => ({
          insert: jest.fn().mockRejectedValue(new Error('Database error')),
        })),
      }));

      await expect(
        logAuditEvent({
          tenantId: mockTenantId,
          userId: mockUserId,
          action: 'create',
          resource: 'animal',
        })
      ).resolves.not.toThrow();
    });
  });

  describe('logUserLogin', () => {
    it('should log user login', async () => {
      await expect(
        logUserLogin({
          userId: mockUserId,
          tenantId: mockTenantId,
          ipAddress: mockIpAddress,
          userAgent: mockUserAgent,
        })
      ).resolves.not.toThrow();
    });
  });

  describe('logUserLogout', () => {
    it('should log user logout', async () => {
      await expect(
        logUserLogout({
          userId: mockUserId,
          tenantId: mockTenantId,
          ipAddress: mockIpAddress,
          userAgent: mockUserAgent,
        })
      ).resolves.not.toThrow();
    });
  });

  describe('logCreate', () => {
    it('should log create operation', async () => {
      await expect(
        logCreate({
          tenantId: mockTenantId,
          userId: mockUserId,
          resource: 'animal',
          resourceId: 'animal-123',
          details: { tag: 'TAG001' },
          ipAddress: mockIpAddress,
          userAgent: mockUserAgent,
        })
      ).resolves.not.toThrow();
    });
  });

  describe('logUpdate', () => {
    it('should log update operation with changes', async () => {
      await expect(
        logUpdate({
          tenantId: mockTenantId,
          userId: mockUserId,
          resource: 'animal',
          resourceId: 'animal-123',
          changes: {
            status: { from: 'active', to: 'sold' },
          },
          ipAddress: mockIpAddress,
          userAgent: mockUserAgent,
        })
      ).resolves.not.toThrow();
    });
  });

  describe('logDelete', () => {
    it('should log delete operation', async () => {
      await expect(
        logDelete({
          tenantId: mockTenantId,
          userId: mockUserId,
          resource: 'animal',
          resourceId: 'animal-123',
          ipAddress: mockIpAddress,
          userAgent: mockUserAgent,
        })
      ).resolves.not.toThrow();
    });
  });

  describe('logExport', () => {
    it('should log export operation', async () => {
      await expect(
        logExport({
          tenantId: mockTenantId,
          userId: mockUserId,
          resource: 'animals',
          details: { format: 'csv', recordCount: 100 },
          ipAddress: mockIpAddress,
          userAgent: mockUserAgent,
        })
      ).resolves.not.toThrow();
    });
  });

  describe('getClientIp', () => {
    it('should extract IP from x-forwarded-for header', () => {
      const request = {
        headers: {
          get: (name: string) => {
            if (name === 'x-forwarded-for') return '192.168.1.1, 10.0.0.1';
            return null;
          },
        },
      } as Request;

      const ip = getClientIp(request);
      expect(ip).toBe('192.168.1.1');
    });

    it('should extract IP from x-real-ip header', () => {
      const request = {
        headers: {
          get: (name: string) => {
            if (name === 'x-real-ip') return '192.168.1.1';
            return null;
          },
        },
      } as Request;

      const ip = getClientIp(request);
      expect(ip).toBe('192.168.1.1');
    });

    it('should return anonymous if no IP found', () => {
      const request = {
        headers: {
          get: () => null,
        },
      } as Request;

      const ip = getClientIp(request);
      expect(ip).toBe('anonymous');
    });
  });

  describe('getUserAgent', () => {
    it('should extract user agent from headers', () => {
      const request = {
        headers: {
          get: (name: string) => {
            if (name === 'user-agent') return 'Mozilla/5.0';
            return null;
          },
        },
      } as Request;

      const userAgent = getUserAgent(request);
      expect(userAgent).toBe('Mozilla/5.0');
    });

    it('should return unknown if no user agent found', () => {
      const request = {
        headers: {
          get: () => null,
        },
      } as Request;

      const userAgent = getUserAgent(request);
      expect(userAgent).toBe('unknown');
    });
  });

  describe('getAuditLogs', () => {
    it('should get audit logs for tenant', async () => {
      const { getSupabaseClient } = require('@/lib/supabase/server');
      getSupabaseClient.mockImplementationOnce(() => ({
        from: jest.fn(() => ({
          select: jest.fn(() => ({
            count: 'exact',
            eq: jest.fn(() => ({
              order: jest.fn(() => ({
                range: jest.fn().mockResolvedValue({
                  data: [],
                  count: 0,
                  error: null,
                }),
              })),
            })),
          })),
        })),
      }));

      const result = await getAuditLogs({
        tenantId: mockTenantId,
        limit: 50,
        offset: 0,
      });

      expect(result).toEqual({
        logs: [],
        total: 0,
      });
    });

    it('should handle database errors', async () => {
      const { getSupabaseClient } = require('@/lib/supabase/server');
      getSupabaseClient.mockImplementationOnce(() => ({
        from: jest.fn(() => ({
          select: jest.fn(() => ({
            count: 'exact',
            eq: jest.fn(() => ({
              order: jest.fn(() => ({
                range: jest.fn().mockRejectedValue(new Error('Database error')),
              })),
            })),
          })),
        })),
      }));

      await expect(
        getAuditLogs({
          tenantId: mockTenantId,
        })
      ).rejects.toThrow('Failed to fetch audit logs');
    });
  });
});
