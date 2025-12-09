'use client';

import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Building2, Users, DollarSign, TrendingUp, AlertCircle, CheckCircle2 } from 'lucide-react';
import Link from 'next/link';
import { format } from 'date-fns';

interface TenantStats {
  totalTenants: number;
  activeTenants: number;
  trialTenants: number;
  totalRevenue: number;
  monthlyRecurringRevenue: number;
  totalAnimals: number;
  totalUsers: number;
}

interface Tenant {
  id: string;
  farmName?: string;
  subdomain?: string;
  plan?: string;
  status?: string;
  createdAt?: string;
  animalCount?: number;
  userCount?: number;
  subscriptionStatus?: string;
}

export function AdminDashboard() {
  const { data: stats, isLoading: statsLoading } = useQuery<TenantStats>({
    queryKey: ['admin-stats'],
    queryFn: async () => {
      const res = await fetch('/api/admin/stats');
      if (!res.ok) throw new Error('Failed to fetch stats');
      return res.json();
    },
  });

  const { data: tenants, isLoading: tenantsLoading } = useQuery<Tenant[]>({
    queryKey: ['admin-tenants'],
    queryFn: async () => {
      const res = await fetch('/api/admin/tenants');
      if (!res.ok) throw new Error('Failed to fetch tenants');
      const data = await res.json();
      return data.tenants || [];
    },
  });

  if (statsLoading || tenantsLoading) {
    return (
      <div className='flex min-h-screen items-center justify-center'>
        <div className='text-center'>
          <div className='border-primary mx-auto h-12 w-12 animate-spin rounded-full border-b-2'></div>
          <p className='text-muted-foreground mt-4'>Loading dashboard...</p>
        </div>
      </div>
    );
  }

  const recentTenants = tenants?.slice(0, 5) || [];
  const activeCount = stats?.activeTenants || 0;
  const trialCount = stats?.trialTenants || 0;

  return (
    <div className='space-y-6'>
      {/* Header */}
      <div>
        <h1 className='text-3xl font-bold'>Super Admin Dashboard</h1>
        <p className='text-muted-foreground mt-2'>Overview of all farms and platform metrics</p>
      </div>

      {/* Stats Cards */}
      <div className='grid gap-4 md:grid-cols-2 lg:grid-cols-4'>
        <Card>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
            <CardTitle className='text-sm font-medium'>Total Farms</CardTitle>
            <Building2 className='text-muted-foreground h-4 w-4' />
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>{stats?.totalTenants || 0}</div>
            <p className='text-muted-foreground text-xs'>
              {activeCount} active, {trialCount} on trial
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
            <CardTitle className='text-sm font-medium'>Total Users</CardTitle>
            <Users className='text-muted-foreground h-4 w-4' />
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>{stats?.totalUsers || 0}</div>
            <p className='text-muted-foreground text-xs'>Across all farms</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
            <CardTitle className='text-sm font-medium'>Monthly Revenue</CardTitle>
            <DollarSign className='text-muted-foreground h-4 w-4' />
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>
              PKR {(stats?.monthlyRecurringRevenue || 0).toLocaleString()}
            </div>
            <p className='text-muted-foreground text-xs'>MRR</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
            <CardTitle className='text-sm font-medium'>Total Animals</CardTitle>
            <TrendingUp className='text-muted-foreground h-4 w-4' />
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>{stats?.totalAnimals || 0}</div>
            <p className='text-muted-foreground text-xs'>Tracked across platform</p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Tenants */}
      <div className='grid gap-4 md:grid-cols-2'>
        <Card>
          <CardHeader>
            <CardTitle>Recent Farms</CardTitle>
            <CardDescription>Latest registered farms</CardDescription>
          </CardHeader>
          <CardContent>
            <div className='space-y-4'>
              {recentTenants.length === 0 ? (
                <p className='text-muted-foreground py-4 text-center text-sm'>No farms yet</p>
              ) : (
                recentTenants.map(tenant => (
                  <div
                    key={tenant.id}
                    className='flex items-center justify-between rounded-lg border p-3'
                  >
                    <div className='flex-1'>
                      <div className='flex items-center gap-2'>
                        <h4 className='font-semibold'>{tenant.farmName || 'Unnamed Farm'}</h4>
                        {tenant.subscriptionStatus === 'active' ? (
                          <CheckCircle2 className='h-4 w-4 text-green-500' />
                        ) : tenant.subscriptionStatus === 'trial' ? (
                          <AlertCircle className='h-4 w-4 text-yellow-500' />
                        ) : null}
                      </div>
                      <p className='text-muted-foreground text-sm'>
                        Plan: {tenant.plan || 'free'} • {tenant.animalCount || 0} animals •{' '}
                        {tenant.userCount || 0} users
                      </p>
                      {tenant.subdomain && (
                        <p className='text-muted-foreground mt-1 text-xs'>
                          {tenant.subdomain}.maliktechdairy.com
                        </p>
                      )}
                    </div>
                    <Link href={`/admin/tenants?tenantId=${tenant.id}`}>
                      <Button variant='outline' size='sm'>
                        View
                      </Button>
                    </Link>
                  </div>
                ))
              )}
            </div>
            <div className='mt-4'>
              <Link href='/admin/tenants'>
                <Button variant='outline' className='w-full'>
                  View All Farms
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Common admin tasks</CardDescription>
          </CardHeader>
          <CardContent className='space-y-2'>
            <Link href='/admin/tenants'>
              <Button variant='outline' className='w-full justify-start'>
                <Building2 className='mr-2 h-4 w-4' />
                Manage All Farms
              </Button>
            </Link>
            <Link href='/admin/coupons'>
              <Button variant='outline' className='w-full justify-start'>
                <DollarSign className='mr-2 h-4 w-4' />
                Manage Coupons
              </Button>
            </Link>
            <Button variant='outline' className='w-full justify-start' disabled>
              <TrendingUp className='mr-2 h-4 w-4' />
              View Analytics (Coming Soon)
            </Button>
            <Button variant='outline' className='w-full justify-start' disabled>
              <Users className='mr-2 h-4 w-4' />
              User Management (Coming Soon)
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
