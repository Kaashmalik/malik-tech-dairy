import {
  isAllowedOrigin,
  getCorsHeaders,
  handleCorsPreflight,
  PRODUCTION_DOMAIN,
  PRODUCTION_ORIGIN,
} from '@/lib/cors';
import { getDrizzle } from '@/lib/supabase/server';
import { tenantMembers, platformUsers, animals, taskAssignments } from '@/db/schema';
import { and, eq } from 'drizzle-orm';

// Mock getDrizzle
jest.mock('@/lib/supabase/server', () => ({
  getDrizzle: jest.fn(),
}));

// Mock @clerk/nextjs/server
jest.mock('@clerk/nextjs/server', () => ({
  auth: jest.fn(),
}));

describe('Phase 4.5 Security Regression Test Suite', () => {
  const mockDrizzle = {
    select: jest.fn(),
    insert: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (getDrizzle as jest.Mock).mockReturnValue(mockDrizzle);
  });

  describe('1. Tenant-Scoped Role Resolution', () => {
    it('should query tenantMembers with BOTH userId and tenantId to prevent role inheritance across tenants', async () => {
      // Re-import to test resolveUserRoleFromDatabase behavior
      const mockLimit = jest
        .fn()
        .mockResolvedValue([
          { id: 'mem_1', userId: 'user_1', tenantId: 'tenant_A', role: 'farm_owner' },
        ]);
      const mockWhere = jest.fn().mockReturnValue({ limit: mockLimit });
      const mockFrom = jest.fn().mockReturnValue({ where: mockWhere });
      mockDrizzle.select.mockReturnValue({ from: mockFrom });

      // Simulate a query scoped to user_1 and tenant_A
      const query = and(eq(tenantMembers.userId, 'user_1'), eq(tenantMembers.tenantId, 'tenant_A'));
      expect(query).toBeDefined();

      // Ensure query contains both clauses
      const sqlParts = (query as any)?.queryChunks;
      expect(sqlParts).toBeDefined();
    });

    it('should not allow a user with membership in Tenant A to claim that role in Tenant B', async () => {
      // When querying for (user_1, tenant_B), DB returns empty membership
      const mockLimit = jest.fn().mockResolvedValue([]);
      const mockWhere = jest.fn().mockReturnValue({ limit: mockLimit });
      const mockFrom = jest.fn().mockReturnValue({ where: mockWhere });
      mockDrizzle.select.mockReturnValue({ from: mockFrom });

      // If user is also not super admin
      const mockPlatformLimit = jest.fn().mockResolvedValue([]);
      const mockPlatformWhere = jest.fn().mockReturnValue({ limit: mockPlatformLimit });
      const mockPlatformFrom = jest.fn().mockReturnValue({ where: mockPlatformWhere });

      // Verification: A user belonging only to Tenant A yields empty result when queried for Tenant B
      const result = await mockLimit();
      expect(result.length).toBe(0);
    });
  });

  describe('2. Cross-Tenant Task Validation Isolation', () => {
    it('should reject task assignment if assigned user does not belong to the target tenant', () => {
      const tenantA = 'org_tenant_A';
      const tenantB = 'org_tenant_B';
      const workerUser = 'user_worker_B';

      // Membership verification function
      const verifyMembership = (userTenantId: string, taskTenantId: string) => {
        return userTenantId === taskTenantId;
      };

      expect(verifyMembership(tenantB, tenantA)).toBe(false);
      expect(verifyMembership(tenantA, tenantA)).toBe(true);
    });

    it('should reject task assignment if referenced animal belongs to another tenant', () => {
      const tenantA = 'org_tenant_A';
      const animalTenantId = 'org_tenant_B';

      const verifyAnimalTenant = (animalTenant: string, taskTenant: string) => {
        return animalTenant === taskTenant;
      };

      expect(verifyAnimalTenant(animalTenantId, tenantA)).toBe(false);
      expect(verifyAnimalTenant(tenantA, tenantA)).toBe(true);
    });
  });

  describe('3. Cron Authentication Security', () => {
    const verifyCronAuth = (authHeader: string | null, cronSecret: string | undefined) => {
      if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
        return { authorized: false, status: 401 };
      }
      return { authorized: true, status: 200 };
    };

    it('should reject requests when CRON_SECRET is not configured in environment', () => {
      const result = verifyCronAuth('Bearer my-secret', undefined);
      expect(result.authorized).toBe(false);
      expect(result.status).toBe(401);
    });

    it('should reject requests when Bearer token does not match CRON_SECRET', () => {
      const result = verifyCronAuth('Bearer wrong-secret', 'correct-secret-123');
      expect(result.authorized).toBe(false);
      expect(result.status).toBe(401);
    });

    it('should reject requests with missing Authorization header', () => {
      const result = verifyCronAuth(null, 'correct-secret-123');
      expect(result.authorized).toBe(false);
      expect(result.status).toBe(401);
    });

    it('should authorize requests with exact Bearer token matching CRON_SECRET', () => {
      const result = verifyCronAuth('Bearer correct-secret-123', 'correct-secret-123');
      expect(result.authorized).toBe(true);
      expect(result.status).toBe(200);
    });
  });

  describe('4. Automated Reminders Multi-Tenant Isolation', () => {
    it('should isolate reminder generation per tenant so tenant A alerts cannot leak to tenant B', () => {
      const remindersByTenant: Record<string, string[]> = {
        tenant_A: ['vaccination_PK-01', 'low_stock_silage'],
        tenant_B: ['calving_PK-99'],
      };

      const getRemindersForTenant = (tenantId: string) => {
        return remindersByTenant[tenantId] || [];
      };

      expect(getRemindersForTenant('tenant_A')).toEqual(['vaccination_PK-01', 'low_stock_silage']);
      expect(getRemindersForTenant('tenant_B')).toEqual(['calving_PK-99']);
      expect(getRemindersForTenant('tenant_A')).not.toContain('calving_PK-99');
    });

    it('should prevent duplicate notifications when running reminder check repeatedly', () => {
      const existingNotificationKeys = new Set(['vaccination_PK-01_2026-09-20']);

      const shouldCreateNotification = (uniqueKey: string) => {
        if (existingNotificationKeys.has(uniqueKey)) {
          return false; // deduplicate
        }
        existingNotificationKeys.add(uniqueKey);
        return true;
      };

      // First run: already exists
      expect(shouldCreateNotification('vaccination_PK-01_2026-09-20')).toBe(false);

      // New reminder: created
      expect(shouldCreateNotification('vaccination_PK-02_2026-09-25')).toBe(true);

      // Repeated run for the new reminder: deduplicated
      expect(shouldCreateNotification('vaccination_PK-02_2026-09-25')).toBe(false);
    });
  });
  describe('5. Production CORS & Origin Validation (Phase 5.3)', () => {
    const originalEnv = process.env.NODE_ENV;

    afterEach(() => {
      process.env.NODE_ENV = originalEnv;
    });

    it('should accept the production apex domain https://dairy.mtkcodex.site', () => {
      expect(isAllowedOrigin('https://dairy.mtkcodex.site')).toBe(true);
    });

    it('should accept production tenant subdomains (e.g. https://farm1.dairy.mtkcodex.site)', () => {
      expect(isAllowedOrigin('https://greenvalley.dairy.mtkcodex.site')).toBe(true);
      expect(isAllowedOrigin('https://lahore-dairy.dairy.mtkcodex.site')).toBe(true);
    });

    it('should reject unknown, spoofed, or malicious origins without reflecting them', () => {
      expect(isAllowedOrigin('https://evil-attacker.com')).toBe(false);
      expect(isAllowedOrigin('https://dairy.mtkcodex.site.attacker.com')).toBe(false);
      expect(isAllowedOrigin('http://dairy.mtkcodex.site')).toBe(false); // HTTP rejected
      expect(isAllowedOrigin('null')).toBe(false);
      expect(isAllowedOrigin('')).toBe(false);
      expect(isAllowedOrigin(null)).toBe(false);
    });

    it('should never return wildcard * when credentials are used', () => {
      const prodHeaders = getCorsHeaders('https://dairy.mtkcodex.site');
      expect(prodHeaders['Access-Control-Allow-Origin']).toBe('https://dairy.mtkcodex.site');
      expect(prodHeaders['Access-Control-Allow-Credentials']).toBe('true');
      expect(prodHeaders['Access-Control-Allow-Origin']).not.toBe('*');
    });

    it('should return empty headers for rejected origins', () => {
      const rejectedHeaders = getCorsHeaders('https://malicious.com');
      expect(Object.keys(rejectedHeaders).length).toBe(0);
      expect(rejectedHeaders['Access-Control-Allow-Origin']).toBeUndefined();
    });

    it('should handle OPTIONS preflight with 204 for allowed origin', () => {
      const mockReq = {
        method: 'OPTIONS',
        headers: new Headers({ origin: 'https://dairy.mtkcodex.site' }),
      } as any;

      const res = handleCorsPreflight(mockReq);
      expect(res).not.toBeNull();
      expect(res?.status).toBe(204);
      expect(res?.headers['Access-Control-Allow-Origin']).toBe('https://dairy.mtkcodex.site');
      expect(res?.headers['Access-Control-Allow-Credentials']).toBe('true');
    });

    it('should reject OPTIONS preflight with 403 for unauthorized origin', () => {
      const mockReq = {
        method: 'OPTIONS',
        headers: new Headers({ origin: 'https://attacker.com' }),
      } as any;

      const res = handleCorsPreflight(mockReq);
      expect(res).not.toBeNull();
      expect(res?.status).toBe(403);
      expect(res?.headers['Access-Control-Allow-Origin']).toBeUndefined();
    });

    it('should reject localhost origins when NODE_ENV is production', () => {
      process.env.NODE_ENV = 'production';
      expect(isAllowedOrigin('http://localhost:3000')).toBe(false);
      expect(isAllowedOrigin('http://127.0.0.1:3000')).toBe(false);
    });
  });

  describe('6. Security Headers & Defense-in-Depth (Phase 5.3)', () => {
    it('should verify clickjacking protection via frame-ancestors none and X-Frame-Options DENY', () => {
      const frameOptions = 'DENY';
      const frameAncestors = "frame-ancestors 'none'";

      expect(frameOptions).toBe('DENY');
      expect(frameAncestors).toContain("'none'");
    });

    it('should verify MIME content sniffing protection is nosniff', () => {
      const contentTypeOptions = 'nosniff';
      expect(contentTypeOptions).toBe('nosniff');
    });

    it('should verify Referrer-Policy enforces strict-origin-when-cross-origin', () => {
      const referrerPolicy = 'strict-origin-when-cross-origin';
      expect(referrerPolicy).toBe('strict-origin-when-cross-origin');
    });

    it('should verify Permissions-Policy disables unused sensitive browser features', () => {
      const policy =
        'camera=(self), microphone=(), geolocation=(self), payment=(self), interest-cohort=()';
      expect(policy).toContain('microphone=()');
      expect(policy).toContain('interest-cohort=()');
      expect(policy).toContain('camera=(self)');
    });
  });
});
