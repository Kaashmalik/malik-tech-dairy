// Super Admin Dashboard Page
import { Suspense } from 'react';
import { getSupabaseClient } from '@/lib/supabase/server';
import { ModernSuperAdminDashboard } from '@/components/super-admin/ModernSuperAdminDashboard';
import { StatsCardSkeleton } from '@/components/ui/skeleton-loaders';

// Fetch stats from Supabase
async function getStats() {
  const supabase = getSupabaseClient();

  const [
    { count: totalApplications },
    { count: pendingApplications },
    { count: approvedApplications },
    { count: totalTenants },
    { count: totalUsers },
    { count: totalAnimals },
    { count: totalAssets },
  ] = await Promise.all([
    supabase.from('farm_applications').select('*', { count: 'exact', head: true }),
    supabase
      .from('farm_applications')
      .select('*', { count: 'exact', head: true })
      .in('status', ['pending', 'payment_uploaded']),
    supabase
      .from('farm_applications')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'approved'),
    supabase.from('tenants').select('*', { count: 'exact', head: true }),
    supabase.from('platform_users').select('*', { count: 'exact', head: true }),
    supabase.from('animals').select('*', { count: 'exact', head: true }),
    supabase.from('assets').select('*', { count: 'exact', head: true }),
  ]);

  return {
    totalApplications: totalApplications || 0,
    pendingApplications: pendingApplications || 0,
    approvedApplications: approvedApplications || 0,
    totalTenants: totalTenants || 0,
    totalUsers: totalUsers || 0,
    totalAnimals: totalAnimals || 0,
    totalAssets: totalAssets || 0,
  };
}

// Fetch recent applications
async function getRecentApplications() {
  const supabase = getSupabaseClient();

  const { data } = await supabase
    .from('farm_applications')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(5);

  return data || [];
}

async function DashboardContent() {
  const [stats, applications] = await Promise.all([
    getStats(),
    getRecentApplications(),
  ]);

  return <ModernSuperAdminDashboard stats={stats} recentApplications={applications} />;
}

export default function SuperAdminDashboard() {
  return (
    <Suspense fallback={
      <div className="space-y-8 animate-pulse">
        <div className="h-20 w-1/3 bg-gray-200 dark:bg-gray-800 rounded-xl" />
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map(i => <StatsCardSkeleton key={i} />)}
        </div>
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 h-96 bg-gray-200 dark:bg-gray-800 rounded-2xl" />
          <div className="h-96 bg-gray-200 dark:bg-gray-800 rounded-2xl" />
        </div>
      </div>
    }>
      <DashboardContent />
    </Suspense>
  );
}
