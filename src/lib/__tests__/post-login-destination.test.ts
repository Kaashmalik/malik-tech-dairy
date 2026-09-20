import { getNoOrgFallbackPath, getPostLoginPath } from '@/lib/auth/post-login-destination';

describe('getPostLoginPath', () => {
  it('sends super admins to the platform console', () => {
    expect(
      getPostLoginPath({
        isSuperAdmin: true,
        hasActiveOrg: false,
        hasMemberships: false,
      })
    ).toBe('/super-admin');
  });

  it('sends users with an active Clerk org to the dashboard', () => {
    expect(
      getPostLoginPath({
        isSuperAdmin: false,
        hasActiveOrg: true,
        hasMemberships: true,
      })
    ).toBe('/dashboard');
  });

  it('sends members without an active org to select-farm (not apply)', () => {
    expect(
      getPostLoginPath({
        isSuperAdmin: false,
        hasActiveOrg: false,
        hasMemberships: true,
      })
    ).toBe('/select-farm');
  });

  it('sends approved applicants without memberships to select-farm to join', () => {
    expect(
      getPostLoginPath({
        isSuperAdmin: false,
        hasActiveOrg: false,
        hasMemberships: false,
        latestApplication: { id: 'app_1', status: 'approved' },
      })
    ).toBe('/select-farm');
  });

  it('sends pending applicants to application status', () => {
    expect(
      getPostLoginPath({
        isSuperAdmin: false,
        hasActiveOrg: false,
        hasMemberships: false,
        latestApplication: { id: 'app_pending', status: 'pending' },
      })
    ).toBe('/apply/status?id=app_pending');
  });

  it('sends brand-new users to apply', () => {
    expect(
      getPostLoginPath({
        isSuperAdmin: false,
        hasActiveOrg: false,
        hasMemberships: false,
        latestApplication: null,
      })
    ).toBe('/apply');
  });

  it('uses select-farm as the no-org page fallback', () => {
    expect(getNoOrgFallbackPath()).toBe('/select-farm');
  });
});
