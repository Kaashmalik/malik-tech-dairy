"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { format, parseISO } from "date-fns";

interface ExpenseRevenueChartProps {
  expenses: Array<{ date: string; amount: number }>;
  revenue: Array<{ date: string; amount: number }>;
}

export function ExpenseRevenueChart({ expenses, revenue }: ExpenseRevenueChartProps) {
  // Combine expenses and revenue by date
  const dataMap = new Map<string, { date: string; expenses: number; revenue: number }>();

  expenses.forEach((item) => {
    const dateKey = item.date;
    if (!dataMap.has(dateKey)) {
      dataMap.set(dateKey, { date: dateKey, expenses: 0, revenue: 0 });
    }
    dataMap.get(dateKey)!.expenses += item.amount;
  });

  revenue.forEach((item) => {
    const dateKey = item.date;
    if (!dataMap.has(dateKey)) {
      dataMap.set(dateKey, { date: dateKey, expenses: 0, revenue: 0 });
    }
    dataMap.get(dateKey)!.revenue += item.amount;
  });

  const chartData = Array.from(dataMap.values())
    .map((item) => ({
      date: format(parseISO(item.date), "MMM dd"),
      expenses: item.expenses,
      revenue: item.revenue,
      profit: item.revenue - item.expenses,
    }))
    .sort((a, b) => a.date.localeCompare(b.date));

  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={chartData}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="date" />
        <YAxis label={{ value: "Amount (PKR)", angle: -90, position: "insideLeft" }} />
        <Tooltip formatter={(value: number) => `PKR ${value.toLocaleString()}`} />
        <Legend />
        <Line
          type="monotone"
          dataKey="expenses"
          stroke="#ef4444"
          strokeWidth={2}
          name="Expenses"
          dot={{ r: 4 }}
        />
        <Line
          type="monotone"
          dataKey="revenue"
          stroke="#22c55e"
          strokeWidth={2}
          name="Revenue"
          dot={{ r: 4 }}
        />
        <Line
          type="monotone"
          dataKey="profit"
          stroke="#3b82f6"
          strokeWidth={2}
          name="Profit"
          strokeDasharray="5 5"
          dot={{ r: 4 }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}

