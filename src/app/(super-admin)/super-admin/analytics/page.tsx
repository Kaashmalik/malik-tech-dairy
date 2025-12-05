// Super Admin - Analytics Page
'use client';

import { BarChart3, TrendingUp, Users, Building2, CreditCard, Calendar } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useState } from 'react';

export default function AnalyticsPage() {
  const [period, setPeriod] = useState('30d');

  const stats = [
    { label: 'Total Revenue', value: 'Rs. 149,970', change: '+12%', icon: CreditCard, color: 'bg-emerald-100 text-emerald-600' },
    { label: 'New Farms', value: '24', change: '+8%', icon: Building2, color: 'bg-blue-100 text-blue-600' },
    { label: 'New Users', value: '156', change: '+15%', icon: Users, color: 'bg-purple-100 text-purple-600' },
    { label: 'Conversion Rate', value: '68%', change: '+5%', icon: TrendingUp, color: 'bg-amber-100 text-amber-600' },
  ];

  return (
    <div className="space-y-4 md:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-bold dark:text-white">Analytics</h1>
          <p className="text-sm text-gray-500">Platform performance insights</p>
        </div>
        <Select value={period} onValueChange={setPeriod}>
          <SelectTrigger className="w-full sm:w-40">
            <Calendar className="w-4 h-4 mr-2" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7d">Last 7 days</SelectItem>
            <SelectItem value="30d">Last 30 days</SelectItem>
            <SelectItem value="90d">Last 90 days</SelectItem>
            <SelectItem value="1y">Last year</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        {stats.map((stat) => (
          <div key={stat.label} className="bg-white dark:bg-slate-800 rounded-xl p-4 shadow-sm border border-gray-100 dark:border-slate-700">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${stat.color}`}>
                <stat.icon className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xl md:text-2xl font-bold dark:text-white">{stat.value}</p>
                <div className="flex items-center gap-2">
                  <p className="text-xs text-gray-500">{stat.label}</p>
                  <span className="text-xs text-emerald-600">{stat.change}</span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Charts Placeholder */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-slate-700">
          <h3 className="font-semibold mb-4 dark:text-white">Revenue Trend</h3>
          <div className="h-64 flex items-center justify-center bg-gray-50 dark:bg-slate-700/50 rounded-lg">
            <div className="text-center text-gray-400">
              <BarChart3 className="w-12 h-12 mx-auto mb-2" />
              <p>Chart visualization</p>
              <p className="text-xs">Coming soon</p>
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-slate-700">
          <h3 className="font-semibold mb-4 dark:text-white">User Growth</h3>
          <div className="h-64 flex items-center justify-center bg-gray-50 dark:bg-slate-700/50 rounded-lg">
            <div className="text-center text-gray-400">
              <TrendingUp className="w-12 h-12 mx-auto mb-2" />
              <p>Chart visualization</p>
              <p className="text-xs">Coming soon</p>
            </div>
          </div>
        </div>
      </div>

      {/* Top Farms */}
      <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-slate-700">
        <h3 className="font-semibold mb-4 dark:text-white">Top Performing Farms</h3>
        <div className="space-y-3">
          {['Green Valley Dairy', 'Sunrise Farm', 'Mountain View'].map((farm, i) => (
            <div key={farm} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-slate-700/50 rounded-lg">
              <div className="flex items-center gap-3">
                <span className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center font-bold text-sm">
                  {i + 1}
                </span>
                <span className="font-medium dark:text-white">{farm}</span>
              </div>
              <span className="text-emerald-600 font-medium">Rs. {(50000 - i * 10000).toLocaleString()}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
