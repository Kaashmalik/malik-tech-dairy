// Scheduled Migration Jobs API
// Handles cron-based monitoring and reconciliation tasks
import { NextRequest, NextResponse } from 'next/server';
import { migrationMonitor } from '@/lib/migration/monitor';
import { dualWriteAPI } from '@/lib/migration/dual-write-api';
import { auth } from '@clerk/nextjs/server';
// Cron job for collecting metrics every 5 minutes
export async function GET(request: NextRequest) {
  try {
    // Verify this is a cron job request (using cron secret)
    const cronSecret = request.headers.get('x-cron-secret');
    if (cronSecret !== process.env.CRON_SECRET) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized cron request' },
        { status: 401 }
      );
    }
    // Collect current metrics
    const metrics = await migrationMonitor.collectMetrics();
    // Perform data reconciliation
    const reconciliationResult = await dualWriteAPI.performDataReconciliation();
    // If discrepancies found, attempt automatic sync
    if (reconciliationResult.discrepancies.length > 0) {
      console.log(
        `🔄 Found ${reconciliationResult.discrepancies.length} discrepancies, starting auto-sync`
      );
      await dualWriteAPI.syncDiscrepancies(reconciliationResult.discrepancies);
    }
    // Check for automated rollback conditions
    await checkAutomatedRollbackConditions(metrics);
    return NextResponse.json({
      success: true,
      data: {
        metrics,
        reconciliation: reconciliationResult,
        timestamp: new Date().toISOString(),
      },
      message: 'Scheduled migration tasks completed successfully',
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: 'Scheduled job failed',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
// Check for conditions that trigger automated rollback
async function checkAutomatedRollbackConditions(metrics: any) {
  const rollbackThresholds = {
    errorRate: 5.0, // Rollback if error rate > 5% for sustained period
    dataIntegrity: 98.0, // Rollback if integrity < 98%
    failureRate: 3.0, // Rollback if failure rate > 3%
  };
  // Get recent metrics to check for sustained issues
  const recentMetrics = await getRecentMetrics(60); // Last hour
  if (recentMetrics.length < 10) return; // Need enough data points
  const avgErrorRate =
    recentMetrics.reduce((sum: number, m: any) => sum + m.error_rate, 0) / recentMetrics.length;
  const avgDataIntegrity =
    recentMetrics.reduce((sum: number, m: any) => sum + m.data_integrity_score, 0) /
    recentMetrics.length;
  const totalOperations = recentMetrics.reduce(
    (sum: number, m: any) => sum + m.dual_write_success + m.dual_write_failures,
    0
  );
  const totalFailures = recentMetrics.reduce(
    (sum: number, m: any) => sum + m.dual_write_failures,
    0
  );
  const failureRate = totalOperations > 0 ? (totalFailures / totalOperations) * 100 : 0;
  // Trigger automated rollback if thresholds exceeded
  if (
    avgErrorRate > rollbackThresholds.errorRate ||
    avgDataIntegrity < rollbackThresholds.dataIntegrity ||
    failureRate > rollbackThresholds.failureRate
  ) {
    await triggerAutomatedRollback({
      reason: 'SUSTAINED_ISSUES',
      metrics: {
        avgErrorRate,
        avgDataIntegrity,
        failureRate,
      },
    });
  }
}
async function getRecentMetrics(minutes: number) {
  // This would query the migration_metrics table for recent data
  // Implementation depends on your database setup
  return [];
}
async function triggerAutomatedRollback(details: any) {
  try {
    // Revert to previous migration phase
    await dualWriteAPI.setMigrationPhase('PHASE_1_DUAL_WRITE');
    // Send alert notification
    await migrationMonitor.triggerAlert('AUTOMATED_ROLLBACK', details);
  } catch (error) {
  }
}