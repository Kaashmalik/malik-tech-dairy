'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import {
  Activity,
  Users,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle,
  Clock,
  Zap,
  Database,
  Server,
  Wifi,
  WifiOff,
} from 'lucide-react';

interface MetricData {
  timestamp: string;
  value: number;
  label?: string;
}

interface SystemHealth {
  api: 'healthy' | 'degraded' | 'down';
  database: 'healthy' | 'degraded' | 'down';
  storage: 'healthy' | 'degraded' | 'down';
  uptime: number;
  responseTime: number;
}

export default function MonitoringDashboard() {
  const [timeRange, setTimeRange] = useState<'1h' | '24h' | '7d' | '30d'>('24h');
  const [systemHealth, setSystemHealth] = useState<SystemHealth>({
    api: 'healthy',
    database: 'healthy',
    storage: 'healthy',
    uptime: 99.9,
    responseTime: 145,
  });
  const [metrics, setMetrics] = useState({
    requests: [] as MetricData[],
    errors: [] as MetricData[],
    responseTime: [] as MetricData[],
    activeUsers: [] as MetricData[],
  });
  const [alerts, setAlerts] = useState([
    {
      id: '1',
      type: 'warning',
      message: 'High memory usage detected on API server',
      timestamp: '5 minutes ago',
    },
    {
      id: '2',
      type: 'info',
      message: 'Scheduled maintenance in 2 hours',
      timestamp: '1 hour ago',
    },
  ]);

  // Mock data generation
  useEffect(() => {
    const generateMetrics = () => {
      const now = Date.now();
      const intervals = timeRange === '1h' ? 60 : timeRange === '24h' ? 1440 : timeRange === '7d' ? 10080 : 43200;
      const intervalMs = (timeRange === '1h' ? 3600000 : timeRange === '24h' ? 86400000 : timeRange === '7d' ? 604800000 : 2592000000) / intervals;

      const requests = Array.from({ length: Math.min(intervals, 100) }, (_, i) => ({
        timestamp: new Date(now - (intervals - i) * intervalMs).toISOString(),
        value: Math.floor(Math.random() * 1000) + 500,
      }));

      const errors = Array.from({ length: Math.min(intervals, 100) }, (_, i) => ({
        timestamp: new Date(now - (intervals - i) * intervalMs).toISOString(),
        value: Math.floor(Math.random() * 20),
      }));

      const responseTime = Array.from({ length: Math.min(intervals, 100) }, (_, i) => ({
        timestamp: new Date(now - (intervals - i) * intervalMs).toISOString(),
        value: Math.floor(Math.random() * 200) + 100,
      }));

      const activeUsers = Array.from({ length: Math.min(intervals, 100) }, (_, i) => ({
        timestamp: new Date(now - (intervals - i) * intervalMs).toISOString(),
        value: Math.floor(Math.random() * 50) + 20,
      }));

      setMetrics({ requests, errors, responseTime, activeUsers });
    };

    generateMetrics();
    const interval = setInterval(generateMetrics, 30000);
    return () => clearInterval(interval);
  }, [timeRange]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy':
        return 'text-green-500 bg-green-500/10 border-green-500/20';
      case 'degraded':
        return 'text-yellow-500 bg-yellow-500/10 border-yellow-500/20';
      case 'down':
        return 'text-red-500 bg-red-500/10 border-red-500/20';
      default:
        return 'text-gray-500 bg-gray-500/10 border-gray-500/20';
    }
  };

  const getAlertIcon = (type: string) => {
    switch (type) {
      case 'critical':
        return <AlertTriangle className="h-4 w-4 text-red-500" />;
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      default:
        return <CheckCircle className="h-4 w-4 text-blue-500" />;
    }
  };

  const pieData = [
    { name: 'API Calls', value: 65, color: '#3b82f6' },
    { name: 'Database', value: 20, color: '#10b981' },
    { name: 'Storage', value: 10, color: '#f59e0b' },
    { name: 'Other', value: 5, color: '#6b7280' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white">System Monitoring</h1>
            <p className="text-white/60">Real-time performance and health metrics</p>
          </div>
          <div className="flex gap-2">
            {(['1h', '24h', '7d', '30d'] as const).map((range) => (
              <Button
                key={range}
                variant={timeRange === range ? 'default' : 'outline'}
                size="sm"
                onClick={() => setTimeRange(range)}
                className="border-white/20 text-white hover:bg-white/10"
              >
                {range}
              </Button>
            ))}
          </div>
        </div>

        {/* System Health */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="backdrop-blur-xl bg-white/5 border-white/10">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white/60 text-sm">API Status</p>
                  <Badge className={getStatusColor(systemHealth.api)}>
                    {systemHealth.api}
                  </Badge>
                </div>
                <Server className="h-8 w-8 text-white/40" />
              </div>
            </CardContent>
          </Card>

          <Card className="backdrop-blur-xl bg-white/5 border-white/10">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white/60 text-sm">Database</p>
                  <Badge className={getStatusColor(systemHealth.database)}>
                    {systemHealth.database}
                  </Badge>
                </div>
                <Database className="h-8 w-8 text-white/40" />
              </div>
            </CardContent>
          </Card>

          <Card className="backdrop-blur-xl bg-white/5 border-white/10">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white/60 text-sm">Uptime</p>
                  <p className="text-2xl font-bold text-white">{systemHealth.uptime}%</p>
                </div>
                <Activity className="h-8 w-8 text-white/40" />
              </div>
            </CardContent>
          </Card>

          <Card className="backdrop-blur-xl bg-white/5 border-white/10">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white/60 text-sm">Avg Response</p>
                  <p className="text-2xl font-bold text-white">{systemHealth.responseTime}ms</p>
                </div>
                <Clock className="h-8 w-8 text-white/40" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Charts Row 1 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="backdrop-blur-xl bg-white/5 border-white/10">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Activity className="h-5 w-5" />
                Request Volume
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={metrics.requests}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                  <XAxis dataKey="timestamp" stroke="rgba(255,255,255,0.5)" />
                  <YAxis stroke="rgba(255,255,255,0.5)" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'rgba(0,0,0,0.8)',
                      border: '1px solid rgba(255,255,255,0.2)',
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="value"
                    stroke="#3b82f6"
                    fill="#3b82f6"
                    fillOpacity={0.3}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card className="backdrop-blur-xl bg-white/5 border-white/10">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Response Time
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={metrics.responseTime}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                  <XAxis dataKey="timestamp" stroke="rgba(255,255,255,0.5)" />
                  <YAxis stroke="rgba(255,255,255,0.5)" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'rgba(0,0,0,0.8)',
                      border: '1px solid rgba(255,255,255,0.2)',
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="value"
                    stroke="#10b981"
                    strokeWidth={2}
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Charts Row 2 */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="backdrop-blur-xl bg-white/5 border-white/10">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Users className="h-5 w-5" />
                Active Users
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={metrics.activeUsers.slice(-20)}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                  <XAxis dataKey="timestamp" stroke="rgba(255,255,255,0.5)" />
                  <YAxis stroke="rgba(255,255,255,0.5)" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'rgba(0,0,0,0.8)',
                      border: '1px solid rgba(255,255,255,0.2)',
                    }}
                  />
                  <Bar dataKey="value" fill="#8b5cf6" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card className="backdrop-blur-xl bg-white/5 border-white/10">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Zap className="h-5 w-5" />
                Error Rate
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-white/60">Current</span>
                  <span className="text-2xl font-bold text-red-400">2.3%</span>
                </div>
                <Progress value={2.3} className="h-2" />
                <div className="flex items-center justify-between text-sm">
                  <span className="text-green-400 flex items-center gap-1">
                    <TrendingDown className="h-3 w-3" />
                    -0.5% from last hour
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="backdrop-blur-xl bg-white/5 border-white/10">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Database className="h-5 w-5" />
                Resource Usage
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'rgba(0,0,0,0.8)',
                      border: '1px solid rgba(255,255,255,0.2)',
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Alerts Section */}
        <Card className="backdrop-blur-xl bg-white/5 border-white/10">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              Recent Alerts
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {alerts.map((alert) => (
                <div
                  key={alert.id}
                  className="flex items-center justify-between p-3 rounded-lg bg-white/5 border border-white/10"
                >
                  <div className="flex items-center gap-3">
                    {getAlertIcon(alert.type)}
                    <div>
                      <p className="text-white font-medium">{alert.message}</p>
                      <p className="text-white/60 text-sm">{alert.timestamp}</p>
                    </div>
                  </div>
                  <Button variant="ghost" size="sm" className="text-white/60 hover:text-white">
                    View Details
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
