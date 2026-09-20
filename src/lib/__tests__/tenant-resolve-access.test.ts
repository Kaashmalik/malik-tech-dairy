import { PlatformRole, TenantRole } from '@/types/roles';
import { mapClerkOrgRole, resolveTenantAccess } from '@/lib/tenant/resolve-access';

describe('resolveTenantAccess', () => {
  const membershipA = { tenantId: 'org_farm_a', role: 'farm_owner', status: 'active' };
  const membershipB = { tenantId: 'org_farm_b', role: 'milking_staff', status: 'active' };

  it('never assigns the first farm in the system when the user has no membership', () => {
    const result = resolveTenantAccess({
      clerkOrgId: null,
      headerTenantId: null,
      memberships: [],
      isSuperAdmin: false,
    });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.status).toBe(403);
      expect(result.error).toMatch(/onboarding/i);
    }
  });

  it('does not grant farm_owner when authorization data is missing', () => {
    const result = resolveTenantAccess({
      clerkOrgId: 'org_farm_a',
      memberships: [],
      isSuperAdmin: false,
      clerkOrgRole: null,
    });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.userRole).toBe(TenantRole.GUEST);
      expect(result.userRole).not.toBe(TenantRole.FARM_OWNER);
    }
  });

  it('uses Clerk org as tenant and DB membership role when both exist', () => {
    const result = resolveTenantAccess({
      clerkOrgId: 'org_farm_a',
      headerTenantId: 'org_farm_b',
      memberships: [membershipA, membershipB],
      isSuperAdmin: false,
      clerkOrgRole: 'org:member',
    });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.tenantId).toBe('org_farm_a');
      expect(result.userRole).toBe(TenantRole.FARM_OWNER);
    }
  });

  it('maps Clerk org:admin to farm_owner only inside that Clerk org', () => {
    expect(mapClerkOrgRole('org:admin')).toBe(TenantRole.FARM_OWNER);
    const result = resolveTenantAccess({
      clerkOrgId: 'org_farm_a',
      memberships: [],
      isSuperAdmin: false,
      clerkOrgRole: 'org:admin',
    });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.tenantId).toBe('org_farm_a');
      expect(result.userRole).toBe(TenantRole.FARM_OWNER);
    }
  });

  it('rejects spoofed x-tenant-id when the user is not a member', () => {
    const result = resolveTenantAccess({
      clerkOrgId: null,
      headerTenantId: 'org_victim',
      memberships: [membershipA],
      isSuperAdmin: false,
    });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.status).toBe(403);
    }
  });

  it('allows header tenant when membership matches', () => {
    const result = resolveTenantAccess({
      clerkOrgId: null,
      headerTenantId: 'org_farm_b',
      memberships: [membershipA, membershipB],
      isSuperAdmin: false,
    });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.tenantId).toBe('org_farm_b');
      expect(result.userRole).toBe(TenantRole.MILKING_STAFF);
    }
  });

  it('uses the single membership when Clerk org is absent', () => {
    const result = resolveTenantAccess({
      clerkOrgId: null,
      headerTenantId: null,
      memberships: [membershipB],
      isSuperAdmin: false,
    });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.tenantId).toBe('org_farm_b');
      expect(result.userRole).toBe(TenantRole.MILKING_STAFF);
    }
  });

  it('requires an explicit farm when the user belongs to multiple tenants', () => {
    const result = resolveTenantAccess({
      clerkOrgId: null,
      headerTenantId: null,
      memberships: [membershipA, membershipB],
      isSuperAdmin: false,
    });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toMatch(/select a farm/i);
    }
  });

  it('does not let super admin fall into a random tenant', () => {
    const result = resolveTenantAccess({
      clerkOrgId: null,
      headerTenantId: null,
      memberships: [],
      isSuperAdmin: true,
    });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toMatch(/must select/i);
    }
  });

  it('lets super admin target a specific farm without inheriting that farm owner role', () => {
    const result = resolveTenantAccess({
      clerkOrgId: null,
      headerTenantId: 'org_farm_a',
      memberships: [],
      isSuperAdmin: true,
    });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.tenantId).toBe('org_farm_a');
      expect(result.userRole).toBe(PlatformRole.SUPER_ADMIN);
    }
  });

  it('ignores inactive memberships', () => {
    const result = resolveTenantAccess({
      clerkOrgId: null,
      headerTenantId: null,
      memberships: [{ tenantId: 'org_farm_a', role: 'farm_owner', status: 'inactive' }],
      isSuperAdmin: false,
    });
    expect(result.ok).toBe(false);
  });
});
