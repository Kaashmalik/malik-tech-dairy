'use client';

import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AnalyticsDashboard } from '@/components/analytics/AnalyticsDashboard';

export default function AnalyticsPage() {
  return (
    <div className='space-y-6'>
      <div>
        <h1 className='text-3xl font-bold'>Analytics Dashboard</h1>
        <p className='text-muted-foreground'>Comprehensive insights into your dairy operations</p>
      </div>

      <AnalyticsDashboard />
    </div>
  );
}
