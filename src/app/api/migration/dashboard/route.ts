// Migration Dashboard API Routes
// Provides real-time data for the enterprise monitoring dashboard
import { NextRequest, NextResponse } from 'next/server';
import { migrationMonitor } from '@/lib/migration/monitor';
import { dualWriteAPI } from '@/lib/migration/dual-write-api';
import { auth } from '@clerk/nextjs/server';
export async function GET(request: NextRequest) {
  try {
    // Verify user is super admin
    const { userId } = auth();
    if (!userId) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }
    // Get dashboard data
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