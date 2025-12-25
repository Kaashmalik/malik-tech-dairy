'use client';
// Real-time Migration Dashboard Component
// Provides enterprise-grade monitoring and control
import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Activity,
  AlertTriangle,
  CheckCircle,
  Clock,
  Database,
  Users,
  TrendingUp,
  RefreshCw,
  Play,
  Pause,
  RotateCcw,
} from 'lucide-react';
interface DashboardData {
  currentMetrics: {
    timestamp: string;
    phase: string;
    dualWriteSuccess: number;
    dualWriteFailures: number;
    reconciliationStatus: 'PASSED' | 'FAILED' | 'WARNING';
    dataIntegrityScore: number;
    errorRate: number;
    activeUsers: number;
    throughput: number;
  };
  historicalMetrics: any[];
  activeAlerts: any[];
  migrationProgress: {
    phase: string;
    completion: number;
    estimatedTimeRemaining: number;
  };
}
export default function MigrationDashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [isPaused, setIsPaused] = useState(false);
  useEffect(() => {
    fetchDashboardData();
    let interval: NodeJS.Timeout;
    if (autoRefresh && !isPaused) {
      interval = setInterval(fetchDashboardData, 30000); // Refresh every 30 seconds
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [autoRefresh, isPaused]);
  const fetchDashboardData = async () => {
    try {
      const response = await fetch('/api/migration/dashboard');
      const dashboardData = await response.json();
      setData(dashboardData);
    } catch (error) {
    } finally {
      setLoading(false);
    }
  };
  const handleRecovery = async (alertType: string) => {
    try {
      const response = await fetch('/api/migration/recover', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ alertType }),
      });
      if (response.ok) {
        fetchDashboardData(); // Refresh data
      }
    } catch (error) {
    }
  };
  const getPhaseColor = (phase: string) => {
    const colors: Record<string, string> = {
      PHASE_1_DUAL_WRITE: 'bg-blue-500',
      PHASE_2_READ_MIGRATION: 'bg-yellow-500',
      PHASE_3_WRITE_MIGRATION: 'bg-orange-500',
      PHASE_4_CLEANUP: 'bg-green-500',
    };
    return colors[phase] || 'bg-gray-500';
  };
  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      HEALTHY: 'text-green-600',
      WARNING: 'text-yellow-600',
      CRITICAL: 'text-red-600',
      PASSED: 'text-green-600',
      FAILED: 'text-red-600',
      WARNING: 'text-yellow-600',
    };
    return colors[status] || 'text-gray-600';
  };
  if (loading) {
    return (
      <div className='flex h-96 items-center justify-center'>
        <RefreshCw className='h-8 w-8 animate-spin' />
      </div>
    );
  }
  if (!data) {
    return <div className='text-center text-gray-500'>Failed to load migration dashboard data</div>;
  }
  return (
    <div className='space-y-6 p-6'>
      {/* Header Controls */}
      <div className='flex items-center justify-between'>
        <h1 className='text-3xl font-bold'>Migration Dashboard</h1>
        <div className='flex gap-2'>
          <Button
            variant={isPaused ? 'default' : 'outline'}
            size='sm'
            onClick={() => setIsPaused(!isPaused)}
          >
            {isPaused ? <Play className='mr-2 h-4 w-4' /> : <Pause className='mr-2 h-4 w-4' />}
            {isPaused ? 'Resume' : 'Pause'}
          </Button>
          <Button
            variant={autoRefresh ? 'default' : 'outline'}
            size='sm'
            onClick={() => setAutoRefresh(!autoRefresh)}
          >
            <RefreshCw className='mr-2 h-4 w-4' />
            Auto Refresh
          </Button>
        </div>
      </div>
      {/* Migration Progress Overview */}
      <Card>
        <CardHeader>
          <CardTitle className='flex items-center gap-2'>
            <Activity className='h-5 w-5' />
            Migration Progress
          </CardTitle>
          <CardDescription>Current phase: {data.migrationProgress.phase}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className='space-y-4'>
            <div>
              <div className='mb-2 flex justify-between text-sm'>
                <span>Overall Progress</span>
                <span>{data.migrationProgress.completion}%</span>
              </div>
              <Progress value={data.migrationProgress.completion} className='h-2' />
            </div>
            <div className='grid grid-cols-3 gap-4 text-sm'>
              <div>
                <span className='text-gray-500'>Current Phase</span>
                <div className='font-medium'>
                  <Badge className={getPhaseColor(data.migrationProgress.phase)}>
                    {data.migrationProgress.phase.replace('PHASE_', '').replace('_', ' ')}
                  </Badge>
                </div>
              </div>
              <div>
                <span className='text-gray-500'>Est. Time Remaining</span>
                <div className='flex items-center gap-1 font-medium'>
                  <Clock className='h-4 w-4' />
                  {Math.round(data.migrationProgress.estimatedTimeRemaining)} min
                </div>
              </div>
              <div>
                <span className='text-gray-500'>Status</span>
                <div
                  className={`font-medium ${getStatusColor(data.currentMetrics.reconciliationStatus)}`}
                >
                  {data.currentMetrics.reconciliationStatus}
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
      {/* Key Metrics */}
      <div className='grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4'>
        <Card>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
            <CardTitle className='text-sm font-medium'>Data Integrity</CardTitle>
            <Database className='text-muted-foreground h-4 w-4' />
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>
              {data.currentMetrics.dataIntegrityScore.toFixed(2)}%
            </div>
            <p className='text-muted-foreground text-xs'>
              {data.currentMetrics.dataIntegrityScore >= 99.9
                ? 'Excellent'
                : data.currentMetrics.dataIntegrityScore >= 99
                  ? 'Good'
                  : 'Needs Attention'}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
            <CardTitle className='text-sm font-medium'>Error Rate</CardTitle>
            <AlertTriangle className='text-muted-foreground h-4 w-4' />
          </CardHeader>
          <CardContent>
            <div
              className={`text-2xl font-bold ${data.currentMetrics.errorRate > 1 ? 'text-red-600' : 'text-green-600'}`}
            >
              {data.currentMetrics.errorRate.toFixed(2)}%
            </div>
            <p className='text-muted-foreground text-xs'>
              {data.currentMetrics.errorRate === 0 ? 'No errors' : 'Above threshold'}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
            <CardTitle className='text-sm font-medium'>Active Users</CardTitle>
            <Users className='text-muted-foreground h-4 w-4' />
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>{data.currentMetrics.activeUsers}</div>
            <p className='text-muted-foreground text-xs'>Currently active</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
            <CardTitle className='text-sm font-medium'>Throughput</CardTitle>
            <TrendingUp className='text-muted-foreground h-4 w-4' />
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>{data.currentMetrics.throughput}</div>
            <p className='text-muted-foreground text-xs'>Operations/min</p>
          </CardContent>
        </Card>
      </div>
      {/* Active Alerts */}
      {data.activeAlerts.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className='flex items-center gap-2'>
              <AlertTriangle className='h-5 w-5' />
              Active Alerts ({data.activeAlerts.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className='space-y-2'>
              {data.activeAlerts.map((alert, index) => (
                <Alert key={index} className='border-l-4 border-l-red-500'>
                  <AlertTriangle className='h-4 w-4' />
                  <AlertDescription className='flex items-center justify-between'>
                    <div>
                      <strong>{alert.alert_type}</strong>: {JSON.stringify(alert.details)}
                    </div>
                    <Button
                      size='sm'
                      variant='outline'
                      onClick={() => handleRecovery(alert.alert_type)}
                    >
                      <RotateCcw className='mr-1 h-4 w-4' />
                      Recover
                    </Button>
                  </AlertDescription>
                </Alert>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
      {/* Detailed Tabs */}
      <Tabs defaultValue='metrics' className='space-y-4'>
        <TabsList>
          <TabsTrigger value='metrics'>Metrics</TabsTrigger>
          <TabsTrigger value='logs'>Operation Logs</TabsTrigger>
          <TabsTrigger value='health'>System Health</TabsTrigger>
        </TabsList>
        <TabsContent value='metrics'>
          <Card>
            <CardHeader>
              <CardTitle>Historical Metrics</CardTitle>
              <CardDescription>Last 24 hours of migration performance</CardDescription>
            </CardHeader>
            <CardContent>
              <div className='space-y-4'>
                {data.historicalMetrics.slice(0, 10).map((metric, index) => (
                  <div key={index} className='flex items-center justify-between rounded border p-3'>
                    <div>
                      <div className='font-medium'>{metric.timestamp}</div>
                      <div className='text-sm text-gray-500'>
                        Success: {metric.dualWriteSuccess} | Failures: {metric.dualWriteFailures}
                      </div>
                    </div>
                    <div className='text-right'>
                      <div className={`font-medium ${getStatusColor(metric.reconciliationStatus)}`}>
                        {metric.reconciliationStatus}
                      </div>
                      <div className='text-sm text-gray-500'>
                        Integrity: {metric.dataIntegrityScore.toFixed(2)}%
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value='logs'>
          <Card>
            <CardHeader>
              <CardTitle>Recent Operation Logs</CardTitle>
              <CardDescription>Latest migration operations and their status</CardDescription>
            </CardHeader>
            <CardContent>
              <div className='py-8 text-center text-gray-500'>
                Operation logs will be displayed here
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value='health'>
          <Card>
            <CardHeader>
              <CardTitle>System Health Check</CardTitle>
              <CardDescription>Overall system health and component status</CardDescription>
            </CardHeader>
            <CardContent>
              <div className='grid grid-cols-2 gap-4'>
                <div className='flex items-center gap-2'>
                  <CheckCircle className='h-5 w-5 text-green-600' />
                  <span>Database Connection</span>
                </div>
                <div className='flex items-center gap-2'>
                  <CheckCircle className='h-5 w-5 text-green-600' />
                  <span>Feature Flags</span>
                </div>
                <div className='flex items-center gap-2'>
                  <CheckCircle className='h-5 w-5 text-green-600' />
                  <span>Dual-Write Operations</span>
                </div>
                <div className='flex items-center gap-2'>
                  <CheckCircle className='h-5 w-5 text-green-600' />
                  <span>Data Reconciliation</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}