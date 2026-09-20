// Migration Dashboard API Routes
// Provides real-time data for the enterprise monitoring dashboard
import { NextRequest, NextResponse } from 'next/server';
import { migrationMonitor } from '@/lib/migration/monitor';
import { auth } from '@clerk/nextjs/server';
import { isPlatformSuperAdmin } from '@/lib/admin/require-super-admin';

export async function GET(_request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId || !(await isPlatformSuperAdmin(userId))) {
      return NextResponse.json(
        { success: false, error: 'Forbidden - Super Admin access required' },
        { status: 403 }
      );
    }
    const dashboardData = await migrationMonitor.getDashboardData();
    return NextResponse.json({
      success: true,
      data: dashboardData,
      message: 'Dashboard data retrieved successfully',
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to retrieve dashboard data',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
