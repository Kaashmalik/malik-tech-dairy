'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';
import { BarChart3, TrendingUp, Calendar } from 'lucide-react';
import { cn } from '@/lib/utils';

interface FeedAnalyticsChartProps {
  analytics: {
    totalValue: number;
    totalItems: number;
    totalStock: number;
    lowStockItems: number;
    expiringItems: number;
    categoryBreakdown: Array<{
      category: string;
      totalValue: number;
      totalStock: number;
      itemCount: number;
      percentage: number;
    }>;
    efficiencyMetrics: {
      averageDaysOfSupply: number;
      stockTurnoverRate: number;
      wastePercentage: number;
      costPerDay: number;
    };
  };
  className?: string;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

export function FeedAnalyticsChart({ analytics, className }: FeedAnalyticsChartProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-PK', {
      style: 'currency',
      currency: 'PKR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  // Mock consumption trend data
  const consumptionTrend = [
    { month: 'Jan', consumption: 1200, cost: 144000 },
    { month: 'Feb', consumption: 1350, cost: 162000 },
    { month: 'Mar', consumption: 1100, cost: 132000 },
    { month: 'Apr', consumption: 1400, cost: 168000 },
    { month: 'May', consumption: 1550, cost: 186000 },
    { month: 'Jun', consumption: 1450, cost: 174000 },
  ];

  return (
    <div className={cn('w-full space-y-6', className)}>
      {/* Category Distribution */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <BarChart3 className="h-5 w-5 mr-2" />
            Inventory Distribution by Category
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-4">Value Distribution</h4>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={analytics.categoryBreakdown}
                    dataKey="totalValue"
                    nameKey="category"
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    label={({ category, percentage }) => `${category}: ${percentage.toFixed(1)}%`}
                  >
                    {analytics.categoryBreakdown.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: number) => formatCurrency(value)} />
                </PieChart>
              </ResponsiveContainer>
            </div>

            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-4">Stock Levels</h4>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={analytics.categoryBreakdown}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="category" />
                  <YAxis />
                  <Tooltip formatter={(value: number) => `${value} kg`} />
                  <Bar dataKey="totalStock" fill="#8884d8" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Consumption Trends */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <TrendingUp className="h-5 w-5 mr-2" />
            Consumption & Cost Trends (Last 6 Months)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={consumptionTrend}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis yAxisId="left" />
              <YAxis yAxisId="right" orientation="right" />
              <Tooltip />
              <Bar yAxisId="left" dataKey="consumption" fill="#8884d8" name="Consumption (kg)" />
              <Line yAxisId="right" type="monotone" dataKey="cost" stroke="#82ca9d" strokeWidth={2} name="Cost (PKR)" />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Efficiency Metrics */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Calendar className="h-5 w-5 mr-2" />
            Efficiency Metrics Overview
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-4 bg-blue-50 rounded-lg text-center">
              <div className="text-2xl font-bold text-blue-900">
                {analytics.efficiencyMetrics.averageDaysOfSupply}
              </div>
              <div className="text-sm text-blue-700">Avg Days of Supply</div>
            </div>
            <div className="p-4 bg-green-50 rounded-lg text-center">
              <div className="text-2xl font-bold text-green-900">
                {analytics.efficiencyMetrics.stockTurnoverRate}
              </div>
              <div className="text-sm text-green-700">Turnover Rate/Year</div>
            </div>
            <div className="p-4 bg-red-50 rounded-lg text-center">
              <div className="text-2xl font-bold text-red-900">
                {analytics.efficiencyMetrics.wastePercentage}%
              </div>
              <div className="text-sm text-red-700">Waste Percentage</div>
            </div>
            <div className="p-4 bg-purple-50 rounded-lg text-center">
              <div className="text-2xl font-bold text-purple-900">
                {formatCurrency(analytics.efficiencyMetrics.costPerDay)}
              </div>
              <div className="text-sm text-purple-700">Daily Cost</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
