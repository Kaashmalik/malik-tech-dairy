// API Route: Daily Cron Job to Trigger Predictions for All Tenants
import { NextRequest, NextResponse } from 'next/server';
import { getDrizzle } from '@/lib/supabase/server';
import { tenants } from '@/db/schema';
import { isNull } from 'drizzle-orm';
import { predictionQueue } from '@/lib/workers/queue';

export const dynamic = 'force-dynamic';

// Called by cron (Vercel Cron / GitHub Actions). Auth via Bearer CRON_SECRET.
export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;
    if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const db = getDrizzle();
    const rows = await db.select({ id: tenants.id }).from(tenants).where(isNull(tenants.deletedAt));

    const tenantIds = rows.map(r => r.id);

    const jobs = await Promise.all(
      tenantIds.map(tenantId =>
        predictionQueue.add(
          'milk-forecast',
          { tenantId },
          {
            jobId: `milk-forecast-${tenantId}-${Date.now()}`,
            removeOnComplete: { age: 24 * 3600 },
            removeOnFail: { age: 7 * 24 * 3600 },
          }
        )
      )
    );

    return NextResponse.json({
      success: true,
      tenantsProcessed: tenantIds.length,
      jobsQueued: jobs.length,
    });
  } catch (error) {
    console.error('Predictions cron error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
