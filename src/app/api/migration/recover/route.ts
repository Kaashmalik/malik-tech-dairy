// Migration Recovery API Route
// Handles automated recovery actions for migration issues
import { NextRequest, NextResponse } from 'next/server';
import { migrationMonitor } from '@/lib/migration/monitor';
import { auth } from '@clerk/nextjs/server';
import { isPlatformSuperAdmin } from '@/lib/admin/require-super-admin';

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId || !(await isPlatformSuperAdmin(userId))) {
      return NextResponse.json(
        { success: false, error: 'Forbidden - Super Admin access required' },
        { status: 403 }
      );
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
