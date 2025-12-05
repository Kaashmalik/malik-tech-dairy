'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';
import { Heart, TrendingUp, Calendar, Activity } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AnimalHealthChartProps {
  animalId: string;
  className?: string;
}

interface HealthData {
  date: string;
  healthScore: number;
  temperature: number;
  heartRate: number;
  weight: number;
  event: string;
}

export function AnimalHealthChart({ animalId, className }: AnimalHealthChartProps) {
  const [healthData, setHealthData] = useState<HealthData[]>([]);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d'>('30d');

  useEffect(() => {
    fetchHealthData();
  }, [animalId, timeRange]);

  const fetchHealthData = async () => {
    try {
      setLoading(true);
      // Mock data for demonstration - replace with actual API call
      const mockData: HealthData[] = [
        { date: '2024-11-01', healthScore: 85, temperature: 38.5, heartRate: 72, weight: 450, event: 'Checkup' },
        { date: '2024-11-05', healthScore: 88, temperature: 38.3, heartRate: 70, weight: 452, event: 'Vaccination' },
        { date: '2024-11-10', healthScore: 82, temperature: 38.8, heartRate: 75, weight: 448, event: 'Treatment' },
        { date: '2024-11-15', healthScore: 90, temperature: 38.4, heartRate: 68, weight: 455, event: 'Checkup' },
        { date: '2024-11-20', healthScore: 87, temperature: 38.6, heartRate: 71, weight: 453, event: 'Normal' },
        { date: '2024-11-25', healthScore: 92, temperature: 38.2, heartRate: 66, weight: 458, event: 'Checkup' },
        { date: '2024-11-30', healthScore: 89, temperature: 38.5, heartRate: 69, weight: 456, event: 'Normal' },
      ];

      // Filter data based on time range
      const filteredData = mockData.slice(-getTimeRangeDays(timeRange));
      setHealthData(filteredData);
    } catch (error) {
      console.error('Error fetching health data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getTimeRangeDays = (range: string) => {
    switch (range) {
      case '7d': return 7;
      case '30d': return 30;
      case '90d': return 90;
      default: return 30;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric' 
    });
  };

  const getHealthScoreColor = (score: number) => {
    if (score >= 85) return '#10b981'; // green
    if (score >= 70) return '#f59e0b'; // yellow
    return '#ef4444'; // red
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
          <p className="text-sm font-medium text-gray-900">{formatDate(label)}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} className="text-sm" style={{ color: entry.color }}>
              {entry.name}: {entry.value}
              {entry.name === 'Health Score' && ' / 100'}
              {entry.name === 'Temperature' && '°C'}
              {entry.name === 'Heart Rate' && ' bpm'}
              {entry.name === 'Weight' && ' kg'}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  if (loading) {
    return (
      <Card className={cn('w-full', className)}>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Heart className="h-5 w-5 mr-2" />
            Health Trends
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            <div className="h-64 bg-gray-200 rounded"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn('w-full', className)}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center">
            <Heart className="h-5 w-5 mr-2" />
            Health Trends
          </CardTitle>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setTimeRange('7d')}
              className={cn(
                'px-3 py-1 text-sm rounded-md',
                timeRange === '7d' 
                  ? 'bg-blue-100 text-blue-800' 
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              )}
            >
              7D
            </button>
            <button
              onClick={() => setTimeRange('30d')}
              className={cn(
                'px-3 py-1 text-sm rounded-md',
                timeRange === '30d' 
                  ? 'bg-blue-100 text-blue-800' 
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              )}
            >
              30D
            </button>
            <button
              onClick={() => setTimeRange('90d')}
              className={cn(
                'px-3 py-1 text-sm rounded-md',
                timeRange === '90d' 
                  ? 'bg-blue-100 text-blue-800' 
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              )}
            >
              90D
            </button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Health Score Chart */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-medium text-gray-700">Health Score</h3>
              <div className="flex items-center space-x-2 text-sm text-gray-500">
                <TrendingUp className="h-4 w-4" />
                <span>Current: {healthData[healthData.length - 1]?.healthScore || 0}/100</span>
              </div>
            </div>
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={healthData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis 
                  dataKey="date" 
                  tickFormatter={formatDate}
                  stroke="#6b7280"
                  fontSize={12}
                />
                <YAxis 
                  domain={[0, 100]}
                  stroke="#6b7280"
                  fontSize={12}
                />
                <Tooltip content={<CustomTooltip />} />
                <Area
                  type="monotone"
                  dataKey="healthScore"
                  stroke={getHealthScoreColor(healthData[healthData.length - 1]?.healthScore || 0)}
                  fill={getHealthScoreColor(healthData[healthData.length - 1]?.healthScore || 0)}
                  fillOpacity={0.3}
                  strokeWidth={2}
                  name="Health Score"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Vital Signs Chart */}
          <div>
            <h3 className="text-sm font-medium text-gray-700 mb-4">Vital Signs</h3>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={healthData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis 
                  dataKey="date" 
                  tickFormatter={formatDate}
                  stroke="#6b7280"
                  fontSize={12}
                />
                <YAxis stroke="#6b7280" fontSize={12} />
                <Tooltip content={<CustomTooltip />} />
                <Line
                  type="monotone"
                  dataKey="temperature"
                  stroke="#ef4444"
                  strokeWidth={2}
                  dot={{ fill: '#ef4444', r: 3 }}
                  name="Temperature"
                />
                <Line
                  type="monotone"
                  dataKey="heartRate"
                  stroke="#3b82f6"
                  strokeWidth={2}
                  dot={{ fill: '#3b82f6', r: 3 }}
                  name="Heart Rate"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Weight Tracking */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-medium text-gray-700">Weight Tracking</h3>
              <div className="flex items-center space-x-2 text-sm text-gray-500">
                <Activity className="h-4 w-4" />
                <span>Current: {healthData[healthData.length - 1]?.weight || 0} kg</span>
              </div>
            </div>
            <ResponsiveContainer width="100%" height={150}>
              <LineChart data={healthData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis 
                  dataKey="date" 
                  tickFormatter={formatDate}
                  stroke="#6b7280"
                  fontSize={12}
                />
                <YAxis stroke="#6b7280" fontSize={12} />
                <Tooltip content={<CustomTooltip />} />
                <Line
                  type="monotone"
                  dataKey="weight"
                  stroke="#10b981"
                  strokeWidth={2}
                  dot={{ fill: '#10b981', r: 3 }}
                  name="Weight"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Health Events */}
          <div>
            <h3 className="text-sm font-medium text-gray-700 mb-3">Recent Health Events</h3>
            <div className="space-y-2">
              {healthData
                .filter(d => d.event !== 'Normal')
                .slice(-5)
                .reverse()
                .map((event, index) => (
                  <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                    <div className="flex items-center space-x-2">
                      <Calendar className="h-4 w-4 text-gray-500" />
                      <span className="text-sm text-gray-600">{formatDate(event.date)}</span>
                    </div>
                    <span className="text-sm font-medium text-gray-900">{event.event}</span>
                  </div>
                ))}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
