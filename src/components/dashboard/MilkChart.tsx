'use client';

import { useQuery } from '@tanstack/react-query';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { Droplets, TrendingUp, Loader2 } from 'lucide-react';
import Link from 'next/link';

// Alias for semantic clarity
const MilkIcon = Droplets;

export function MilkChart() {
  const { data, isLoading } = useQuery({
    queryKey: ['milk-stats'],
    queryFn: async () => {
      const res = await fetch('/api/milk/stats?days=7');
      if (!res.ok) return null;
      return res.json();
    },
  });

  if (isLoading) {
    return (
      <div className='flex h-[280px] items-center justify-center'>
        <div className='text-center'>
          <Loader2 className='mx-auto mb-2 h-8 w-8 animate-spin text-emerald-500' />
          <p className='text-sm text-gray-500'>Loading chart...</p>
        </div>
      </div>
    );
  }

  if (!data || !data.dailyTotals || data.dailyTotals.length === 0) {
    return (
      <div className='flex h-[280px] flex-col items-center justify-center'>
        <div className='mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-100 to-cyan-100 dark:from-blue-900/30 dark:to-cyan-900/30'>
          <MilkIcon className='h-8 w-8 text-blue-500' />
        </div>
        <h4 className='mb-1 font-medium text-gray-900 dark:text-white'>No milk data yet</h4>
        <p className='mb-4 max-w-[200px] text-center text-sm text-gray-500 dark:text-gray-400'>
          Start logging milk production to see trends here
        </p>
        <Link
          href='/milk/new'
          className='inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue-500 to-cyan-500 px-4 py-2 text-sm font-medium text-white transition-all hover:shadow-lg hover:shadow-blue-500/25'
        >
          <MilkIcon className='h-4 w-4' />
          Log Milk
        </Link>
      </div>
    );
  }

  return (
    <div className='space-y-4'>
      {/* Stats row */}
      <div className='flex items-center gap-4'>
        <div className='flex items-center gap-2 rounded-lg bg-blue-50 px-3 py-1.5 dark:bg-blue-900/30'>
          <MilkIcon className='h-4 w-4 text-blue-500' />
          <span className='text-sm font-medium text-blue-700 dark:text-blue-300'>
            Today: {data.todayTotal}L
          </span>
        </div>
        <div className='flex items-center gap-2 rounded-lg bg-emerald-50 px-3 py-1.5 dark:bg-emerald-900/30'>
          <TrendingUp className='h-4 w-4 text-emerald-500' />
          <span className='text-sm font-medium text-emerald-700 dark:text-emerald-300'>
            Avg: {data.averagePerDay.toFixed(1)}L/day
          </span>
        </div>
      </div>

      {/* Chart */}
      <ResponsiveContainer width='100%' height={220}>
        <AreaChart data={data.dailyTotals}>
          <defs>
            <linearGradient id='milkGradient' x1='0' y1='0' x2='0' y2='1'>
              <stop offset='5%' stopColor='#3B82F6' stopOpacity={0.3} />
              <stop offset='95%' stopColor='#3B82F6' stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray='3 3' stroke='#E5E7EB' vertical={false} />
          <XAxis
            dataKey='date'
            tickFormatter={value => {
              const date = new Date(value);
              return `${date.getMonth() + 1}/${date.getDate()}`;
            }}
            axisLine={false}
            tickLine={false}
            tick={{ fill: '#9CA3AF', fontSize: 12 }}
          />
          <YAxis axisLine={false} tickLine={false} tick={{ fill: '#9CA3AF', fontSize: 12 }} />
          <Tooltip
            contentStyle={{
              backgroundColor: 'rgba(255, 255, 255, 0.95)',
              borderRadius: '12px',
              border: '1px solid #E5E7EB',
              boxShadow: '0 10px 40px rgba(0,0,0,0.1)',
            }}
            labelFormatter={value => {
              const date = new Date(value);
              return date.toLocaleDateString('en-US', {
                weekday: 'short',
                month: 'short',
                day: 'numeric',
              });
            }}
            formatter={(value: number) => [`${value} Liters`, 'Milk Production']}
          />
          <Area
            type='monotone'
            dataKey='total'
            stroke='#3B82F6'
            strokeWidth={3}
            fill='url(#milkGradient)'
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
