'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, ComposedChart } from 'recharts';
import { TrendingUp, Droplets, Calendar, Target, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface MilkProductionChartProps {
  animalId: string;
  className?: string;
}

interface MilkData {
  date: string;
  morningYield: number;
  eveningYield: number;
  totalYield: number;
  qualityScore: number;
  butterfat: number;
  protein: number;
}

export function MilkProductionChart({ animalId, className }: MilkProductionChartProps) {
  const [milkData, setMilkData] = useState<MilkData[]>([]);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d'>('30d');
  const [chartType, setChartType] = useState<'yield' | 'quality' | 'composition'>('yield');

  useEffect(() => {
    fetchMilkData();
  }, [animalId, timeRange]);

  const fetchMilkData = async () => {
    try {
      setLoading(true);
      // Mock data for demonstration - replace with actual API call
      const mockData: MilkData[] = [
        { date: '2024-11-01', morningYield: 12.5, eveningYield: 11.8, totalYield: 24.3, qualityScore: 85, butterfat: 3.8, protein: 3.2 },
        { date: '2024-11-02', morningYield: 13.2, eveningYield: 12.1, totalYield: 25.3, qualityScore: 87, butterfat: 3.9, protein: 3.3 },
        { date: '2024-11-03', morningYield: 11.8, eveningYield: 11.5, totalYield: 23.3, qualityScore: 82, butterfat: 3.7, protein: 3.1 },
        { date: '2024-11-04', morningYield: 14.1, eveningYield: 13.2, totalYield: 27.3, qualityScore: 90, butterfat: 4.1, protein: 3.4 },
        { date: '2024-11-05', morningYield: 12.9, eveningYield: 12.4, totalYield: 25.3, qualityScore: 86, butterfat: 3.9, protein: 3.3 },
        { date: '2024-11-06', morningYield: 13.5, eveningYield: 12.8, totalYield: 26.3, qualityScore: 88, butterfat: 4.0, protein: 3.3 },
        { date: '2024-11-07', morningYield: 12.2, eveningYield: 11.9, totalYield: 24.1, qualityScore: 84, butterfat: 3.8, protein: 3.2 },
        { date: '2024-11-08', morningYield: 13.8, eveningYield: 13.1, totalYield: 26.9, qualityScore: 89, butterfat: 4.0, protein: 3.4 },
        { date: '2024-11-09', morningYield: 12.6, eveningYield: 12.2, totalYield: 24.8, qualityScore: 85, butterfat: 3.8, protein: 3.2 },
        { date: '2024-11-10', morningYield: 14.3, eveningYield: 13.5, totalYield: 27.8, qualityScore: 91, butterfat: 4.2, protein: 3.5 },
      ];

      // Filter data based on time range
      const filteredData = mockData.slice(-getTimeRangeDays(timeRange));
      setMilkData(filteredData);
    } catch (error) {
      console.error('Error fetching milk data:', error);
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

  const calculateAverage = (data: MilkData[], field: keyof MilkData) => {
    const values = data.map(d => Number(d[field])).filter(v => !isNaN(v));
    return values.length > 0 ? values.reduce((a, b) => a + b, 0) / values.length : 0;
  };

  const calculateTrend = (data: MilkData[], field: keyof MilkData) => {
    if (data.length < 2) return 0;
    const recent = data.slice(-7);
    const previous = data.slice(-14, -7);
    
    const recentAvg = calculateAverage(recent, field);
    const previousAvg = calculateAverage(previous, field);
    
    return previousAvg > 0 ? ((recentAvg - previousAvg) / previousAvg) * 100 : 0;
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
          <p className="text-sm font-medium text-gray-900">{formatDate(label)}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} className="text-sm" style={{ color: entry.color }}>
              {entry.name}: {entry.value}
              {entry.name === 'Total Yield' && ' L'}
              {entry.name === 'Morning Yield' && ' L'}
              {entry.name === 'Evening Yield' && ' L'}
              {entry.name === 'Quality Score' && ' / 100'}
              {(entry.name === 'Butterfat' || entry.name === 'Protein') && ' %'}
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
            <Droplets className="h-5 w-5 mr-2" />
            Milk Production Analytics
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

  const avgYield = calculateAverage(milkData, 'totalYield');
  const yieldTrend = calculateTrend(milkData, 'totalYield');
  const avgQuality = calculateAverage(milkData, 'qualityScore');
  const qualityTrend = calculateTrend(milkData, 'qualityScore');

  return (
    <Card className={cn('w-full', className)}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center">
            <Droplets className="h-5 w-5 mr-2" />
            Milk Production Analytics
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
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-blue-50 p-4 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-blue-600 font-medium">Average Daily Yield</p>
                <p className="text-2xl font-bold text-blue-900">{avgYield.toFixed(1)} L</p>
              </div>
              <div className="flex items-center space-x-1">
                {yieldTrend > 0 ? (
                  <TrendingUp className="h-4 w-4 text-green-600" />
                ) : (
                  <AlertTriangle className="h-4 w-4 text-red-600" />
                )}
                <span className={cn(
                  'text-sm font-medium',
                  yieldTrend > 0 ? 'text-green-600' : 'text-red-600'
                )}>
                  {yieldTrend > 0 ? '+' : ''}{yieldTrend.toFixed(1)}%
                </span>
              </div>
            </div>
          </div>

          <div className="bg-green-50 p-4 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-green-600 font-medium">Quality Score</p>
                <p className="text-2xl font-bold text-green-900">{avgQuality.toFixed(0)}/100</p>
              </div>
              <div className="flex items-center space-x-1">
                {qualityTrend > 0 ? (
                  <TrendingUp className="h-4 w-4 text-green-600" />
                ) : (
                  <AlertTriangle className="h-4 w-4 text-red-600" />
                )}
                <span className={cn(
                  'text-sm font-medium',
                  qualityTrend > 0 ? 'text-green-600' : 'text-red-600'
                )}>
                  {qualityTrend > 0 ? '+' : ''}{qualityTrend.toFixed(1)}%
                </span>
              </div>
            </div>
          </div>

          <div className="bg-purple-50 p-4 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-purple-600 font-medium">Monthly Projection</p>
                <p className="text-2xl font-bold text-purple-900">{(avgYield * 30).toFixed(0)} L</p>
              </div>
              <Target className="h-8 w-8 text-purple-600" />
            </div>
          </div>
        </div>

        {/* Chart Type Selector */}
        <div className="flex items-center space-x-2 mb-6">
          <button
            onClick={() => setChartType('yield')}
            className={cn(
              'px-4 py-2 text-sm font-medium rounded-md',
              chartType === 'yield' 
                ? 'bg-blue-600 text-white' 
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            )}
          >
            Yield Analysis
          </button>
          <button
            onClick={() => setChartType('quality')}
            className={cn(
              'px-4 py-2 text-sm font-medium rounded-md',
              chartType === 'quality' 
                ? 'bg-blue-600 text-white' 
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            )}
          >
            Quality Trends
          </button>
          <button
            onClick={() => setChartType('composition')}
            className={cn(
              'px-4 py-2 text-sm font-medium rounded-md',
              chartType === 'composition' 
                ? 'bg-blue-600 text-white' 
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            )}
          >
            Milk Composition
          </button>
        </div>

        {/* Charts */}
        <div className="space-y-6">
          {chartType === 'yield' && (
            <div>
              <h3 className="text-sm font-medium text-gray-700 mb-4">Daily Milk Production</h3>
              <ResponsiveContainer width="100%" height={300}>
                <ComposedChart data={milkData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis 
                    dataKey="date" 
                    tickFormatter={formatDate}
                    stroke="#6b7280"
                    fontSize={12}
                  />
                  <YAxis stroke="#6b7280" fontSize={12} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="morningYield" fill="#60a5fa" name="Morning Yield" />
                  <Bar dataKey="eveningYield" fill="#93c5fd" name="Evening Yield" />
                  <Line 
                    type="monotone" 
                    dataKey="totalYield" 
                    stroke="#1f2937" 
                    strokeWidth={3}
                    dot={{ fill: '#1f2937', r: 4 }}
                    name="Total Yield"
                  />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          )}

          {chartType === 'quality' && (
            <div>
              <h3 className="text-sm font-medium text-gray-700 mb-4">Milk Quality Score</h3>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={milkData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis 
                    dataKey="date" 
                    tickFormatter={formatDate}
                    stroke="#6b7280"
                    fontSize={12}
                  />
                  <YAxis domain={[70, 100]} stroke="#6b7280" fontSize={12} />
                  <Tooltip content={<CustomTooltip />} />
                  <Line
                    type="monotone"
                    dataKey="qualityScore"
                    stroke="#10b981"
                    strokeWidth={3}
                    dot={{ fill: '#10b981', r: 4 }}
                    name="Quality Score"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}

          {chartType === 'composition' && (
            <div>
              <h3 className="text-sm font-medium text-gray-700 mb-4">Milk Composition (%)</h3>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={milkData}>
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
                    dataKey="butterfat"
                    stroke="#f59e0b"
                    strokeWidth={2}
                    dot={{ fill: '#f59e0b', r: 3 }}
                    name="Butterfat"
                  />
                  <Line
                    type="monotone"
                    dataKey="protein"
                    stroke="#8b5cf6"
                    strokeWidth={2}
                    dot={{ fill: '#8b5cf6', r: 3 }}
                    name="Protein"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* Performance Insights */}
        <div className="mt-6 p-4 bg-gray-50 rounded-lg">
          <h3 className="text-sm font-medium text-gray-700 mb-2">Performance Insights</h3>
          <div className="space-y-1">
            {yieldTrend > 5 && (
              <p className="text-sm text-green-600">• Excellent yield improvement of {yieldTrend.toFixed(1)}% this period</p>
            )}
            {yieldTrend < -5 && (
              <p className="text-sm text-red-600">• Yield decline detected ({yieldTrend.toFixed(1)}%) - consider health check</p>
            )}
            {avgQuality > 85 && (
              <p className="text-sm text-green-600">• High milk quality maintained ({avgQuality.toFixed(0)}/100)</p>
            )}
            {avgQuality < 80 && (
              <p className="text-sm text-yellow-600">• Quality score below optimal ({avgQuality.toFixed(0)}/100)</p>
            )}
            {avgYield > 25 && (
              <p className="text-sm text-blue-600">• Top performer with {avgYield.toFixed(1)}L daily average</p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
