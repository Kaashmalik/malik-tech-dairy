'use client';

import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BreedingList } from '@/components/breeding/BreedingList';
import { PregnancyDashboard } from '@/components/breeding/PregnancyDashboard';
import { SemenInventory } from '@/components/breeding/SemenInventory';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useQuery } from '@tanstack/react-query';
import {
  Heart,
  Baby,
  Stethoscope,
  Syringe,
  Calendar,
  TrendingUp,
  Package,
} from 'lucide-react';
import { format } from 'date-fns';

export default function BreedingPage() {
  const [activeTab, setActiveTab] = useState('records');

  // Fetch pregnancy checks for the checks tab
  const { data: checksData } = useQuery<{ data: any[] }>({
    queryKey: ['pregnancy-checks'],
    queryFn: async () => {
      const res = await fetch('/api/breeding/pregnancy-checks');
      if (!res.ok) throw new Error('Failed to fetch pregnancy checks');
      return res.json();
    },
  });

  const checks = checksData?.data || [];

  return (
    <div className="p-6 space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
            Breeding & Pregnancy Center
          </h1>
          <p className="text-muted-foreground mt-1">
            Manage inseminations, track pregnancies, and monitor upcoming births
          </p>
        </div>
        <div className="text-right text-sm text-muted-foreground">
          <Calendar className="h-4 w-4 inline mr-1" />
          {format(new Date(), 'EEEE, MMMM d, yyyy')}
        </div>
      </div>

      {/* Main Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4 lg:w-auto lg:inline-grid">
          <TabsTrigger value="records" className="flex items-center gap-2">
            <Heart className="h-4 w-4" />
            <span className="hidden sm:inline">Breeding Records</span>
            <span className="sm:hidden">Records</span>
          </TabsTrigger>
          <TabsTrigger value="pregnant" className="flex items-center gap-2">
            <Baby className="h-4 w-4" />
            <span className="hidden sm:inline">Pregnancy Dashboard</span>
            <span className="sm:hidden">Pregnant</span>
          </TabsTrigger>
          <TabsTrigger value="checks" className="flex items-center gap-2">
            <Stethoscope className="h-4 w-4" />
            <span className="hidden sm:inline">Pregnancy Checks</span>
            <span className="sm:hidden">Checks</span>
          </TabsTrigger>
          <TabsTrigger value="semen" className="flex items-center gap-2">
            <Package className="h-4 w-4" />
            <span className="hidden sm:inline">Semen Inventory</span>
            <span className="sm:hidden">Semen</span>
          </TabsTrigger>
        </TabsList>

        {/* Breeding Records Tab */}
        <TabsContent value="records" className="space-y-6">
          <BreedingList />
        </TabsContent>

        {/* Pregnancy Dashboard Tab */}
        <TabsContent value="pregnant" className="space-y-6">
          <PregnancyDashboard />
        </TabsContent>

        {/* Pregnancy Checks History Tab */}
        <TabsContent value="checks" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Stethoscope className="h-5 w-5" />
                Pregnancy Check History
              </CardTitle>
            </CardHeader>
            <CardContent>
              {checks.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <Stethoscope className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No pregnancy checks recorded yet</p>
                  <p className="text-sm mt-2">
                    Pregnancy checks will appear here after you record them from the Breeding Records tab
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {checks.map((check: any) => (
                    <div
                      key={check.id}
                      className={`p-4 rounded-lg border ${check.result === 'positive'
                          ? 'border-green-200 bg-green-50/50 dark:border-green-800 dark:bg-green-900/10'
                          : check.result === 'negative'
                            ? 'border-red-200 bg-red-50/50 dark:border-red-800 dark:bg-red-900/10'
                            : 'border-yellow-200 bg-yellow-50/50 dark:border-yellow-800 dark:bg-yellow-900/10'
                        }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span
                              className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${check.result === 'positive'
                                  ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300'
                                  : check.result === 'negative'
                                    ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300'
                                    : 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300'
                                }`}
                            >
                              {check.result === 'positive' ? '✓ Positive' : check.result === 'negative' ? '✗ Negative' : '? Inconclusive'}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              via {check.checkMethod?.replace('_', ' ')}
                            </span>
                          </div>
                          <p className="text-sm">
                            <span className="font-medium">Animal ID:</span> {check.animalId}
                          </p>
                          {check.vetName && (
                            <p className="text-xs text-muted-foreground">
                              Vet: {check.vetName}
                            </p>
                          )}
                          {check.notes && (
                            <p className="text-xs text-muted-foreground mt-1">
                              {check.notes}
                            </p>
                          )}
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-medium">
                            {format(new Date(check.checkDate), 'MMM d, yyyy')}
                          </p>
                          {check.cost && (
                            <p className="text-xs text-muted-foreground">
                              Cost: Rs. {check.cost}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Semen Inventory Tab */}
        <TabsContent value="semen" className="space-y-6">
          <SemenInventory />
        </TabsContent>
      </Tabs>
    </div>
  );
}
