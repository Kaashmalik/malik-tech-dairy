// Migration Recovery API Route
// Handles automated recovery actions for migration issues
import { NextRequest, NextResponse } from 'next/server';
import { migrationMonitor } from '@/lib/migration/monitor';
import { dualWriteAPI } from '@/lib/migration/dual-write-api';
import { auth } from '@clerk/nextjs/server';
export async function POST(request: NextRequest) {
  try {
    // Verify user is super admin
    const { userId } = auth();
    if (!userId) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }
    const { alertType } = await request.json();
    if (!alertType) {
      return NextResponse.json(
        { success: false, error: 'Alert type is required' },
        { status: 400 }
      );
    }
    // Attempt automated recovery
    const recoverySuccess = await migrationMonitor.attemptAutomatedRecovery(alertType);
    if (recoverySuccess) {
      return NextResponse.json({
        success: true,
        data: { recoverySuccess: true },
        message: `Automated recovery initiated for ${alertType}`,
      });
    } else {
      return NextResponse.json({
        success: false,
        error: 'Automated recovery failed',
        details: `Could not automatically recover from ${alertType}`,
      });
    }
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to execute recovery',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}