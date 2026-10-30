// Smart redirect after sign-in based on user role and org status
import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { getSupabaseClient } from '@/lib/supabase/server';
import { getPostLoginPath } from '@/lib/auth/post-login-destination';
import { ensurePlatformUser } from '@/lib/auth/platform-user';
import { logger } from '@/lib/logger';

export const dynamic = 'force-dynamic';

function appOrigin(): string {
  return process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
}

export async function GET() {
  try {
    const { userId, orgId } = await auth();
    if (!userId) {
      return NextResponse.redirect(new URL('/sign-in', appOrigin()));
    }

    // First login after signup: create platform_users even if the webhook hasn't run
    const platformUser = await ensurePlatformUser(userId);
    const supabase = getSupabaseClient();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: memberships } = await (supabase.from('tenant_members') as any)
      .select('tenant_id')
      .eq('user_id', userId)
      .eq('status', 'active')
      .limit(1);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: application } = await (supabase.from('farm_applications') as any)
      .select('id, status')
      .eq('applicant_id', userId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    const path = getPostLoginPath({
      isSuperAdmin: platformUser.isSuperAdmin,
      hasActiveOrg: Boolean(orgId),
      hasMemberships: Boolean(memberships?.length),
      latestApplication: application ? { id: application.id, status: application.status } : null,
    });

    return NextResponse.redirect(new URL(path, appOrigin()));
  } catch (error) {
    logger.error('auth/redirect failed', error);
    // Prefer farm picker when auth succeeded but destination resolution failed;
    // apply is the cold-start path if picker is empty.
    return NextResponse.redirect(new URL('/select-farm', appOrigin()));
  }
}
