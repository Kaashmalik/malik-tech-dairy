"use client";

import { useQuery } from "@tanstack/react-query";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { Droplets, TrendingUp, Loader2 } from "lucide-react";
import Link from "next/link";

// Alias for semantic clarity
const MilkIcon = Droplets;

export function MilkChart() {
  const { data, isLoading } = useQuery({
    queryKey: ["milk-stats"],
    queryFn: async () => {
      const res = await fetch("/api/milk/stats?days=7");
      if (!res.ok) return null;
      return res.json();
    },
  });

  if (isLoading) {
    return (
      <div className="h-[280px] flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-emerald-500 mx-auto mb-2" />
          <p className="text-sm text-gray-500">Loading chart...</p>
        </div>
      </div>
    );
  }

  if (!data || !data.dailyTotals || data.dailyTotals.length === 0) {
    return (
      <div className="h-[280px] flex flex-col items-center justify-center">
        <div className="w-16 h-16 bg-gradient-to-br from-blue-100 to-cyan-100 dark:from-blue-900/30 dark:to-cyan-900/30 rounded-2xl flex items-center justify-center mb-4">
          <MilkIcon className="w-8 h-8 text-blue-500" />
        </div>
        <h4 className="font-medium text-gray-900 dark:text-white mb-1">No milk data yet</h4>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-4 text-center max-w-[200px]">
          Start logging milk production to see trends here
        </p>
        <Link 
          href="/milk/new" 
          className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-500 to-cyan-500 text-white text-sm font-medium rounded-xl hover:shadow-lg hover:shadow-blue-500/25 transition-all"
        >
          <MilkIcon className="w-4 h-4" />
          Log Milk
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Stats row */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2 px-3 py-1.5 bg-blue-50 dark:bg-blue-900/30 rounded-lg">
          <MilkIcon className="w-4 h-4 text-blue-500" />
          <span className="text-sm font-medium text-blue-700 dark:text-blue-300">
            Today: {data.todayTotal}L
          </span>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-50 dark:bg-emerald-900/30 rounded-lg">
          <TrendingUp className="w-4 h-4 text-emerald-500" />
          <span className="text-sm font-medium text-emerald-700 dark:text-emerald-300">
            Avg: {data.averagePerDay.toFixed(1)}L/day
          </span>
        </div>
      </div>
      
      {/* Chart */}
      <ResponsiveContainer width="100%" height={220}>
        <AreaChart data={data.dailyTotals}>
          <defs>
            <linearGradient id="milkGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3}/>
              <stop offset="95%" stopColor="#3B82F6" stopOpacity={0}/>
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" vertical={false} />
          <XAxis
            dataKey="date"
            tickFormatter={(value) => {
              const date = new Date(value);
              return `${date.getMonth() + 1}/${date.getDate()}`;
            }}
            axisLine={false}
            tickLine={false}
            tick={{ fill: '#9CA3AF', fontSize: 12 }}
          />
          <YAxis 
            axisLine={false}
            tickLine={false}
            tick={{ fill: '#9CA3AF', fontSize: 12 }}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: 'rgba(255, 255, 255, 0.95)',
              borderRadius: '12px',
              border: '1px solid #E5E7EB',
              boxShadow: '0 10px 40px rgba(0,0,0,0.1)'
            }}
            labelFormatter={(value) => {
              const date = new Date(value);
              return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
            }}
            formatter={(value: number) => [`${value} Liters`, "Milk Production"]}
          />
          <Area
            type="monotone"
            dataKey="total"
            stroke="#3B82F6"
            strokeWidth={3}
            fill="url(#milkGradient)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

