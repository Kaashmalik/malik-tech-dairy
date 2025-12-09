// Super Admin Dashboard Page
import { Suspense } from 'react';
import Link from 'next/link';
import {
  Building2,
  Users,
  FileText,
  CreditCard,
  TrendingUp,
  Clock,
  CheckCircle2,
  XCircle,
  Upload,
  ArrowRight,
  Bell,
} from 'lucide-react';
import { getSupabaseClient } from '@/lib/supabase';

// Stats Card Component
function StatsCard({
  title,
  value,
  icon: Icon,
  trend,
  color,
  href,
}: {
  title: string;
  value: number | string;
  icon: React.ElementType;
  trend?: string;
  color: string;
  href?: string;
}) {
  const content = (
    <div className='rounded-xl border border-gray-100 bg-white p-6 shadow-sm transition-shadow hover:shadow-md dark:border-slate-700 dark:bg-slate-800'>
      <div className='flex items-start justify-between'>
        <div>
          <p className='text-sm text-gray-500 dark:text-slate-400'>{title}</p>
          <p className='mt-1 text-3xl font-bold dark:text-white'>{value}</p>
          {trend && (
            <p className='mt-2 flex items-center gap-1 text-sm text-emerald-600'>
              <TrendingUp className='h-4 w-4' />
              {trend}
            </p>
          )}
        </div>
        <div className={`rounded-lg p-3 ${color}`}>
          <Icon className='h-6 w-6 text-white' />
        </div>
      </div>
    </div>
  );

  if (href) {
    return <Link href={href}>{content}</Link>;
  }
  return content;
}

// Fetch stats from Supabase
async function getStats() {
  const supabase = getSupabaseClient();

  const [
    { count: totalApplications },
    { count: pendingApplications },
    { count: approvedApplications },
    { count: totalTenants },
    { count: totalUsers },
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
  ]);

  return {
    totalApplications: totalApplications || 0,
    pendingApplications: pendingApplications || 0,
    approvedApplications: approvedApplications || 0,
    totalTenants: totalTenants || 0,
    totalUsers: totalUsers || 0,
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

// Dashboard Stats Component
async function DashboardStats() {
  const stats = await getStats();

  return (
    <div className='grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4'>
      <StatsCard
        title='Total Farms'
        value={stats.totalTenants}
        icon={Building2}
        color='bg-emerald-500'
        href='/super-admin/farms'
      />
      <StatsCard
        title='Total Users'
        value={stats.totalUsers}
        icon={Users}
        color='bg-blue-500'
        href='/super-admin/users'
      />
      <StatsCard
        title='Pending Applications'
        value={stats.pendingApplications}
        icon={FileText}
        color='bg-amber-500'
        href='/super-admin/applications?status=pending'
      />
      <StatsCard
        title='Total Applications'
        value={stats.totalApplications}
        icon={CreditCard}
        color='bg-purple-500'
        href='/super-admin/applications'
      />
    </div>
  );
}

// Status configuration
const statusConfig: Record<
  string,
  { label: string; color: string; bgColor: string; icon: typeof Clock }
> = {
  pending: { label: 'Pending', color: 'text-gray-700', bgColor: 'bg-gray-100', icon: Clock },
  payment_uploaded: {
    label: 'Payment Uploaded',
    color: 'text-amber-700',
    bgColor: 'bg-amber-100',
    icon: Upload,
  },
  approved: {
    label: 'Approved',
    color: 'text-emerald-700',
    bgColor: 'bg-emerald-100',
    icon: CheckCircle2,
  },
  rejected: { label: 'Rejected', color: 'text-red-700', bgColor: 'bg-red-100', icon: XCircle },
};

// Recent Applications Component
async function RecentApplications() {
  const applications = await getRecentApplications();

  return (
    <div className='rounded-xl border border-gray-100 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-800'>
      <div className='flex items-center justify-between border-b border-gray-100 p-6 dark:border-slate-700'>
        <div>
          <h2 className='text-lg font-semibold dark:text-white'>Recent Applications</h2>
          <p className='text-sm text-gray-500 dark:text-slate-400'>
            Farm applications requiring attention
          </p>
        </div>
        <Link
          href='/super-admin/applications'
          className='flex items-center gap-1 text-sm text-emerald-600 hover:text-emerald-700'
        >
          View all <ArrowRight className='h-4 w-4' />
        </Link>
      </div>
      <div className='p-6'>
        {applications.length === 0 ? (
          <div className='py-8 text-center'>
            <FileText className='mx-auto h-12 w-12 text-gray-300 dark:text-slate-600' />
            <p className='mt-2 text-gray-500 dark:text-slate-400'>No applications yet</p>
          </div>
        ) : (
          <div className='space-y-3'>
            {applications.map(app => {
              const status = statusConfig[app.status] || statusConfig.pending;
              const StatusIcon = status.icon;

              return (
                <Link
                  key={app.id}
                  href={`/super-admin/applications?search=${app.id}`}
                  className={`flex items-center justify-between rounded-lg border p-4 transition-colors hover:bg-gray-50 dark:hover:bg-slate-700/50 ${
                    app.status === 'pending' || app.status === 'payment_uploaded'
                      ? 'border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-900/20'
                      : 'border-gray-200 bg-gray-50 dark:border-slate-600 dark:bg-slate-700/30'
                  }`}
                >
                  <div className='flex items-center gap-4'>
                    <StatusIcon
                      className={`h-5 w-5 ${
                        app.status === 'approved'
                          ? 'text-emerald-600'
                          : app.status === 'rejected'
                            ? 'text-red-600'
                            : 'text-amber-600'
                      }`}
                    />
                    <div>
                      <p className='font-medium dark:text-white'>{app.farm_name}</p>
                      <p className='text-sm text-gray-500 dark:text-slate-400'>
                        {app.owner_name} • {app.requested_plan} plan
                      </p>
                    </div>
                  </div>
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-medium ${status.bgColor} ${status.color}`}
                  >
                    {status.label}
                  </span>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

// Quick Actions Component
function QuickActions() {
  return (
    <div className='rounded-xl border border-gray-100 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-800'>
      <div className='border-b border-gray-100 p-6 dark:border-slate-700'>
        <h2 className='text-lg font-semibold dark:text-white'>Quick Actions</h2>
      </div>
      <div className='grid grid-cols-2 gap-4 p-6'>
        <a
          href='/super-admin/applications?status=payment_uploaded'
          className='rounded-lg bg-amber-50 p-4 text-center transition-colors hover:bg-amber-100 dark:bg-amber-900/20 dark:hover:bg-amber-900/30'
        >
          <FileText className='mx-auto mb-2 h-8 w-8 text-amber-600' />
          <p className='font-medium text-amber-700 dark:text-amber-400'>Review Applications</p>
        </a>
        <a
          href='/super-admin/farms/new'
          className='rounded-lg bg-emerald-50 p-4 text-center transition-colors hover:bg-emerald-100 dark:bg-emerald-900/20 dark:hover:bg-emerald-900/30'
        >
          <Building2 className='mx-auto mb-2 h-8 w-8 text-emerald-600' />
          <p className='font-medium text-emerald-700 dark:text-emerald-400'>Create Farm</p>
        </a>
        <a
          href='/super-admin/users'
          className='rounded-lg bg-blue-50 p-4 text-center transition-colors hover:bg-blue-100 dark:bg-blue-900/20 dark:hover:bg-blue-900/30'
        >
          <Users className='mx-auto mb-2 h-8 w-8 text-blue-600' />
          <p className='font-medium text-blue-700 dark:text-blue-400'>Manage Users</p>
        </a>
        <a
          href='/super-admin/payments'
          className='rounded-lg bg-purple-50 p-4 text-center transition-colors hover:bg-purple-100 dark:bg-purple-900/20 dark:hover:bg-purple-900/30'
        >
          <CreditCard className='mx-auto mb-2 h-8 w-8 text-purple-600' />
          <p className='font-medium text-purple-700 dark:text-purple-400'>View Payments</p>
        </a>
      </div>
    </div>
  );
}

export default function SuperAdminDashboard() {
  return (
    <div className='space-y-6'>
      {/* Page Header */}
      <div>
        <h1 className='text-2xl font-bold dark:text-white'>Super Admin Dashboard</h1>
        <p className='text-gray-500 dark:text-slate-400'>Platform overview and management</p>
      </div>

      {/* Stats Grid */}
      <Suspense
        fallback={<div className='h-32 animate-pulse rounded-xl bg-gray-100 dark:bg-slate-700' />}
      >
        <DashboardStats />
      </Suspense>

      {/* Main Content Grid */}
      <div className='grid grid-cols-1 gap-6 lg:grid-cols-3'>
        <div className='lg:col-span-2'>
          <RecentApplications />
        </div>
        <div>
          <QuickActions />
        </div>
      </div>
    </div>
  );
}
