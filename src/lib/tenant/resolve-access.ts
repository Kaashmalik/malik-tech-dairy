import { PlatformRole, TenantRole, UserRole } from '@/types/roles';

export interface TenantMembershipInput {
  tenantId: string;
  role: string;
  status?: string | null;
}

export interface ResolveTenantAccessInput {
  clerkOrgId?: string | null;
  headerTenantId?: string | null;
  memberships: TenantMembershipInput[];
  isSuperAdmin: boolean;
  clerkOrgRole?: string | null;
}

export type TenantAccessResult =
  | { ok: true; tenantId: string; userRole: UserRole }
  | { ok: false; status: 403; error: string };

const ONBOARDING_ERROR = 'No organization (tenant) found. Please complete onboarding.';
const SELECT_ORG_ERROR = 'Select a farm organization before continuing.';
const SUPER_ADMIN_SELECT_ERROR = 'Super admin must select a farm organization.';
const HEADER_FORBIDDEN_ERROR = 'Forbidden: you are not a member of this farm.';

function activeMemberships(memberships: TenantMembershipInput[]): TenantMembershipInput[] {
  return memberships.filter(m => !m.status || m.status === 'active');
}

export function mapClerkOrgRole(clerkOrgRole?: string | null): UserRole {
  switch (clerkOrgRole) {
    case 'org:admin':
      return TenantRole.FARM_OWNER;
    case 'org:member':
      return TenantRole.FARM_MANAGER;
    default:
      return TenantRole.GUEST;
  }
}

export function coerceTenantRole(role: string): UserRole {
  const values = Object.values(TenantRole) as string[];
  if (role === PlatformRole.SUPER_ADMIN) {
    return PlatformRole.SUPER_ADMIN;
  }
  if (values.includes(role)) {
    return role as TenantRole;
  }
  return TenantRole.GUEST;
}

/**
 * Fail-closed tenant resolution.
 * Never assigns an unrelated farm (e.g. "first tenant in the table").
 */
export function resolveTenantAccess(input: ResolveTenantAccessInput): TenantAccessResult {
  const memberships = activeMemberships(input.memberships);
  const clerkOrgId = input.clerkOrgId || null;
  const headerTenantId = input.headerTenantId || null;

  if (input.isSuperAdmin) {
    const tenantId = headerTenantId || clerkOrgId;
    if (!tenantId) {
      return { ok: false, status: 403, error: SUPER_ADMIN_SELECT_ERROR };
    }
    return { ok: true, tenantId, userRole: PlatformRole.SUPER_ADMIN };
  }

  if (clerkOrgId) {
    const membership = memberships.find(m => m.tenantId === clerkOrgId);
    const userRole = membership
      ? coerceTenantRole(membership.role)
      : mapClerkOrgRole(input.clerkOrgRole);
    return { ok: true, tenantId: clerkOrgId, userRole };
  }

  if (headerTenantId) {
    const membership = memberships.find(m => m.tenantId === headerTenantId);
    if (!membership) {
      return { ok: false, status: 403, error: HEADER_FORBIDDEN_ERROR };
    }
    return { ok: true, tenantId: headerTenantId, userRole: coerceTenantRole(membership.role) };
  }

  if (memberships.length === 1) {
    return {
      ok: true,
      tenantId: memberships[0].tenantId,
      userRole: coerceTenantRole(memberships[0].role),
    };
  }

  if (memberships.length > 1) {
    return { ok: false, status: 403, error: SELECT_ORG_ERROR };
  }

  return { ok: false, status: 403, error: ONBOARDING_ERROR };
}
