import { NextRequest, NextResponse } from 'next/server';
import { withTenantContext } from '@/lib/api/middleware';
import { DashboardService } from '@/lib/services/dashboard/dashboard.service';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  return withTenantContext(async (req, context) => {
    try {
      const kpis = await DashboardService.getFarmKPIs(context);
      return NextResponse.json({
        success: true,
        data: kpis,
      });
    } catch (error: any) {
      console.error('Error loading dashboard stats:', error);
      return NextResponse.json(
        {
          success: false,
          error: 'Failed to aggregate farm dashboard metrics',
        },
        { status: 500 }
      );
    }
  })(request);
}
