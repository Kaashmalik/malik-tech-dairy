// Super Admin - Analytics Page
'use client';

import { BarChart3, TrendingUp, Users, Building2, CreditCard, Calendar } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useState } from 'react';

export default function AnalyticsPage() {
  const [period, setPeriod] = useState('30d');

  const stats = [
    {
      label: 'Total Revenue',
      value: 'Rs. 149,970',
      change: '+12%',
      icon: CreditCard,
      color: 'bg-emerald-100 text-emerald-600',
    },
    {
      label: 'New Farms',
      value: '24',
      change: '+8%',
      icon: Building2,
      color: 'bg-blue-100 text-blue-600',
    },
    {
      label: 'New Users',
      value: '156',
      change: '+15%',
      icon: Users,
      color: 'bg-purple-100 text-purple-600',
    },
    {
      label: 'Conversion Rate',
      value: '68%',
      change: '+5%',
      icon: TrendingUp,
      color: 'bg-amber-100 text-amber-600',
    },
  ];

  return (
    <div className='space-y-4 md:space-y-6'>
      <div className='flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between'>
        <div>
          <h1 className='text-xl font-bold md:text-2xl dark:text-white'>Analytics</h1>
          <p className='text-sm text-gray-500'>Platform performance insights</p>
        </div>
        <Select value={period} onValueChange={setPeriod}>
          <SelectTrigger className='w-full sm:w-40'>
            <Calendar className='mr-2 h-4 w-4' />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value='7d'>Last 7 days</SelectItem>
            <SelectItem value='30d'>Last 30 days</SelectItem>
            <SelectItem value='90d'>Last 90 days</SelectItem>
            <SelectItem value='1y'>Last year</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Stats Grid */}
      <div className='grid grid-cols-2 gap-3 md:gap-4 lg:grid-cols-4'>
        {stats.map(stat => (
          <div
            key={stat.label}
            className='rounded-xl border border-gray-100 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-800'
          >
            <div className='flex items-center gap-3'>
              <div className={`rounded-lg p-2 ${stat.color}`}>
                <stat.icon className='h-5 w-5' />
              </div>
              <div>
                <p className='text-xl font-bold md:text-2xl dark:text-white'>{stat.value}</p>
                <div className='flex items-center gap-2'>
                  <p className='text-xs text-gray-500'>{stat.label}</p>
                  <span className='text-xs text-emerald-600'>{stat.change}</span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Charts Placeholder */}
      <div className='grid grid-cols-1 gap-4 lg:grid-cols-2'>
        <div className='rounded-xl border border-gray-100 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-800'>
          <h3 className='mb-4 font-semibold dark:text-white'>Revenue Trend</h3>
          <div className='flex h-64 items-center justify-center rounded-lg bg-gray-50 dark:bg-slate-700/50'>
            <div className='text-center text-gray-400'>
              <BarChart3 className='mx-auto mb-2 h-12 w-12' />
              <p>Chart visualization</p>
              <p className='text-xs'>Coming soon</p>
            </div>
          </div>
        </div>
        <div className='rounded-xl border border-gray-100 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-800'>
          <h3 className='mb-4 font-semibold dark:text-white'>User Growth</h3>
          <div className='flex h-64 items-center justify-center rounded-lg bg-gray-50 dark:bg-slate-700/50'>
            <div className='text-center text-gray-400'>
              <TrendingUp className='mx-auto mb-2 h-12 w-12' />
              <p>Chart visualization</p>
              <p className='text-xs'>Coming soon</p>
            </div>
          </div>
        </div>
      </div>

      {/* Top Farms */}
      <div className='rounded-xl border border-gray-100 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-800'>
        <h3 className='mb-4 font-semibold dark:text-white'>Top Performing Farms</h3>
        <div className='space-y-3'>
          {['Green Valley Dairy', 'Sunrise Farm', 'Mountain View'].map((farm, i) => (
            <div
              key={farm}
              className='flex items-center justify-between rounded-lg bg-gray-50 p-3 dark:bg-slate-700/50'
            >
              <div className='flex items-center gap-3'>
                <span className='flex h-8 w-8 items-center justify-center rounded-full bg-emerald-100 text-sm font-bold text-emerald-600'>
                  {i + 1}
                </span>
                <span className='font-medium dark:text-white'>{farm}</span>
              </div>
              <span className='font-medium text-emerald-600'>
                Rs. {(50000 - i * 10000).toLocaleString()}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
