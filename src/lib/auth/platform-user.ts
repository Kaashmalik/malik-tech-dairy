// Platform user bootstrap - single place that mirrors a Clerk user into Supabase
// Server-only: uses the service-role Supabase client and the Clerk backend API.
import { clerkClient } from '@clerk/nextjs/server';
import { getSupabaseClient } from '@/lib/supabase/server';
import { logger } from '@/lib/logger';

const DEFAULT_SUPER_ADMIN_EMAILS = ['mtkdairy@gmail.com'];

interface ClerkEmailLike {
  id: string;
  emailAddress: string;
  verification?: { status?: string | null } | null;
}

interface ClerkUserLike {
  primaryEmailAddressId: string | null;
  emailAddresses: ClerkEmailLike[];
  firstName?: string | null;
  lastName?: string | null;
}

interface PlatformUserRow {
  id: string;
  email: string;
  platform_role: 'super_admin' | 'admin' | 'user';
}

export interface EnsuredPlatformUser {
  userId: string;
  email: string | null;
  name: string;
  isSuperAdmin: boolean;
}

/** Super admin allow-list. Override with SUPER_ADMIN_EMAILS="a@x.com,b@y.com". */
export function getSuperAdminEmails(): string[] {
  const fromEnv = (process.env.SUPER_ADMIN_EMAILS || '')
    .split(',')
    .map(e => e.trim().toLowerCase())
    .filter(Boolean);
  return fromEnv.length > 0 ? fromEnv : DEFAULT_SUPER_ADMIN_EMAILS;
}

function getPrimaryEmail(user: ClerkUserLike): ClerkEmailLike | undefined {
  return (
    user.emailAddresses.find(e => e.id === user.primaryEmailAddressId) || user.emailAddresses[0]
  );
}

/** Primary email, but only when Clerk has verified it. Used for privilege decisions. */
export function getVerifiedPrimaryEmail(user: ClerkUserLike): string | null {
  const primary = user.emailAddresses.find(e => e.id === user.primaryEmailAddressId);
  if (!primary || primary.verification?.status !== 'verified') {
    return null;
  }
  return primary.emailAddress.toLowerCase();
}

export function isSuperAdminEmail(email: string | null): boolean {
  return Boolean(email) && getSuperAdminEmails().includes(email!.toLowerCase());
}

/**
 * Ensure a platform_users row exists for this Clerk user (idempotent).
 * Never relies on the Clerk webhook having run, so a missed webhook cannot block signup.
 * Throws on database errors so callers can fail closed.
 */
export async function ensurePlatformUser(
  userId: string,
  extra: { phone?: string } = {}
): Promise<EnsuredPlatformUser> {
  const client = await clerkClient();
  const clerkUser = (await client.users.getUser(userId)) as unknown as ClerkUserLike;

  const primaryEmail = getPrimaryEmail(clerkUser)?.emailAddress.toLowerCase() || null;
  const verifiedEmail = getVerifiedPrimaryEmail(clerkUser);
  const name = `${clerkUser.firstName || ''} ${clerkUser.lastName || ''}`.trim();
  const allowListed = isSuperAdminEmail(verifiedEmail);

  const supabase = getSupabaseClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const users = () => supabase.from('platform_users') as any;

  const { data: existing, error: fetchError } = await users()
    .select('id, email, platform_role')
    .eq('id', userId)
    .maybeSingle();
  if (fetchError) {
    throw new Error(`Failed to load platform user: ${fetchError.message}`);
  }

  let row = existing as PlatformUserRow | null;

  if (!row) {
    const now = new Date().toISOString();
    const { error: insertError } = await users().insert([
      {
        id: userId,
        // email is NOT NULL + UNIQUE; fall back to a per-user placeholder
        email: primaryEmail || `${userId}@users.mtkdairy.invalid`,
        name: name || null,
        phone: extra.phone || null,
        platform_role: allowListed ? 'super_admin' : 'user',
        is_active: true,
        email_verified: Boolean(verifiedEmail),
        created_at: now,
        updated_at: now,
      },
    ]);

    if (insertError && insertError.code !== '23505') {
      throw new Error(`Failed to create platform user: ${insertError.message}`);
    }
    if (insertError) {
      // Unique violation: either a concurrent insert for this id, or the email
      // belongs to an older (deleted) Clerk account. Re-read to find out which.
      const { data: reread } = await users()
        .select('id, email, platform_role')
        .eq('id', userId)
        .maybeSingle();
      if (!reread) {
        logger.error('platform_users email already taken by another account', undefined, {
          userId,
        });
        throw new Error('This email is already linked to another account. Please contact support.');
      }
      row = reread as PlatformUserRow;
    } else {
      row = {
        id: userId,
        email: primaryEmail || '',
        platform_role: allowListed ? 'super_admin' : 'user',
      };
    }
  } else if (allowListed && row.platform_role !== 'super_admin') {
    const { error: updateError } = await users()
      .update({ platform_role: 'super_admin', updated_at: new Date().toISOString() })
      .eq('id', userId);
    if (updateError) {
      throw new Error(`Failed to promote super admin: ${updateError.message}`);
    }
    row = { ...row, platform_role: 'super_admin' };
  }

  return {
    userId,
    email: primaryEmail,
    name,
    isSuperAdmin: row.platform_role === 'super_admin',
  };
}
