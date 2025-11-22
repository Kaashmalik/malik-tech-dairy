"use client";

import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { MilkChart } from "@/components/dashboard/MilkChart";
import { AnimalsBySpeciesChart } from "@/components/dashboard/AnimalsBySpeciesChart";
import Link from "next/link";
import { format } from "date-fns";

export default function DashboardPageClient() {
  const { data: animalsData } = useQuery({
    queryKey: ["animals"],
    queryFn: async () => {
      const res = await fetch("/api/animals");
      if (!res.ok) return { animals: [] };
      return res.json();
    },
  });

  const { data: milkStats } = useQuery({
    queryKey: ["milk-stats"],
    queryFn: async () => {
      const res = await fetch("/api/milk/stats?days=1");
      if (!res.ok) return { todayTotal: 0 };
      return res.json();
    },
  });

  const { data: eggStats } = useQuery({
    queryKey: ["egg-stats"],
    queryFn: async () => {
      const today = format(new Date(), "yyyy-MM-dd");
      const res = await fetch(`/api/eggs?date=${today}`);
      if (!res.ok) return { logs: [] };
      const data = await res.json();
      const todayTotal = data.logs.reduce((sum: number, log: any) => sum + (log.quantity || 0), 0);
      return { todayTotal };
    },
  });

  const animals = animalsData?.animals || [];
  const totalAnimals = animals.length;
  const milkToday = milkStats?.todayTotal || 0;
  const eggsToday = eggStats?.todayTotal || 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">
          Welcome to your livestock management dashboard
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Animals</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalAnimals}</div>
            <p className="text-xs text-muted-foreground">
              {totalAnimals === 0 ? "Add animals to get started" : "Active animals"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Milk Today</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{milkToday.toFixed(2)} L</div>
            <p className="text-xs text-muted-foreground">
              {milkToday === 0 ? "No milk logs today" : "Total production"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Eggs Today</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{eggsToday}</div>
            <p className="text-xs text-muted-foreground">
              {eggsToday === 0 ? "No egg logs today" : "Total collected"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Subscription</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">Free</div>
            <p className="text-xs text-muted-foreground">
              Trial period active
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <MilkChart />
        <AnimalsBySpeciesChart />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>
            Get started with your farm management
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <Link
              href="/dashboard/animals/new"
              className="flex flex-col items-center justify-center p-6 border rounded-lg hover:bg-accent transition-colors"
            >
              <span className="text-2xl mb-2">🐄</span>
              <span className="font-medium">Add Animal</span>
            </Link>
            <Link
              href="/dashboard/milk/new"
              className="flex flex-col items-center justify-center p-6 border rounded-lg hover:bg-accent transition-colors"
            >
              <span className="text-2xl mb-2">🥛</span>
              <span className="font-medium">Log Milk</span>
            </Link>
            <Link
              href="/dashboard/settings"
              className="flex flex-col items-center justify-center p-6 border rounded-lg hover:bg-accent transition-colors"
            >
              <span className="text-2xl mb-2">⚙️</span>
              <span className="font-medium">Settings</span>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
