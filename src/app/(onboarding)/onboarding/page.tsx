import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { getSupabaseClient } from '@/lib/supabase/server';
import { getPostLoginPath } from '@/lib/auth/post-login-destination';

export const dynamic = 'force-dynamic';

export default async function OnboardingPage() {
  const { userId, orgId } = await auth();
  if (!userId) {
    redirect('/sign-in');
  }

  try {
    const supabase = getSupabaseClient();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: user } = await (supabase.from('platform_users') as any)
      .select('platform_role')
      .eq('id', userId)
      .maybeSingle();

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

    redirect(
      getPostLoginPath({
        isSuperAdmin: user?.platform_role === 'super_admin',
        hasActiveOrg: Boolean(orgId),
        hasMemberships: Boolean(memberships?.length),
        latestApplication: application ? { id: application.id, status: application.status } : null,
      })
    );
  } catch (error) {
    // Next.js redirect() throws; rethrow those
    if (error && typeof error === 'object' && 'digest' in error) {
      throw error;
    }
  }

  redirect(
    getPostLoginPath({
      isSuperAdmin: false,
      hasActiveOrg: Boolean(orgId),
      hasMemberships: false,
      latestApplication: null,
    })
  );
}
