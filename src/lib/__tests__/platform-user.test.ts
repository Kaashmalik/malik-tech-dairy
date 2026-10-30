/**
 * @jest-environment node
 */
jest.mock('@clerk/nextjs/server', () => ({ clerkClient: jest.fn() }));
jest.mock('@/lib/supabase/server', () => ({ getSupabaseClient: jest.fn() }));

import {
  getSuperAdminEmails,
  getVerifiedPrimaryEmail,
  isSuperAdminEmail,
} from '@/lib/auth/platform-user';

const email = (id: string, address: string, status: string) => ({
  id,
  emailAddress: address,
  verification: { status },
});

describe('getVerifiedPrimaryEmail', () => {
  it('returns the primary address only when verified', () => {
    expect(
      getVerifiedPrimaryEmail({
        primaryEmailAddressId: 'e2',
        emailAddresses: [
          email('e1', 'other@x.com', 'verified'),
          email('e2', 'Me@X.com', 'verified'),
        ],
      })
    ).toBe('me@x.com');
  });

  it('ignores an unverified primary even if a secondary is verified', () => {
    expect(
      getVerifiedPrimaryEmail({
        primaryEmailAddressId: 'e1',
        emailAddresses: [
          email('e1', 'mtkdairy@gmail.com', 'unverified'),
          email('e2', 'a@b.com', 'verified'),
        ],
      })
    ).toBeNull();
  });
});

describe('super admin allow-list', () => {
  const original = process.env.SUPER_ADMIN_EMAILS;
  afterEach(() => {
    process.env.SUPER_ADMIN_EMAILS = original;
  });

  it('reads a comma-separated env override', () => {
    process.env.SUPER_ADMIN_EMAILS = ' A@x.com, b@y.com ';
    expect(getSuperAdminEmails()).toEqual(['a@x.com', 'b@y.com']);
    expect(isSuperAdminEmail('B@Y.com')).toBe(true);
  });

  it('denies a missing email', () => {
    expect(isSuperAdminEmail(null)).toBe(false);
  });
});
