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
  Bell
} from 'lucide-react';
import { getSupabaseClient } from '@/lib/supabase';

// Stats Card Component
function StatsCard({ 
  title, 
  value, 
  icon: Icon, 
  trend, 
  color,
  href
}: { 
  title: string; 
  value: number | string; 
  icon: React.ElementType; 
  trend?: string;
  color: string;
  href?: string;
}) {
  const content = (
    <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-slate-700 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-gray-500 dark:text-slate-400">{title}</p>
          <p className="text-3xl font-bold mt-1 dark:text-white">{value}</p>
          {trend && (
            <p className="text-sm text-emerald-600 mt-2 flex items-center gap-1">
              <TrendingUp className="w-4 h-4" />
              {trend}
            </p>
          )}
        </div>
        <div className={`p-3 rounded-lg ${color}`}>
          <Icon className="w-6 h-6 text-white" />
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
    supabase.from('farm_applications').select('*', { count: 'exact', head: true }).in('status', ['pending', 'payment_uploaded']),
    supabase.from('farm_applications').select('*', { count: 'exact', head: true }).eq('status', 'approved'),
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
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      <StatsCard
        title="Total Farms"
        value={stats.totalTenants}
        icon={Building2}
        color="bg-emerald-500"
        href="/super-admin/farms"
      />
      <StatsCard
        title="Total Users"
        value={stats.totalUsers}
        icon={Users}
        color="bg-blue-500"
        href="/super-admin/users"
      />
      <StatsCard
        title="Pending Applications"
        value={stats.pendingApplications}
        icon={FileText}
        color="bg-amber-500"
        href="/super-admin/applications?status=pending"
      />
      <StatsCard
        title="Total Applications"
        value={stats.totalApplications}
        icon={CreditCard}
        color="bg-purple-500"
        href="/super-admin/applications"
      />
    </div>
  );
}

// Status configuration
const statusConfig: Record<string, { label: string; color: string; bgColor: string; icon: typeof Clock }> = {
  pending: { label: 'Pending', color: 'text-gray-700', bgColor: 'bg-gray-100', icon: Clock },
  payment_uploaded: { label: 'Payment Uploaded', color: 'text-amber-700', bgColor: 'bg-amber-100', icon: Upload },
  approved: { label: 'Approved', color: 'text-emerald-700', bgColor: 'bg-emerald-100', icon: CheckCircle2 },
  rejected: { label: 'Rejected', color: 'text-red-700', bgColor: 'bg-red-100', icon: XCircle },
};

// Recent Applications Component
async function RecentApplications() {
  const applications = await getRecentApplications();

  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-100 dark:border-slate-700">
      <div className="p-6 border-b border-gray-100 dark:border-slate-700 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold dark:text-white">Recent Applications</h2>
          <p className="text-sm text-gray-500 dark:text-slate-400">Farm applications requiring attention</p>
        </div>
        <Link 
          href="/super-admin/applications" 
          className="text-sm text-emerald-600 hover:text-emerald-700 flex items-center gap-1"
        >
          View all <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
      <div className="p-6">
        {applications.length === 0 ? (
          <div className="text-center py-8">
            <FileText className="w-12 h-12 mx-auto text-gray-300 dark:text-slate-600" />
            <p className="mt-2 text-gray-500 dark:text-slate-400">No applications yet</p>
          </div>
        ) : (
          <div className="space-y-3">
            {applications.map((app) => {
              const status = statusConfig[app.status] || statusConfig.pending;
              const StatusIcon = status.icon;
              
              return (
                <Link
                  key={app.id}
                  href={`/super-admin/applications?search=${app.id}`}
                  className={`flex items-center justify-between p-4 rounded-lg border transition-colors hover:bg-gray-50 dark:hover:bg-slate-700/50 ${
                    app.status === 'pending' || app.status === 'payment_uploaded'
                      ? 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800'
                      : 'bg-gray-50 dark:bg-slate-700/30 border-gray-200 dark:border-slate-600'
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <StatusIcon className={`w-5 h-5 ${
                      app.status === 'approved' ? 'text-emerald-600' :
                      app.status === 'rejected' ? 'text-red-600' :
                      'text-amber-600'
                    }`} />
                    <div>
                      <p className="font-medium dark:text-white">{app.farm_name}</p>
                      <p className="text-sm text-gray-500 dark:text-slate-400">
                        {app.owner_name} • {app.requested_plan} plan
                      </p>
                    </div>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${status.bgColor} ${status.color}`}>
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
    <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-100 dark:border-slate-700">
      <div className="p-6 border-b border-gray-100 dark:border-slate-700">
        <h2 className="text-lg font-semibold dark:text-white">Quick Actions</h2>
      </div>
      <div className="p-6 grid grid-cols-2 gap-4">
        <a
          href="/super-admin/applications?status=payment_uploaded"
          className="p-4 bg-amber-50 dark:bg-amber-900/20 rounded-lg hover:bg-amber-100 dark:hover:bg-amber-900/30 transition-colors text-center"
        >
          <FileText className="w-8 h-8 mx-auto mb-2 text-amber-600" />
          <p className="font-medium text-amber-700 dark:text-amber-400">Review Applications</p>
        </a>
        <a
          href="/super-admin/farms/new"
          className="p-4 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg hover:bg-emerald-100 dark:hover:bg-emerald-900/30 transition-colors text-center"
        >
          <Building2 className="w-8 h-8 mx-auto mb-2 text-emerald-600" />
          <p className="font-medium text-emerald-700 dark:text-emerald-400">Create Farm</p>
        </a>
        <a
          href="/super-admin/users"
          className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors text-center"
        >
          <Users className="w-8 h-8 mx-auto mb-2 text-blue-600" />
          <p className="font-medium text-blue-700 dark:text-blue-400">Manage Users</p>
        </a>
        <a
          href="/super-admin/payments"
          className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg hover:bg-purple-100 dark:hover:bg-purple-900/30 transition-colors text-center"
        >
          <CreditCard className="w-8 h-8 mx-auto mb-2 text-purple-600" />
          <p className="font-medium text-purple-700 dark:text-purple-400">View Payments</p>
        </a>
      </div>
    </div>
  );
}

export default function SuperAdminDashboard() {
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold dark:text-white">Super Admin Dashboard</h1>
        <p className="text-gray-500 dark:text-slate-400">Platform overview and management</p>
      </div>

      {/* Stats Grid */}
      <Suspense fallback={<div className="h-32 animate-pulse bg-gray-100 dark:bg-slate-700 rounded-xl" />}>
        <DashboardStats />
      </Suspense>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <RecentApplications />
        </div>
        <div>
          <QuickActions />
        </div>
      </div>
    </div>
  );
}
