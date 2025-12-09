'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import {
  Package,
  AlertTriangle,
  TrendingUp,
  DollarSign,
  Calendar,
  Filter,
  Download,
  Plus,
  Eye,
  BarChart3,
  Clock,
  CheckCircle,
  XCircle,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { FeedInventoryTable } from './FeedInventoryTable';
import { FeedAnalyticsChart } from './FeedAnalyticsChart';
import { NutritionOptimizer } from './NutritionOptimizer';

interface FeedAnalytics {
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
}

export function FeedManagementDashboard({ className }: { className?: string }) {
  const [analytics, setAnalytics] = useState<FeedAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/feed-management/enhanced');
      const result = await response.json();

      if (result.success) {
        setAnalytics(result.data.analytics);
      } else {
        console.error('Failed to fetch analytics:', result.error);
      }
    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-PK', {
      style: 'currency',
      currency: 'PKR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatWeight = (amount: number) => {
    if (amount >= 1000) {
      return `${(amount / 1000).toFixed(1)} tons`;
    }
    return `${amount.toFixed(0)} kg`;
  };

  const getStockStatusColor = (status: string) => {
    switch (status) {
      case 'critical':
        return 'bg-red-100 text-red-800';
      case 'low':
        return 'bg-yellow-100 text-yellow-800';
      case 'overstock':
        return 'bg-blue-100 text-blue-800';
      case 'adequate':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className={cn('w-full space-y-6', className)}>
        <div className='animate-pulse space-y-4'>
          <div className='h-8 w-1/3 rounded bg-gray-200'></div>
          <div className='grid grid-cols-1 gap-4 md:grid-cols-4'>
            <div className='h-24 rounded bg-gray-200'></div>
            <div className='h-24 rounded bg-gray-200'></div>
            <div className='h-24 rounded bg-gray-200'></div>
            <div className='h-24 rounded bg-gray-200'></div>
          </div>
        </div>
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className={cn('w-full', className)}>
        <Card>
          <CardContent className='p-6'>
            <div className='text-center text-gray-500'>
              <Package className='mx-auto mb-4 h-12 w-12 opacity-50' />
              <p>Feed analytics not available</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className={cn('w-full space-y-6', className)}>
      {/* Header */}
      <div className='flex items-center justify-between'>
        <div>
          <h1 className='text-2xl font-bold text-gray-900'>Feed Management</h1>
          <p className='text-gray-600'>Monitor inventory, optimize nutrition, and control costs</p>
        </div>
        <div className='flex items-center space-x-2'>
          <Button variant='outline'>
            <Download className='mr-2 h-4 w-4' />
            Export Report
          </Button>
          <Button>
            <Plus className='mr-2 h-4 w-4' />
            Add Feed Item
          </Button>
        </div>
      </div>

      {/* Key Metrics Cards */}
      <div className='grid grid-cols-1 gap-4 md:grid-cols-4'>
        <Card>
          <CardContent className='p-6'>
            <div className='flex items-center justify-between'>
              <div>
                <p className='text-sm font-medium text-gray-600'>Total Inventory Value</p>
                <p className='text-2xl font-bold text-gray-900'>
                  {formatCurrency(analytics.totalValue)}
                </p>
                <p className='text-xs text-gray-500'>{analytics.totalItems} items</p>
              </div>
              <DollarSign className='h-8 w-8 text-green-600' />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className='p-6'>
            <div className='flex items-center justify-between'>
              <div>
                <p className='text-sm font-medium text-gray-600'>Total Stock</p>
                <p className='text-2xl font-bold text-gray-900'>
                  {formatWeight(analytics.totalStock)}
                </p>
                <p className='text-xs text-gray-500'>Across all categories</p>
              </div>
              <Package className='h-8 w-8 text-blue-600' />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className='p-6'>
            <div className='flex items-center justify-between'>
              <div>
                <p className='text-sm font-medium text-gray-600'>Low Stock Alerts</p>
                <p className='text-2xl font-bold text-red-600'>{analytics.lowStockItems}</p>
                <p className='text-xs text-gray-500'>Need reordering</p>
              </div>
              <AlertTriangle className='h-8 w-8 text-red-600' />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className='p-6'>
            <div className='flex items-center justify-between'>
              <div>
                <p className='text-sm font-medium text-gray-600'>Expiring Soon</p>
                <p className='text-2xl font-bold text-orange-600'>{analytics.expiringItems}</p>
                <p className='text-xs text-gray-500'>Within 30 days</p>
              </div>
              <Clock className='h-8 w-8 text-orange-600' />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className='w-full'>
        <TabsList className='grid w-full grid-cols-4'>
          <TabsTrigger value='overview'>Overview</TabsTrigger>
          <TabsTrigger value='inventory'>Inventory</TabsTrigger>
          <TabsTrigger value='nutrition'>Nutrition</TabsTrigger>
          <TabsTrigger value='analytics'>Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value='overview' className='space-y-6'>
          {/* Category Breakdown */}
          <div className='grid grid-cols-1 gap-6 lg:grid-cols-2'>
            <Card>
              <CardHeader>
                <CardTitle className='flex items-center'>
                  <BarChart3 className='mr-2 h-5 w-5' />
                  Inventory by Category
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className='space-y-4'>
                  {analytics.categoryBreakdown.map((category, index) => (
                    <div key={index} className='space-y-2'>
                      <div className='flex items-center justify-between'>
                        <span className='text-sm font-medium capitalize text-gray-700'>
                          {category.category}
                        </span>
                        <span className='text-sm text-gray-500'>
                          {formatCurrency(category.totalValue)} ({category.percentage.toFixed(1)}%)
                        </span>
                      </div>
                      <Progress value={category.percentage} className='h-2' />
                      <div className='flex items-center justify-between text-xs text-gray-500'>
                        <span>{category.itemCount} items</span>
                        <span>{formatWeight(category.totalStock)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Efficiency Metrics */}
            <Card>
              <CardHeader>
                <CardTitle className='flex items-center'>
                  <TrendingUp className='mr-2 h-5 w-5' />
                  Efficiency Metrics
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className='space-y-4'>
                  <div className='rounded-lg bg-gray-50 p-4'>
                    <div className='mb-2 flex items-center justify-between'>
                      <span className='text-sm font-medium text-gray-700'>
                        Average Days of Supply
                      </span>
                      <span className='text-sm font-bold text-gray-900'>
                        {analytics.efficiencyMetrics.averageDaysOfSupply} days
                      </span>
                    </div>
                    <Progress
                      value={(analytics.efficiencyMetrics.averageDaysOfSupply / 90) * 100}
                      className='h-2'
                    />
                  </div>

                  <div className='rounded-lg bg-gray-50 p-4'>
                    <div className='mb-2 flex items-center justify-between'>
                      <span className='text-sm font-medium text-gray-700'>Stock Turnover Rate</span>
                      <span className='text-sm font-bold text-gray-900'>
                        {analytics.efficiencyMetrics.stockTurnoverRate}/year
                      </span>
                    </div>
                    <Progress
                      value={(analytics.efficiencyMetrics.stockTurnoverRate / 12) * 100}
                      className='h-2'
                    />
                  </div>

                  <div className='rounded-lg bg-gray-50 p-4'>
                    <div className='mb-2 flex items-center justify-between'>
                      <span className='text-sm font-medium text-gray-700'>Waste Percentage</span>
                      <span className='text-sm font-bold text-red-600'>
                        {analytics.efficiencyMetrics.wastePercentage}%
                      </span>
                    </div>
                    <Progress value={analytics.efficiencyMetrics.wastePercentage} className='h-2' />
                  </div>

                  <div className='rounded-lg bg-gray-50 p-4'>
                    <div className='flex items-center justify-between'>
                      <span className='text-sm font-medium text-gray-700'>Daily Cost</span>
                      <span className='text-sm font-bold text-gray-900'>
                        {formatCurrency(analytics.efficiencyMetrics.costPerDay)}
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className='grid grid-cols-1 gap-4 md:grid-cols-3'>
                <Button variant='outline' className='h-16 flex-col'>
                  <AlertTriangle className='mb-2 h-6 w-6' />
                  <span>Review Low Stock</span>
                </Button>
                <Button variant='outline' className='h-16 flex-col'>
                  <Calendar className='mb-2 h-6 w-6' />
                  <span>Schedule Orders</span>
                </Button>
                <Button variant='outline' className='h-16 flex-col'>
                  <Eye className='mb-2 h-6 w-6' />
                  <span>Quality Check</span>
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value='inventory' className='space-y-4'>
          <FeedInventoryTable />
        </TabsContent>

        <TabsContent value='nutrition' className='space-y-4'>
          <NutritionOptimizer />
        </TabsContent>

        <TabsContent value='analytics' className='space-y-4'>
          <FeedAnalyticsChart analytics={analytics} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
