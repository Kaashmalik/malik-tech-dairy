'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useOrganization, useUser } from '@clerk/nextjs';
import {
  BarChart3,
  Users,
  Heart,
  Activity,
  DollarSign,
  ShoppingCart,
  Package,
  TrendingUp,
  Calendar,
  AlertCircle,
  CheckCircle,
  Clock,
  Thermometer,
  Cloud,
  Droplets,
  Wind,
  Eye,
  MapPin,
  Plus,
  MoreVertical,
  Filter,
  Search,
  Bell,
  Settings,
  ChevronRight,
  ArrowUp,
  ArrowDown,
  Minus,
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import { format, subDays } from 'date-fns';

// Module Cards Component
function ModuleCard({
  title,
  description,
  count,
  change,
  changeType,
  icon: Icon,
  color,
  href,
  status,
  lastUpdate
}: {
  title: string;
  description: string;
  count: number;
  change: number;
  changeType: 'increase' | 'decrease' | 'neutral';
  icon: any;
  color: string;
  href: string;
  status?: 'active' | 'warning' | 'error';
  lastUpdate?: string;
}) {
  const getChangeIcon = () => {
    if (changeType === 'increase') return <ArrowUp className="h-3 w-3" />;
    if (changeType === 'decrease') return <ArrowDown className="h-3 w-3" />;
    return <Minus className="h-3 w-3" />;
  };

  const getChangeColor = () => {
    if (changeType === 'increase') return 'text-green-600';
    if (changeType === 'decrease') return 'text-red-600';
    return 'text-gray-600';
  };

  const getStatusColor = () => {
    if (status === 'active') return 'bg-green-100 text-green-800';
    if (status === 'warning') return 'bg-yellow-100 text-yellow-800';
    if (status === 'error') return 'bg-red-100 text-red-800';
    return 'bg-gray-100 text-gray-800';
  };

  return (
    <a href={href} className="block group">
      <Card className="hover:shadow-lg transition-all duration-200 border-0 shadow-sm">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className={`p-2 rounded-lg ${color}`}>
              <Icon className="h-5 w-5 text-white" />
            </div>
            {status && (
              <Badge variant="secondary" className={getStatusColor()}>
                {status}
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-lg">{count}</h3>
              <div className={`flex items-center gap-1 ${getChangeColor()}`}>
                {getChangeIcon()}
                <span className="text-xs font-medium">{Math.abs(change)}%</span>
              </div>
            </div>
            <h4 className="font-medium text-sm text-gray-900">{title}</h4>
            <p className="text-xs text-gray-500">{description}</p>
            {lastUpdate && (
              <p className="text-xs text-gray-400 flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {lastUpdate}
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </a>
  );
}

// Quick Stats Component
function QuickStats({ stats }: { stats: any[] }) {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {stats.map((stat, index) => (
        <Card key={index} className="border-0 shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                <p className="text-2xl font-bold">{stat.value}</p>
                <p className="text-xs text-gray-500">{stat.description}</p>
              </div>
              <div className={`p-3 rounded-full ${stat.color}`}>
                <stat.icon className="h-6 w-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

// Activity Feed Component
function ActivityFeed({ activities }: { activities: any[] }) {
  return (
    <Card className="border-0 shadow-sm">
      <CardHeader>
        <CardTitle className="text-lg">Recent Activity</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {activities.map((activity, index) => (
            <div key={index} className="flex items-start gap-3">
              <div className={`p-2 rounded-full ${activity.color}`}>
                <activity.icon className="h-4 w-4 text-white" />
              </div>
              <div className="flex-1 space-y-1">
                <p className="text-sm font-medium">{activity.title}</p>
                <p className="text-xs text-gray-500">{activity.description}</p>
                <p className="text-xs text-gray-400">{activity.time}</p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

// Main Dashboard Component
export default function ModernDashboard() {
  const { organization } = useOrganization();
  const { user } = useUser();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedModule, setSelectedModule] = useState('all');

  // Fetch data for all modules
  const { data: animalsData } = useQuery({
    queryKey: ['animals'],
    queryFn: async () => {
      const res = await fetch('/api/animals');
      const data = await res.json();
      return data.data;
    },
  });

  const { data: healthData } = useQuery({
    queryKey: ['health-records'],
    queryFn: async () => {
      const res = await fetch('/api/health/records');
      return res.json();
    },
  });

  const { data: milkData } = useQuery({
    queryKey: ['milk-stats'],
    queryFn: async () => {
      const res = await fetch('/api/milk/stats?days=7');
      return res.json();
    },
  });

  const { data: assetsData } = useQuery({
    queryKey: ['assets'],
    queryFn: async () => {
      const res = await fetch('/api/assets');
      return res.json();
    },
  });

  const { data: medicineData } = useQuery({
    queryKey: ['medicine-inventory'],
    queryFn: async () => {
      const res = await fetch('/api/medicine/inventory');
      return res.json();
    },
  });

  const { data: diseasesData } = useQuery({
    queryKey: ['diseases'],
    queryFn: async () => {
      const res = await fetch('/api/diseases');
      return res.json();
    },
  });

  const { data: salesData } = useQuery({
    queryKey: ['sales'],
    queryFn: async () => {
      const res = await fetch('/api/sales');
      const data = await res.json();
      return { sales: data.data || [] };
    },
  });

  const { data: expensesData } = useQuery({
    queryKey: ['expenses'],
    queryFn: async () => {
      const res = await fetch('/api/expenses');
      const data = await res.json();
      return { expenses: data.data || [] };
    },
  });

  // Module data
  const modules = [
    {
      title: 'Animals',
      description: 'Livestock management',
      count: animalsData?.animals?.length || 0,
      change: 12,
      changeType: 'increase' as const,
      icon: Users,
      color: 'bg-blue-500',
      href: '/animals',
      status: 'active' as const,
      lastUpdate: '2 min ago',
    },
    {
      title: 'Health Records',
      description: 'Medical history',
      count: healthData?.records?.length || 0,
      change: 8,
      changeType: 'increase' as const,
      icon: Heart,
      color: 'bg-red-500',
      href: '/health',
      status: 'active' as const,
      lastUpdate: '1 hour ago',
    },
    {
      title: 'Milk Production',
      description: 'Daily yield tracking',
      count: milkData?.todayTotal || 0,
      change: 5,
      changeType: 'increase' as const,
      icon: Package,
      color: 'bg-green-500',
      href: '/milk',
      status: 'active' as const,
      lastUpdate: 'Just now',
    },
    {
      title: 'Assets',
      description: 'Equipment & tools',
      count: assetsData?.assets?.length || 0,
      change: 0,
      changeType: 'neutral' as const,
      icon: Activity,
      color: 'bg-purple-500',
      href: '/assets',
      lastUpdate: '3 days ago',
    },
    {
      title: 'Medicine',
      description: 'Inventory tracking',
      count: medicineData?.items?.length || 0,
      change: -3,
      changeType: 'decrease' as const,
      icon: Package,
      color: 'bg-indigo-500',
      href: '/medicine',
      status: 'warning' as const,
      lastUpdate: '5 hours ago',
    },
    {
      title: 'Diseases',
      description: 'Disease database',
      count: diseasesData?.diseases?.length || 0,
      change: 0,
      changeType: 'neutral' as const,
      icon: AlertCircle,
      color: 'bg-yellow-500',
      href: '/diseases',
      lastUpdate: '1 week ago',
    },
    {
      title: 'Sales',
      description: 'Revenue tracking',
      count: salesData?.sales?.length || 0,
      change: 15,
      changeType: 'increase' as const,
      icon: DollarSign,
      color: 'bg-emerald-500',
      href: '/sales',
      status: 'active' as const,
      lastUpdate: 'Yesterday',
    },
    {
      title: 'Expenses',
      description: 'Cost management',
      count: expensesData?.expenses?.length || 0,
      change: 7,
      changeType: 'increase' as const,
      icon: ShoppingCart,
      color: 'bg-orange-500',
      href: '/expenses',
      lastUpdate: '2 days ago',
    },
  ];

  // Quick stats
  const quickStats = [
    {
      title: 'Total Revenue',
      value: '₨125,430',
      description: 'This month',
      icon: DollarSign,
      color: 'bg-green-100',
    },
    {
      title: 'Active Animals',
      value: animalsData?.animals?.length || 0,
      description: 'Healthy livestock',
      icon: Users,
      color: 'bg-blue-100',
    },
    {
      title: 'Milk Today',
      value: `${milkData?.todayTotal || 0}L`,
      description: 'Daily production',
      icon: Package,
      color: 'bg-purple-100',
    },
    {
      title: 'Health Score',
      value: '94%',
      description: 'Overall health',
      icon: Heart,
      color: 'bg-red-100',
    },
  ];

  // Recent activities
  const activities = [
    {
      title: 'New animal added',
      description: 'Cow-005 registered to the herd',
      time: '10 minutes ago',
      icon: Plus,
      color: 'bg-blue-100',
    },
    {
      title: 'Milk production recorded',
      description: '25L collected from Cow-002',
      time: '1 hour ago',
      icon: Package,
      color: 'bg-green-100',
    },
    {
      title: 'Health check completed',
      description: 'All animals vaccinated',
      time: '3 hours ago',
      icon: CheckCircle,
      color: 'bg-emerald-100',
    },
    {
      title: 'Low stock alert',
      description: 'Medicine inventory running low',
      time: '5 hours ago',
      icon: AlertCircle,
      color: 'bg-yellow-100',
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                {organization?.name || 'Farm'} Dashboard
              </h1>
              <p className="text-sm text-gray-500">
                Welcome back, {user?.firstName || 'Farmer'}
              </p>
            </div>
            <div className="flex items-center gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search modules..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 w-64"
                />
              </div>
              <Button variant="outline" size="sm">
                <Filter className="h-4 w-4 mr-2" />
                Filter
              </Button>
              <Button variant="outline" size="sm">
                <Bell className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="sm">
                <Settings className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Quick Stats */}
        <div className="mb-8">
          <QuickStats stats={quickStats} />
        </div>

        {/* Module Tabs */}
        <Tabs value={selectedModule} onValueChange={setSelectedModule} className="space-y-6">
          <div className="flex items-center justify-between">
            <TabsList className="grid w-full grid-cols-4 lg:w-auto">
              <TabsTrigger value="all">All Modules</TabsTrigger>
              <TabsTrigger value="livestock">Livestock</TabsTrigger>
              <TabsTrigger value="production">Production</TabsTrigger>
              <TabsTrigger value="finance">Finance</TabsTrigger>
            </TabsList>
            <Button variant="outline" size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Add New
            </Button>
          </div>

          {/* All Modules Grid */}
          <TabsContent value="all" className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {modules
                .filter((module) =>
                  module.title.toLowerCase().includes(searchQuery.toLowerCase())
                )
                .map((module, index) => (
                  <ModuleCard key={index} {...module} />
                ))}
            </div>
          </TabsContent>

          {/* Livestock Modules */}
          <TabsContent value="livestock" className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {modules
                .filter((m) => ['Animals', 'Health Records', 'Diseases'].includes(m.title))
                .map((module, index) => (
                  <ModuleCard key={index} {...module} />
                ))}
            </div>
          </TabsContent>

          {/* Production Modules */}
          <TabsContent value="production" className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {modules
                .filter((m) => ['Milk Production', 'Assets', 'Medicine'].includes(m.title))
                .map((module, index) => (
                  <ModuleCard key={index} {...module} />
                ))}
            </div>
          </TabsContent>

          {/* Finance Modules */}
          <TabsContent value="finance" className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {modules
                .filter((m) => ['Sales', 'Expenses'].includes(m.title))
                .map((module, index) => (
                  <ModuleCard key={index} {...module} />
                ))}
            </div>
          </TabsContent>
        </Tabs>

        {/* Activity Feed & Charts */}
        <div className="mt-8 grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <Card className="border-0 shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg">Production Overview</CardTitle>
                <CardDescription>Last 7 days performance</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-64 flex items-center justify-center text-gray-500">
                  <BarChart3 className="h-8 w-8 mr-2" />
                  Chart visualization will go here
                </div>
              </CardContent>
            </Card>
          </div>
          <div>
            <ActivityFeed activities={activities} />
          </div>
        </div>
      </div>
    </div>
  );
}
