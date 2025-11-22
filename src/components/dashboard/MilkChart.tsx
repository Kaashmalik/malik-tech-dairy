"use client";

import { useQuery } from "@tanstack/react-query";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

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
      <Card>
        <CardHeader>
          <CardTitle>Milk Production (Last 7 Days)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64 flex items-center justify-center">
            Loading chart...
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!data || !data.dailyTotals || data.dailyTotals.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Milk Production (Last 7 Days)</CardTitle>
          <CardDescription>No milk logs found</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-64 flex items-center justify-center text-muted-foreground">
            Start logging milk to see production trends
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Milk Production (Last 7 Days)</CardTitle>
        <CardDescription>
          Today: {data.todayTotal}L | Average: {data.averagePerDay.toFixed(2)}L/day
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={data.dailyTotals}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis
              dataKey="date"
              tickFormatter={(value) => {
                const date = new Date(value);
                return `${date.getMonth() + 1}/${date.getDate()}`;
              }}
            />
            <YAxis />
            <Tooltip
              labelFormatter={(value) => {
                const date = new Date(value);
                return date.toLocaleDateString();
              }}
              formatter={(value: number) => [`${value}L`, "Milk"]}
            />
            <Legend />
            <Line
              type="monotone"
              dataKey="total"
              stroke="hsl(var(--primary))"
              strokeWidth={2}
              name="Total Milk (L)"
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

