// API Route: Cron Job to Trigger Automated Reminders for All Tenants
import { NextRequest, NextResponse } from 'next/server';
import { listActiveTenants } from '@/lib/supabase/tenant-db';
import { ReminderService } from '@/lib/services/notifications/notification.service';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    // Verify cron secret strictly
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;
    if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Skips soft-deleted farms
    const allTenants = (await listActiveTenants()).map(t => ({ id: t.id, farmName: t.farm_name }));

    const summary: Record<string, any> = {
      tenantsProcessed: allTenants.length,
      results: [],
    };

    for (const tenant of allTenants) {
      try {
        const result = await ReminderService.runAllReminderChecks(tenant.id);
        summary.results.push({
          tenantId: tenant.id,
          farmName: tenant.farmName,
          ...result,
        });
      } catch (err: any) {
        summary.results.push({
          tenantId: tenant.id,
          farmName: tenant.farmName,
          error: err?.message || 'Failed to process reminders',
        });
      }
    }

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      ...summary,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || 'Internal server error processing reminders cron' },
      { status: 500 }
    );
  }
}
