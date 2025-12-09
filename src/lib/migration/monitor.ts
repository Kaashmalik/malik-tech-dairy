// Enterprise Migration Monitoring & Observability System
// Real-time dashboard, alerting, and automated recovery

import { getSupabaseClient } from '@/lib/supabase';
import { dualWriteAPI } from '@/lib/migration/dual-write-api';

interface MigrationMetrics {
  timestamp: string;
  phase: string;
  dualWriteSuccess: number;
  dualWriteFailures: number;
  reconciliationStatus: 'PASSED' | 'FAILED' | 'WARNING';
  dataIntegrityScore: number;
  errorRate: number;
  activeUsers: number;
  throughput: number;
}

interface AlertThresholds {
  errorRateThreshold: number; // percentage
  dataIntegrityThreshold: number; // percentage
  failureRateThreshold: number; // percentage
  responseTimeThreshold: number; // milliseconds
}

export class MigrationMonitor {
  private supabase = getSupabaseClient();
  private metrics: MigrationMetrics[] = [];
  private alertThresholds: AlertThresholds = {
    errorRateThreshold: 1.0, // Alert if error rate > 1%
    dataIntegrityThreshold: 99.9, // Alert if integrity < 99.9%
    failureRateThreshold: 0.5, // Alert if failure rate > 0.5%
    responseTimeThreshold: 5000, // Alert if response time > 5 seconds
  };

  // Real-time Metrics Collection
  async collectMetrics(): Promise<MigrationMetrics> {
    const startTime = Date.now();

    try {
      // Get current migration status
      const migrationStatus = await dualWriteAPI.getMigrationStatus();

      // Get dual-write statistics
      const dualWriteStats = await this.getDualWriteStats();

      // Get data reconciliation status
      const reconciliationResult = await dualWriteAPI.performDataReconciliation();

      // Calculate data integrity score
      const integrityScore = this.calculateDataIntegrityScore(reconciliationResult);

      // Get active users
      const activeUsers = await this.getActiveUserCount();

      // Calculate throughput
      const throughput = await this.calculateThroughput();

      const metrics: MigrationMetrics = {
        timestamp: new Date().toISOString(),
        phase: migrationStatus.phase,
        dualWriteSuccess: dualWriteStats.successCount,
        dualWriteFailures: dualWriteStats.failureCount,
        reconciliationStatus: reconciliationResult.reconciliationStatus,
        dataIntegrityScore: integrityScore,
        errorRate: dualWriteStats.errorRate,
        activeUsers,
        throughput,
      };

      // Store metrics
      await this.storeMetrics(metrics);

      // Check for alerts
      await this.checkAlerts(metrics);

      return metrics;
    } catch (error) {
      console.error('Error collecting migration metrics:', error);
      throw error;
    } finally {
      const duration = Date.now() - startTime;
      if (duration > this.alertThresholds.responseTimeThreshold) {
        await this.triggerAlert('RESPONSE_TIME_HIGH', {
          duration,
          threshold: this.alertThresholds.responseTimeThreshold,
        });
      }
    }
  }

  private async getDualWriteStats(): Promise<{
    successCount: number;
    failureCount: number;
    errorRate: number;
  }> {
    // Get statistics from the last hour
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();

    const { data: logs } = await this.supabase
      .from('migration_logs')
      .select('success, failure')
      .gte('created_at', oneHourAgo);

    const successCount = logs?.filter(log => log.success).length || 0;
    const failureCount = logs?.filter(log => log.failure).length || 0;
    const total = successCount + failureCount;
    const errorRate = total > 0 ? (failureCount / total) * 100 : 0;

    return { successCount, failureCount, errorRate };
  }

  private calculateDataIntegrityScore(reconciliationResult: any): number {
    const totalRecords = reconciliationResult.discrepancies.reduce(
      (sum: number, d: any) => sum + d.supabaseCount + d.firebaseCount,
      0
    );

    const discrepancyCount = reconciliationResult.discrepancies.reduce(
      (sum: number, d: any) => sum + d.difference,
      0
    );

    return totalRecords > 0 ? ((totalRecords - discrepancyCount) / totalRecords) * 100 : 100;
  }

  private async getActiveUserCount(): Promise<number> {
    const { count } = await this.supabase
      .from('platform_users')
      .select('*', { count: 'exact', head: true })
      .eq('active', true);

    return count || 0;
  }

  private async calculateThroughput(): Promise<number> {
    // Calculate operations per minute
    const oneMinuteAgo = new Date(Date.now() - 60 * 1000).toISOString();

    const { count } = await this.supabase
      .from('migration_logs')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', oneMinuteAgo);

    return count || 0;
  }

  private async storeMetrics(metrics: MigrationMetrics): Promise<void> {
    await this.supabase.from('migration_metrics').insert({
      ...metrics,
      created_at: new Date().toISOString(),
    });
  }

  private async checkAlerts(metrics: MigrationMetrics): Promise<void> {
    // Check error rate threshold
    if (metrics.errorRate > this.alertThresholds.errorRateThreshold) {
      await this.triggerAlert('ERROR_RATE_HIGH', {
        current: metrics.errorRate,
        threshold: this.alertThresholds.errorRateThreshold,
      });
    }

    // Check data integrity threshold
    if (metrics.dataIntegrityScore < this.alertThresholds.dataIntegrityThreshold) {
      await this.triggerAlert('DATA_INTEGRITY_LOW', {
        current: metrics.dataIntegrityScore,
        threshold: this.alertThresholds.dataIntegrityThreshold,
      });
    }

    // Check failure rate threshold
    const totalOperations = metrics.dualWriteSuccess + metrics.dualWriteFailures;
    const failureRate =
      totalOperations > 0 ? (metrics.dualWriteFailures / totalOperations) * 100 : 0;

    if (failureRate > this.alertThresholds.failureRateThreshold) {
      await this.triggerAlert('FAILURE_RATE_HIGH', {
        current: failureRate,
        threshold: this.alertThresholds.failureRateThreshold,
      });
    }
  }

  async triggerAlert(alertType: string, details: any): Promise<void> {
    console.warn(`🚨 MIGRATION ALERT: ${alertType}`, details);

    // Store alert in database
    await this.supabase.from('migration_alerts').insert({
      alert_type: alertType,
      details,
      severity: this.getAlertSeverity(alertType),
      created_at: new Date().toISOString(),
      resolved: false,
    });

    // Send notification (implement based on your notification system)
    await this.sendNotification(alertType, details);
  }

  private getAlertSeverity(alertType: string): 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' {
    const severityMap: Record<string, 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'> = {
      ERROR_RATE_HIGH: 'HIGH',
      DATA_INTEGRITY_LOW: 'CRITICAL',
      FAILURE_RATE_HIGH: 'HIGH',
      RESPONSE_TIME_HIGH: 'MEDIUM',
    };

    return severityMap[alertType] || 'MEDIUM';
  }

  private async sendNotification(alertType: string, details: any): Promise<void> {
    // Implement notification logic (email, Slack, etc.)
    console.log(`📧 Sending notification for ${alertType}:`, details);
  }

  // Dashboard Data API
  async getDashboardData(): Promise<{
    currentMetrics: MigrationMetrics;
    historicalMetrics: MigrationMetrics[];
    activeAlerts: any[];
    migrationProgress: {
      phase: string;
      completion: number;
      estimatedTimeRemaining: number;
    };
  }> {
    const [currentMetrics, historicalMetrics, activeAlerts] = await Promise.all([
      this.collectMetrics(),
      this.getHistoricalMetrics(),
      this.getActiveAlerts(),
    ]);

    const migrationProgress = await this.calculateMigrationProgress();

    return {
      currentMetrics,
      historicalMetrics,
      activeAlerts,
      migrationProgress,
    };
  }

  private async getHistoricalMetrics(): Promise<MigrationMetrics[]> {
    const { data } = await this.supabase
      .from('migration_metrics')
      .select('*')
      .order('timestamp', { ascending: false })
      .limit(24); // Last 24 data points

    return data || [];
  }

  private async getActiveAlerts(): Promise<any[]> {
    const { data } = await this.supabase
      .from('migration_alerts')
      .select('*')
      .eq('resolved', false)
      .order('created_at', { ascending: false });

    return data || [];
  }

  private async calculateMigrationProgress(): Promise<{
    phase: string;
    completion: number;
    estimatedTimeRemaining: number;
  }> {
    const migrationStatus = await dualWriteAPI.getMigrationStatus();

    // Calculate completion based on phase and data sync status
    const phaseProgress: Record<string, number> = {
      UNKNOWN: 0,
      PHASE_1_DUAL_WRITE: 25,
      PHASE_2_READ_MIGRATION: 50,
      PHASE_3_WRITE_MIGRATION: 75,
      PHASE_4_CLEANUP: 100,
    };

    const completion = phaseProgress[migrationStatus.phase] || 0;

    // Estimate time remaining based on current throughput
    const remainingWork = 100 - completion;
    const estimatedTimeRemaining = remainingWork > 0 ? (remainingWork / 10) * 60 : 0; // minutes

    return {
      phase: migrationStatus.phase,
      completion,
      estimatedTimeRemaining,
    };
  }

  // Automated Recovery System
  async attemptAutomatedRecovery(alertType: string): Promise<boolean> {
    console.log(`🔧 Attempting automated recovery for: ${alertType}`);

    switch (alertType) {
      case 'DATA_INTEGRITY_LOW':
        return await this.reconcileData();

      case 'ERROR_RATE_HIGH':
        return await this.adjustThrottling();

      case 'FAILURE_RATE_HIGH':
        return await this.enableRetryMode();

      default:
        return false;
    }
  }

  private async reconcileData(): Promise<boolean> {
    try {
      const reconciliationResult = await dualWriteAPI.performDataReconciliation();

      if (reconciliationResult.discrepancies.length > 0) {
        await dualWriteAPI.syncDiscrepancies(reconciliationResult.discrepancies);
        console.log('✅ Automated data reconciliation completed');
        return true;
      }

      return false;
    } catch (error) {
      console.error('❌ Automated data reconciliation failed:', error);
      return false;
    }
  }

  private async adjustThrottling(): Promise<boolean> {
    // Implement throttling adjustment logic
    console.log('🔧 Adjusting throttling to reduce error rate');
    return true;
  }

  private async enableRetryMode(): Promise<boolean> {
    // Implement retry mode activation
    console.log('🔧 Enabling retry mode for failed operations');
    return true;
  }

  // Health Check Endpoint
  async healthCheck(): Promise<{
    status: 'HEALTHY' | 'WARNING' | 'CRITICAL';
    checks: {
      database: boolean;
      featureFlags: boolean;
      dualWrite: boolean;
      reconciliation: boolean;
    };
    lastUpdated: string;
  }> {
    const [database, featureFlags, dualWrite, reconciliation] = await Promise.all([
      this.checkDatabaseHealth(),
      this.checkFeatureFlagsHealth(),
      this.checkDualWriteHealth(),
      this.checkReconciliationHealth(),
    ]);

    const allHealthy = database && featureFlags && dualWrite && reconciliation;
    const someHealthy = database || featureFlags || dualWrite || reconciliation;

    return {
      status: allHealthy ? 'HEALTHY' : someHealthy ? 'WARNING' : 'CRITICAL',
      checks: {
        database,
        featureFlags,
        dualWrite,
        reconciliation,
      },
      lastUpdated: new Date().toISOString(),
    };
  }

  private async checkDatabaseHealth(): Promise<boolean> {
    try {
      await this.supabase.from('tenants').select('count').limit(1);
      return true;
    } catch {
      return false;
    }
  }

  private async checkFeatureFlagsHealth(): Promise<boolean> {
    try {
      await this.supabase.from('feature_flags').select('count').limit(1);
      return true;
    } catch {
      return false;
    }
  }

  private async checkDualWriteHealth(): Promise<boolean> {
    // Check if dual-write operations are working
    const recentLogs = await this.supabase
      .from('migration_logs')
      .select('success')
      .order('created_at', { ascending: false })
      .limit(10);

    return recentLogs?.length > 0;
  }

  private async checkReconciliationHealth(): Promise<boolean> {
    try {
      await dualWriteAPI.performDataReconciliation();
      return true;
    } catch {
      return false;
    }
  }
}

export const migrationMonitor = new MigrationMonitor();
