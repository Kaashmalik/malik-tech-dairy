// API Route: Get current user's farm applications
import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { getDrizzle } from '@/lib/supabase';
import { farmApplications } from '@/db/schema';
import { eq, desc } from 'drizzle-orm';
export const dynamic = 'force-dynamic';
export async function GET() {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }
    const db = getDrizzle();
    // Get user's latest application
    const [application] = await db
      .select()
      .from(farmApplications)
      .where(eq(farmApplications.applicantId, userId))
      .orderBy(desc(farmApplications.createdAt))
      .limit(1);
    if (!application) {
      return NextResponse.json({ success: true, data: null }, { status: 200 });
    }
    return NextResponse.json({
      success: true,
      data: application,
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Failed to fetch applications' },
      { status: 500 }
    );
  }
}