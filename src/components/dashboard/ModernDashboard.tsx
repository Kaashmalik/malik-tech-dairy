'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useOrganization, useUser } from '@clerk/nextjs';
import { OverviewChart } from '@/components/dashboard/OverviewChart';
import {
  Users,
  Heart,
  Activity,
  DollarSign,
  ShoppingCart,
  Package,
  Calendar,
  AlertCircle,
  CheckCircle,
  Clock,
  Plus,
  Filter,
  Search,
  Bell,
  Settings,
  ArrowUp,
  ArrowDown,
  Minus,
  BarChart3,
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { MotionWrapper, MotionItem } from '@/components/ui/motion-wrapper';

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
  lastUpdate,
  index = 0
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
  index?: number;
}) {
  const getChangeIcon = () => {
    if (changeType === 'increase') return <ArrowUp className="h-3 w-3" />;
    if (changeType === 'decrease') return <ArrowDown className="h-3 w-3" />;
    return <Minus className="h-3 w-3" />;
  };

  const getChangeColor = () => {
    if (changeType === 'increase') return 'text-green-600 dark:text-green-400';
    if (changeType === 'decrease') return 'text-red-600 dark:text-red-400';
    return 'text-muted-foreground';
  };

  const getStatusColor = () => {
    if (status === 'active') return 'bg-green-500/10 text-green-700 dark:text-green-400 border-green-200 dark:border-green-900';
    if (status === 'warning') return 'bg-yellow-500/10 text-yellow-700 dark:text-yellow-400 border-yellow-200 dark:border-yellow-900';
    if (status === 'error') return 'bg-red-500/10 text-red-700 dark:text-red-400 border-red-200 dark:border-red-900';
    return 'bg-secondary text-secondary-foreground';
  };

  return (
    <a href={href} className="block group">
      <Card
        variant="neo"
        hoverEffect="spotlight"
        className="h-full group-hover:border-primary/50 transition-colors duration-300"
      >
        <CardHeader className="pb-3 flex-row items-center justify-between space-y-0">
          <div className={`p-2.5 rounded-xl ${color} bg-opacity-15 backdrop-blur-sm group-hover:scale-110 transition-transform duration-300`}>
            <Icon className={`h-5 w-5 ${color.replace('bg-', 'text-').replace('-100', '-600')}`} />
          </div>
          {status && (
            <Badge variant="outline" className={`${getStatusColor()} border`}>
              {status}
            </Badge>
          )}
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <div className="flex items-baseline justify-between">
                <h3 className="text-2xl font-bold tracking-tight">{count}</h3>
                <div className={`flex items-center gap-1 ${getChangeColor()} text-sm font-medium`}>
                  {getChangeIcon()}
                  <span>{Math.abs(change)}%</span>
                </div>
              </div>
              <h4 className="font-semibold text-foreground/80 mt-1">{title}</h4>
              <p className="text-sm text-muted-foreground line-clamp-1">{description}</p>
            </div>

            {lastUpdate && (
              <div className="pt-3 border-t border-border/50 flex items-center justify-between text-xs text-muted-foreground">
                <span className="flex items-center gap-1.5">
                  <Clock className="h-3 w-3" />
                  {lastUpdate}
                </span>
                <span className="opacity-0 group-hover:opacity-100 transition-opacity text-primary font-medium">View &rarr;</span>
              </div>
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
        <MotionWrapper key={index} delay={index * 0.1}>
          <Card variant="glass" className="border-l-4 border-l-primary/50 overflow-hidden relative">
            <div className={`absolute right-0 top-0 p-20 rounded-full blur-3xl opacity-10 -mr-10 -mt-10 ${stat.color.replace('bg-', 'bg-')}`} />
            <CardContent className="p-6 relative z-10">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">{stat.title}</p>
                  <p className="text-3xl font-bold mt-1 tracking-tight">{stat.value}</p>
                  <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                    <span className="text-green-500 font-medium">+2.5%</span> from last month
                  </p>
                </div>
                <div className={`p-3 rounded-xl ${stat.color} bg-opacity-20`}>
                  <stat.icon className={`h-6 w-6 ${stat.color.replace('bg-', 'text-').replace('-100', '-600')}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        </MotionWrapper>
      ))}
    </div>
  );
}

// Activity Feed Component
function ActivityFeed({ activities }: { activities: any[] }) {
  return (
    <Card variant="default" className="h-full">
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Activity className="h-5 w-5 text-primary" />
          Recent Activity
        </CardTitle>
        <CardDescription>Latest updates from your farm</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="relative pl-6 border-l border-border/50 space-y-6">
          {activities.map((activity, index) => (
            <MotionItem key={index} className="relative">
              <div className={`absolute -left-[29px] top-1 p-1.5 rounded-full border-2 border-background ${activity.color}`}>
                <activity.icon className="h-3 w-3 text-white" />
              </div>
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold">{activity.title}</p>
                  <span className="text-xs text-muted-foreground">{activity.time}</span>
                </div>
                <p className="text-sm text-muted-foreground">{activity.description}</p>
              </div>
            </MotionItem>
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

  // Fetch data for all modules (simulated or real)
  // ... (keeping existing query logic for brevity, assuming standard hooks work)
  const { data: animalsData } = useQuery({ queryKey: ['animals'], queryFn: async () => ((await fetch('/api/animals')).json()).then(r => r.data) });
  const { data: healthData } = useQuery({ queryKey: ['health-records'], queryFn: async () => (await fetch('/api/health/records')).json() });
  const { data: milkData } = useQuery({ queryKey: ['milk-stats'], queryFn: async () => (await fetch('/api/milk/stats?days=7')).json() });
  const { data: assetsData } = useQuery({ queryKey: ['assets'], queryFn: async () => (await fetch('/api/assets')).json() });
  const { data: medicineData } = useQuery({ queryKey: ['medicine-inventory'], queryFn: async () => (await fetch('/api/medicine/inventory')).json() });
  const { data: diseasesData } = useQuery({ queryKey: ['diseases'], queryFn: async () => (await fetch('/api/diseases')).json() });
  const { data: salesData } = useQuery({ queryKey: ['sales'], queryFn: async () => ((await fetch('/api/sales')).json()).then(r => ({ sales: r.data || [] })) });
  const { data: expensesData } = useQuery({ queryKey: ['expenses'], queryFn: async () => ((await fetch('/api/expenses')).json()).then(r => ({ expenses: r.data || [] })) });

  // Module data
  const modules = [
    {
      title: 'Animals', description: 'Livestock management', count: animalsData?.animals?.length || 0,
      change: 12, changeType: 'increase' as const, icon: Users, color: 'bg-blue-100', href: '/animals', status: 'active' as const, lastUpdate: '2 min ago',
    },
    {
      title: 'Health Records', description: 'Medical history', count: healthData?.records?.length || 0,
      change: 8, changeType: 'increase' as const, icon: Heart, color: 'bg-red-100', href: '/health', status: 'active' as const, lastUpdate: '1 hour ago',
    },
    {
      title: 'Milk Production', description: 'Daily yield tracking', count: milkData?.todayTotal || 0,
      change: 5, changeType: 'increase' as const, icon: Package, color: 'bg-green-100', href: '/milk', status: 'active' as const, lastUpdate: 'Just now',
    },
    {
      title: 'Assets', description: 'Equipment & tools', count: assetsData?.assets?.length || 0,
      change: 0, changeType: 'neutral' as const, icon: Activity, color: 'bg-purple-100', href: '/assets', lastUpdate: '3 days ago',
    },
    {
      title: 'Medicine', description: 'Inventory tracking', count: medicineData?.items?.length || 0,
      change: -3, changeType: 'decrease' as const, icon: Package, color: 'bg-indigo-100', href: '/medicine', status: 'warning' as const, lastUpdate: '5 hours ago',
    },
    {
      title: 'Diseases', description: 'Disease database', count: diseasesData?.diseases?.length || 0,
      change: 0, changeType: 'neutral' as const, icon: AlertCircle, color: 'bg-yellow-100', href: '/diseases', lastUpdate: '1 week ago',
    },
    {
      title: 'Sales', description: 'Revenue tracking', count: salesData?.sales?.length || 0,
      change: 15, changeType: 'increase' as const, icon: DollarSign, color: 'bg-emerald-100', href: '/sales', status: 'active' as const, lastUpdate: 'Yesterday',
    },
    {
      title: 'Expenses', description: 'Cost management', count: expensesData?.expenses?.length || 0,
      change: 7, changeType: 'increase' as const, icon: ShoppingCart, color: 'bg-orange-100', href: '/expenses', lastUpdate: '2 days ago',
    },
  ];

  // Quick stats
  const quickStats = [
    { title: 'Total Revenue', value: '₨125,430', description: 'This month', icon: DollarSign, color: 'bg-green-100' },
    { title: 'Active Animals', value: animalsData?.animals?.length || 0, description: 'Healthy livestock', icon: Users, color: 'bg-blue-100' },
    { title: 'Milk Today', value: `${milkData?.todayTotal || 0}L`, description: 'Daily production', icon: Package, color: 'bg-purple-100' },
    { title: 'Health Score', value: '94%', description: 'Overall health', icon: Heart, color: 'bg-red-100' },
  ];

  // Recent activities (simulated)
  const activities = [
    { title: 'New animal added', description: 'Cow-005 registered to the herd', time: '10 minutes ago', icon: Plus, color: 'bg-blue-500' },
    { title: 'Milk production recorded', description: '25L collected from Cow-002', time: '1 hour ago', icon: Package, color: 'bg-green-500' },
    { title: 'Health check completed', description: 'All animals vaccinated', time: '3 hours ago', icon: CheckCircle, color: 'bg-emerald-500' },
    { title: 'Low stock alert', description: 'Medicine inventory running low', time: '5 hours ago', icon: AlertCircle, color: 'bg-yellow-500' },
  ];

  const filteredModules = modules.filter((module) =>
    module.title.toLowerCase().includes(searchQuery.toLowerCase()) &&
    (selectedModule === 'all' ||
      (selectedModule === 'livestock' && ['Animals', 'Health Records', 'Diseases'].includes(module.title)) ||
      (selectedModule === 'production' && ['Milk Production', 'Assets', 'Medicine'].includes(module.title)) ||
      (selectedModule === 'finance' && ['Sales', 'Expenses'].includes(module.title)))
  );

  return (
    <div className="min-h-screen bg-background/50">
      {/* Sticky Glass Header */}
      <header className="sticky top-0 z-40 w-full backdrop-blur-xl bg-background/60 border-b border-white/10 supports-[backdrop-filter]:bg-background/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div>
              <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-primary/60">
                {organization?.name || 'Farm'} Dashboard
              </h1>
            </div>
            <div className="flex items-center gap-3">
              <div className="relative hidden sm:block">
                <Input
                  variant="neo"
                  placeholder="Search modules..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  startIcon={<Search className="h-4 w-4" />}
                  className="w-64"
                />
              </div>
              <Button variant="ghost" size="icon" className="rounded-full">
                <Bell className="h-5 w-5" />
              </Button>
              <Button variant="ghost" size="icon" className="rounded-full">
                <Settings className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Quick Stats */}
        <QuickStats stats={quickStats} />

        {/* Module Tabs & Grid */}
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <Tabs value={selectedModule} onValueChange={setSelectedModule} className="w-full sm:w-auto">
              <TabsList className="bg-muted/50 p-1">
                <TabsTrigger value="all" className="data-[state=active]:bg-background data-[state=active]:shadow-sm">All</TabsTrigger>
                <TabsTrigger value="livestock" className="data-[state=active]:bg-background data-[state=active]:shadow-sm">Livestock</TabsTrigger>
                <TabsTrigger value="production" className="data-[state=active]:bg-background data-[state=active]:shadow-sm">Production</TabsTrigger>
                <TabsTrigger value="finance" className="data-[state=active]:bg-background data-[state=active]:shadow-sm">Finance</TabsTrigger>
              </TabsList>
            </Tabs>

            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" className="hidden sm:flex" leftIcon={<Filter className="h-4 w-4" />}>
                Filter
              </Button>
              <Button variant="default" size="sm" className="w-full sm:w-auto" leftIcon={<Plus className="h-4 w-4" />}>
                Add New
              </Button>
            </div>
          </div>

          <MotionWrapper stagger>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {filteredModules.map((module, index) => (
                <MotionItem key={index}>
                  <ModuleCard {...module} index={index} />
                </MotionItem>
              ))}
            </div>
          </MotionWrapper>
        </div>

        {/* Activity Feed & Charts */}
        <div className="grid gap-6 lg:grid-cols-3">
          <MotionWrapper className="lg:col-span-2" delay={0.2} variant="fadeInLeft">
            <Card variant="default" className="h-full">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5 text-primary" />
                  Production Overview
                </CardTitle>
                <CardDescription>Performance analytics for the last 7 days</CardDescription>
              </CardHeader>
              import {OverviewChart} from '@/components/dashboard/OverviewChart';

              // ... (in the render part)

              <CardContent>
                <div className="w-full h-[350px]">
                  <OverviewChart />
                </div>
              </CardContent>
            </Card>
          </MotionWrapper>


          <MotionWrapper className="lg:col-span-1" delay={0.3} variant="fadeInRight">
            <ActivityFeed activities={activities} />
          </MotionWrapper>
        </div>
      </main>
    </div>
  );
}
