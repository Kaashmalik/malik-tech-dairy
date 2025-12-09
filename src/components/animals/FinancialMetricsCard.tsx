'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  Calculator,
  Download,
  Eye,
  PiggyBank,
  Receipt,
  Target,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface FinancialMetricsCardProps {
  animalId: string;
  className?: string;
}

interface FinancialData {
  acquisitionCost: number;
  totalRevenue: number;
  totalExpenses: number;
  currentValue: number;
  monthlyRevenue: number;
  monthlyExpenses: number;
  roi: number;
  profitabilityScore: number;
  revenueBreakdown: {
    milk: number;
    breeding: number;
    sales: number;
  };
  expenseBreakdown: {
    feed: number;
    veterinary: number;
    labor: number;
    maintenance: number;
  };
}

export function FinancialMetricsCard({ animalId, className }: FinancialMetricsCardProps) {
  const [financialData, setFinancialData] = useState<FinancialData | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<'monthly' | 'yearly' | 'lifetime'>('lifetime');

  useEffect(() => {
    fetchFinancialData();
  }, [animalId, timeRange]);

  const fetchFinancialData = async () => {
    try {
      setLoading(true);
      // Mock data for demonstration - replace with actual API call
      const mockData: FinancialData = {
        acquisitionCost: 45000,
        totalRevenue: 285000,
        totalExpenses: 125000,
        currentValue: 180000,
        monthlyRevenue: 8500,
        monthlyExpenses: 3200,
        roi: 533,
        profitabilityScore: 85,
        revenueBreakdown: {
          milk: 220000,
          breeding: 45000,
          sales: 20000,
        },
        expenseBreakdown: {
          feed: 65000,
          veterinary: 25000,
          labor: 25000,
          maintenance: 10000,
        },
      };

      // Adjust data based on time range
      let adjustedData = { ...mockData };
      if (timeRange === 'monthly') {
        adjustedData.totalRevenue = mockData.monthlyRevenue;
        adjustedData.totalExpenses = mockData.monthlyExpenses;
        adjustedData.acquisitionCost = 0; // Don't include acquisition in monthly
      } else if (timeRange === 'yearly') {
        adjustedData.totalRevenue = mockData.monthlyRevenue * 12;
        adjustedData.totalExpenses = mockData.monthlyExpenses * 12;
      }

      setFinancialData(adjustedData);
    } catch (error) {
      console.error('Error fetching financial data:', error);
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

  const getROIColor = (roi: number) => {
    if (roi >= 200) return 'text-green-600';
    if (roi >= 100) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getProfitabilityColor = (score: number) => {
    if (score >= 80) return 'bg-green-100 text-green-800';
    if (score >= 60) return 'bg-yellow-100 text-yellow-800';
    return 'bg-red-100 text-red-800';
  };

  const getProfitabilityLabel = (score: number) => {
    if (score >= 80) return 'Highly Profitable';
    if (score >= 60) return 'Profitable';
    if (score >= 40) return 'Breaking Even';
    return 'Loss Making';
  };

  if (loading) {
    return (
      <Card className={cn('w-full', className)}>
        <CardHeader>
          <CardTitle className='flex items-center'>
            <DollarSign className='mr-2 h-5 w-5' />
            Financial Metrics
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className='animate-pulse space-y-4'>
            <div className='h-8 w-1/3 rounded bg-gray-200'></div>
            <div className='h-4 w-1/2 rounded bg-gray-200'></div>
            <div className='h-20 rounded bg-gray-200'></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!financialData) {
    return (
      <Card className={cn('w-full', className)}>
        <CardContent className='p-6'>
          <div className='text-center text-gray-500'>
            <Calculator className='mx-auto mb-4 h-12 w-12 opacity-50' />
            <p>Financial data not available</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const netProfit = financialData.totalRevenue - financialData.totalExpenses;
  const profitMargin =
    financialData.totalRevenue > 0 ? (netProfit / financialData.totalRevenue) * 100 : 0;

  return (
    <Card className={cn('w-full', className)}>
      <CardHeader>
        <div className='flex items-center justify-between'>
          <CardTitle className='flex items-center'>
            <DollarSign className='mr-2 h-5 w-5' />
            Financial Metrics
          </CardTitle>
          <div className='flex items-center space-x-2'>
            <button
              onClick={() => setTimeRange('monthly')}
              className={cn(
                'rounded-md px-3 py-1 text-sm',
                timeRange === 'monthly'
                  ? 'bg-blue-100 text-blue-800'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              )}
            >
              Monthly
            </button>
            <button
              onClick={() => setTimeRange('yearly')}
              className={cn(
                'rounded-md px-3 py-1 text-sm',
                timeRange === 'yearly'
                  ? 'bg-blue-100 text-blue-800'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              )}
            >
              Yearly
            </button>
            <button
              onClick={() => setTimeRange('lifetime')}
              className={cn(
                'rounded-md px-3 py-1 text-sm',
                timeRange === 'lifetime'
                  ? 'bg-blue-100 text-blue-800'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              )}
            >
              Lifetime
            </button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className='space-y-6'>
          {/* Profitability Overview */}
          <div className='grid grid-cols-1 gap-4 md:grid-cols-3'>
            <div className='rounded-lg bg-green-50 p-4'>
              <div className='flex items-center justify-between'>
                <div>
                  <p className='text-sm font-medium text-green-600'>Net Profit</p>
                  <p className='text-2xl font-bold text-green-900'>{formatCurrency(netProfit)}</p>
                  <p className='text-xs text-green-700'>{profitMargin.toFixed(1)}% margin</p>
                </div>
                {netProfit >= 0 ? (
                  <TrendingUp className='h-8 w-8 text-green-600' />
                ) : (
                  <TrendingDown className='h-8 w-8 text-red-600' />
                )}
              </div>
            </div>

            <div className='rounded-lg bg-blue-50 p-4'>
              <div className='flex items-center justify-between'>
                <div>
                  <p className='text-sm font-medium text-blue-600'>Return on Investment</p>
                  <p className={cn('text-2xl font-bold', getROIColor(financialData.roi))}>
                    {financialData.roi.toFixed(0)}%
                  </p>
                  <p className='text-xs text-blue-700'>
                    {timeRange === 'lifetime' ? 'Lifetime ROI' : 'Period ROI'}
                  </p>
                </div>
                <Target className='h-8 w-8 text-blue-600' />
              </div>
            </div>

            <div className='rounded-lg bg-purple-50 p-4'>
              <div className='flex items-center justify-between'>
                <div>
                  <p className='text-sm font-medium text-purple-600'>Current Value</p>
                  <p className='text-2xl font-bold text-purple-900'>
                    {formatCurrency(financialData.currentValue)}
                  </p>
                  <p className='text-xs text-purple-700'>Market valuation</p>
                </div>
                <PiggyBank className='h-8 w-8 text-purple-600' />
              </div>
            </div>
          </div>

          {/* Profitability Score */}
          <div className='rounded-lg bg-gray-50 p-4'>
            <div className='mb-2 flex items-center justify-between'>
              <span className='text-sm font-medium text-gray-700'>Profitability Score</span>
              <Badge className={getProfitabilityColor(financialData.profitabilityScore)}>
                {getProfitabilityLabel(financialData.profitabilityScore)}
              </Badge>
            </div>
            <div className='flex items-center space-x-4'>
              <div className='flex-1'>
                <div className='h-3 overflow-hidden rounded-full bg-gray-200'>
                  <div
                    className={cn(
                      'h-full transition-all duration-300',
                      financialData.profitabilityScore >= 80
                        ? 'bg-green-500'
                        : financialData.profitabilityScore >= 60
                          ? 'bg-yellow-500'
                          : 'bg-red-500'
                    )}
                    style={{ width: `${financialData.profitabilityScore}%` }}
                  />
                </div>
              </div>
              <span className='text-sm font-bold text-gray-700'>
                {financialData.profitabilityScore}/100
              </span>
            </div>
          </div>

          {/* Revenue & Expense Breakdown */}
          <div className='grid grid-cols-1 gap-6 md:grid-cols-2'>
            {/* Revenue Breakdown */}
            <div>
              <h4 className='mb-3 flex items-center text-sm font-medium text-gray-700'>
                <TrendingUp className='mr-2 h-4 w-4' />
                Revenue Breakdown
              </h4>
              <div className='space-y-2'>
                <div className='flex items-center justify-between rounded bg-gray-50 p-2'>
                  <span className='text-sm text-gray-600'>Milk Sales</span>
                  <span className='text-sm font-medium'>
                    {formatCurrency(financialData.revenueBreakdown.milk)}
                  </span>
                </div>
                <div className='flex items-center justify-between rounded bg-gray-50 p-2'>
                  <span className='text-sm text-gray-600'>Breeding Services</span>
                  <span className='text-sm font-medium'>
                    {formatCurrency(financialData.revenueBreakdown.breeding)}
                  </span>
                </div>
                <div className='flex items-center justify-between rounded bg-gray-50 p-2'>
                  <span className='text-sm text-gray-600'>Animal Sales</span>
                  <span className='text-sm font-medium'>
                    {formatCurrency(financialData.revenueBreakdown.sales)}
                  </span>
                </div>
                <div className='flex items-center justify-between rounded bg-blue-50 p-2 font-medium'>
                  <span className='text-sm text-blue-700'>Total Revenue</span>
                  <span className='text-sm text-blue-900'>
                    {formatCurrency(financialData.totalRevenue)}
                  </span>
                </div>
              </div>
            </div>

            {/* Expense Breakdown */}
            <div>
              <h4 className='mb-3 flex items-center text-sm font-medium text-gray-700'>
                <Receipt className='mr-2 h-4 w-4' />
                Expense Breakdown
              </h4>
              <div className='space-y-2'>
                <div className='flex items-center justify-between rounded bg-gray-50 p-2'>
                  <span className='text-sm text-gray-600'>Feed & Nutrition</span>
                  <span className='text-sm font-medium'>
                    {formatCurrency(financialData.expenseBreakdown.feed)}
                  </span>
                </div>
                <div className='flex items-center justify-between rounded bg-gray-50 p-2'>
                  <span className='text-sm text-gray-600'>Veterinary Care</span>
                  <span className='text-sm font-medium'>
                    {formatCurrency(financialData.expenseBreakdown.veterinary)}
                  </span>
                </div>
                <div className='flex items-center justify-between rounded bg-gray-50 p-2'>
                  <span className='text-sm text-gray-600'>Labor Costs</span>
                  <span className='text-sm font-medium'>
                    {formatCurrency(financialData.expenseBreakdown.labor)}
                  </span>
                </div>
                <div className='flex items-center justify-between rounded bg-gray-50 p-2'>
                  <span className='text-sm text-gray-600'>Maintenance</span>
                  <span className='text-sm font-medium'>
                    {formatCurrency(financialData.expenseBreakdown.maintenance)}
                  </span>
                </div>
                <div className='flex items-center justify-between rounded bg-red-50 p-2 font-medium'>
                  <span className='text-sm text-red-700'>Total Expenses</span>
                  <span className='text-sm text-red-900'>
                    {formatCurrency(financialData.totalExpenses)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Key Financial Metrics */}
          <div className='grid grid-cols-2 gap-4 md:grid-cols-4'>
            <div className='rounded bg-gray-50 p-3 text-center'>
              <p className='mb-1 text-xs text-gray-600'>Cost per Day</p>
              <p className='text-lg font-bold text-gray-900'>
                {formatCurrency(financialData.totalExpenses / 365)}
              </p>
            </div>
            <div className='rounded bg-gray-50 p-3 text-center'>
              <p className='mb-1 text-xs text-gray-600'>Revenue per Day</p>
              <p className='text-lg font-bold text-gray-900'>
                {formatCurrency(financialData.totalRevenue / 365)}
              </p>
            </div>
            <div className='rounded bg-gray-50 p-3 text-center'>
              <p className='mb-1 text-xs text-gray-600'>Daily Profit</p>
              <p className='text-lg font-bold text-green-600'>{formatCurrency(netProfit / 365)}</p>
            </div>
            <div className='rounded bg-gray-50 p-3 text-center'>
              <p className='mb-1 text-xs text-gray-600'>Acquisition Cost</p>
              <p className='text-lg font-bold text-gray-900'>
                {formatCurrency(financialData.acquisitionCost)}
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className='flex items-center space-x-2'>
            <Button variant='outline' size='sm'>
              <Download className='mr-2 h-4 w-4' />
              Export Report
            </Button>
            <Button variant='outline' size='sm'>
              <Eye className='mr-2 h-4 w-4' />
              View Details
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
