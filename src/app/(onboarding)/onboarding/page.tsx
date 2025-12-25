import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { getDrizzle } from '@/lib/supabase';
import { farmApplications } from '@/db/schema';
import { eq, desc } from 'drizzle-orm';
export const dynamic = 'force-dynamic';
export default async function OnboardingPage() {
  const { userId, orgId } = await auth();
  if (!userId) {
    redirect('/sign-in');
  }
  // If user already has an organization, go to dashboard
  if (orgId) {
    redirect('/dashboard');
  }
  // Check if user has a pending application
  try {
    const db = getDrizzle();
    const [application] = await db
      .select()
      .from(farmApplications)
      .where(eq(farmApplications.applicantId, userId))
      .orderBy(desc(farmApplications.createdAt))
      .limit(1);
    if (application) {
      // User has an application - redirect to status page
      redirect(`/apply/status?id=${application.id}`);
    }
  } catch (error) {
  }
  // No application - redirect to apply page
  redirect('/apply');
}