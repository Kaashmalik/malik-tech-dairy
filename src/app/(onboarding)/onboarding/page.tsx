import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { getDrizzle } from '@/lib/supabase/server';
import { farmApplications } from '@/db/schema';
import { eq, desc } from 'drizzle-orm';
import { getPostLoginPath } from '@/lib/auth/post-login-destination';

export const dynamic = 'force-dynamic';

export default async function OnboardingPage() {
  const { userId, orgId } = await auth();
  if (!userId) {
    redirect('/sign-in');
  }

  try {
    const db = getDrizzle();
    const [application] = await db
      .select()
      .from(farmApplications)
      .where(eq(farmApplications.applicantId, userId))
      .orderBy(desc(farmApplications.createdAt))
      .limit(1);

    redirect(
      getPostLoginPath({
        isSuperAdmin: false,
        hasActiveOrg: Boolean(orgId),
        hasMemberships: false,
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
