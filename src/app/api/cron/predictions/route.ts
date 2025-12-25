// API Route: Daily Cron Job to Trigger Predictions for All Tenants
import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/admin';
import { predictionQueue } from '@/lib/workers/queue';
export const dynamic = 'force-dynamic';
// This should be called by a cron service (e.g., Vercel Cron, GitHub Actions, etc.)
// For security, use a secret token
export async function GET(request: NextRequest) {
  try {
    // Verify cron secret
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;
    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    if (!adminDb) {
      return NextResponse.json({ error: 'Database not available' }, { status: 500 });
    }
    // Get all active tenants
    const tenantsSnapshot = await adminDb.collection('tenants').get();
    const tenantIds: string[] = [];
    tenantsSnapshot.docs.forEach(doc => {
      tenantIds.push(doc.id);
    });
    // Queue prediction jobs for each tenant
    const jobs = await Promise.all(
      tenantIds.map(tenantId =>
        predictionQueue.add(
          'milk-forecast',
          { tenantId },
          {
            jobId: `milk-forecast-${tenantId}-${Date.now()}`,
            removeOnComplete: { age: 24 * 3600 }, // Keep for 24 hours
            removeOnFail: { age: 7 * 24 * 3600 }, // Keep failures for 7 days
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
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}