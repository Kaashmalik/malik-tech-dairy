"use client";

import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MilkYieldChart } from "./MilkYieldChart";
import { ExpenseRevenueChart } from "./ExpenseRevenueChart";
import { HealthScoreCard } from "./HealthScoreCard";
import { ForecastChart } from "./ForecastChart";
import { Loader2 } from "lucide-react";

export function AnalyticsDashboard() {
  const { data: analyticsData, isLoading: analyticsLoading } = useQuery({
    queryKey: ["analytics"],
    queryFn: async () => {
      const res = await fetch("/api/analytics");
      if (!res.ok) throw new Error("Failed to fetch analytics");
      return res.json();
    },
  });

  const { data: predictionsData, isLoading: predictionsLoading } = useQuery({
    queryKey: ["predictions", "milk"],
    queryFn: async () => {
      const res = await fetch("/api/predictions/milk");
      if (!res.ok) throw new Error("Failed to fetch predictions");
      return res.json();
    },
  });

  if (analyticsLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Health Score Card */}
      <HealthScoreCard score={analyticsData?.healthScore || 0} />

      {/* Milk Yield Trends */}
      <Card>
        <CardHeader>
          <CardTitle>Milk Yield Trends</CardTitle>
          <CardDescription>Track milk production over time</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="30d" className="w-full">
            <TabsList>
              <TabsTrigger value="30d">30 Days</TabsTrigger>
              <TabsTrigger value="90d">90 Days</TabsTrigger>
              <TabsTrigger value="1y">1 Year</TabsTrigger>
            </TabsList>
            <TabsContent value="30d">
              <MilkYieldChart data={analyticsData?.milkYield?.trend30d || []} />
            </TabsContent>
            <TabsContent value="90d">
              <MilkYieldChart data={analyticsData?.milkYield?.trend90d || []} />
            </TabsContent>
            <TabsContent value="1y">
              <MilkYieldChart data={analyticsData?.milkYield?.trend1y || []} />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Expense vs Revenue */}
      <Card>
        <CardHeader>
          <CardTitle>Expense vs Revenue</CardTitle>
          <CardDescription>Financial performance overview</CardDescription>
        </CardHeader>
        <CardContent>
          <ExpenseRevenueChart
            expenses={analyticsData?.expenseVsRevenue?.expenses || []}
            revenue={analyticsData?.expenseVsRevenue?.revenue || []}
          />
        </CardContent>
      </Card>

      {/* 7-Day Forecast */}
      <Card>
        <CardHeader>
          <CardTitle>7-Day Milk Yield Forecast</CardTitle>
          <CardDescription>
            AI-powered predictions with confidence intervals
            {predictionsData?.lastUpdated && (
              <span className="text-xs text-muted-foreground ml-2">
                (Last updated: {new Date(predictionsData.lastUpdated).toLocaleString()})
              </span>
            )}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {predictionsLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <ForecastChart
              predictions={predictionsData?.predictions || []}
              confidenceBand={predictionsData?.confidenceBand || []}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}

