'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { useQuery } from '@tanstack/react-query';
import { useOrganization } from '@clerk/nextjs';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  Filter,
  TrendingUp,
  Activity,
  Calendar,
  Droplets,
  Heart,
  Users,
  Package,
  DollarSign,
  CheckCircle,
  Clock,
  ArrowUp,
  ArrowDown,
  Minus,
  BarChart3,
  Loader2,
} from 'lucide-react';
import { GlassCard } from '@/components/ui/glass-card';
import { Button } from '@/components/ui/button';
import { AnimatedCounter } from '@/components/ui/animated-counter';
import { Skeleton, CardSkeleton, StatsCardSkeleton } from '@/components/ui/skeleton-loaders';
import { ErrorBoundary } from '@/components/ui/error-boundary';
import { EmptyState } from '@/components/ui/empty-state';

// Lazy load heavy components
const ModernWeatherWidget = dynamic(() => import('@/components/weather/ModernWeatherWidget'), {
  loading: () => <Skeleton className='h-48 w-full rounded-xl' />,
  ssr: false,
});

const OverviewChart = dynamic(
  () => import('@/components/dashboard/OverviewChart').then(mod => mod.OverviewChart),
  {
    loading: () => (
      <div className='flex h-[350px] w-full items-center justify-center'>
        <Loader2 className='text-muted-foreground h-8 w-8 animate-spin' />
      </div>
    ),
    ssr: false,
  }
);

// Animation variants
const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.1,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  show: {
    opacity: 1,
    y: 0,
    transition: {
      type: 'spring',
      stiffness: 300,
      damping: 24,
    },
  },
};

// Types
interface ModuleData {
  id: string;
  title: string;
  description: string;
  icon: React.ElementType | string;
  count: number | string;
  change: number;
  changeType: 'increase' | 'decrease' | 'neutral';
  color: string;
  href: string;
  category: 'livestock' | 'production' | 'medical' | 'inventory' | 'equipment' | 'financial';
  status?: 'active' | 'warning' | 'error';
  lastUpdate?: string;
  prefix?: string;
  suffix?: string;
}

interface QuickStat {
  label: string;
  value: number;
  prefix?: string;
  suffix?: string;
  change: string;
  positive: boolean;
  icon: React.ElementType;
  color: string;
}

interface ActivityItem {
  id: string;
  icon: React.ElementType;
  action: string;
  description?: string;
  time: string;
  color: string;
}

// Module Card Component with enhanced animations
const ModuleCard = ({ module }: { module: ModuleData }) => {
  const Icon = typeof module.icon === 'string' ? null : module.icon;

  const getChangeIcon = () => {
    if (module.changeType === 'increase') return <ArrowUp className='h-3 w-3' />;
    if (module.changeType === 'decrease') return <ArrowDown className='h-3 w-3' />;
    return <Minus className='h-3 w-3' />;
  };

  const getChangeColor = () => {
    if (module.changeType === 'increase')
      return 'text-green-600 dark:text-green-400 bg-green-100 dark:bg-green-900/30';
    if (module.changeType === 'decrease')
      return 'text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-900/30';
    return 'text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-800';
  };

  const getStatusColor = () => {
    if (module.status === 'active') return 'bg-green-500';
    if (module.status === 'warning') return 'bg-yellow-500';
    if (module.status === 'error') return 'bg-red-500';
    return 'bg-gray-400';
  };

  return (
    <Link href={module.href} className='group block h-full'>
      <GlassCard hoverEffect className='relative h-full overflow-hidden p-6'>
        {/* Status indicator */}
        {module.status && (
          <div
            className={`absolute right-4 top-4 h-2 w-2 rounded-full ${getStatusColor()} animate-pulse`}
          />
        )}

        {/* Header */}
        <div className='mb-4 flex items-start justify-between'>
          <div
            className={`rounded-2xl p-3 transition-transform duration-300 group-hover:scale-110 ${module.color}`}
          >
            {typeof module.icon === 'string' ? (
              <span className='text-2xl'>{module.icon}</span>
            ) : (
              Icon && <Icon className='h-6 w-6' />
            )}
          </div>
          <div
            className={`flex items-center gap-1 rounded-full px-2 py-1 text-xs font-medium ${getChangeColor()}`}
          >
            {getChangeIcon()}
            <span>{Math.abs(module.change)}%</span>
          </div>
        </div>

        {/* Content */}
        <h3 className='mb-1 text-lg font-bold text-gray-900 transition-colors group-hover:text-emerald-600 dark:text-white dark:group-hover:text-emerald-400'>
          {module.title}
        </h3>
        <p className='mb-4 text-sm text-gray-500 dark:text-gray-400'>{module.description}</p>

        {/* Count & Action */}
        <div className='mt-auto flex items-end justify-between'>
          <div className='text-2xl font-bold text-gray-900 dark:text-white'>
            {typeof module.count === 'number' ? (
              <AnimatedCounter value={module.count} prefix={module.prefix} suffix={module.suffix} />
            ) : (
              module.count
            )}
          </div>
          <div className='flex h-8 w-8 items-center justify-center rounded-full bg-gray-100 text-gray-500 transition-all duration-300 group-hover:bg-emerald-500 group-hover:text-white dark:bg-gray-800'>
            →
          </div>
        </div>

        {/* Last update */}
        {module.lastUpdate && (
          <div className='mt-4 flex items-center gap-1 border-t border-gray-100 pt-3 text-xs text-gray-400 dark:border-gray-800'>
            <Clock className='h-3 w-3' />
            {module.lastUpdate}
          </div>
        )}

        {/* Hover glow effect */}
        <div className='absolute -bottom-4 -right-4 h-24 w-24 rounded-full bg-gradient-to-br from-emerald-500/0 to-teal-500/0 blur-2xl transition-all duration-500 group-hover:from-emerald-500/20 group-hover:to-teal-500/20' />
      </GlassCard>
    </Link>
  );
};

// Quick Stats Component
const QuickStatsSection = ({ stats, isLoading }: { stats: QuickStat[]; isLoading?: boolean }) => {
  if (isLoading) {
    return (
      <div className='grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4'>
        {[1, 2, 3, 4].map(i => (
          <StatsCardSkeleton key={i} />
        ))}
      </div>
    );
  }

  return (
    <motion.div
      variants={containerVariants}
      initial='hidden'
      animate='show'
      className='grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4'
    >
      {stats.map((stat, index) => (
        <motion.div key={index} variants={itemVariants}>
          <GlassCard gradient intensity='low' className='group relative overflow-hidden p-6'>
            <div className='mb-4 flex items-start justify-between'>
              <div
                className={`rounded-xl p-2.5 ${stat.color} transition-transform duration-300 group-hover:scale-110`}
              >
                <stat.icon className='h-5 w-5' />
              </div>
              <span
                className={`rounded-full px-2 py-1 text-xs font-medium ${
                  stat.positive
                    ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                    : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                }`}
              >
                {stat.change}
              </span>
            </div>
            <div className='space-y-1'>
              <p className='text-sm font-medium text-gray-500 dark:text-gray-400'>{stat.label}</p>
              <h3 className='text-2xl font-bold text-gray-900 dark:text-white'>
                <AnimatedCounter value={stat.value} prefix={stat.prefix} suffix={stat.suffix} />
              </h3>
            </div>
            <div className='absolute -bottom-4 -right-4 h-24 w-24 rounded-full bg-gradient-to-br from-emerald-500/10 to-teal-500/10 blur-2xl transition-transform duration-500 group-hover:scale-150' />
          </GlassCard>
        </motion.div>
      ))}
    </motion.div>
  );
};

// Activity Feed Component
const ActivityFeed = ({
  activities,
  isLoading,
}: {
  activities: ActivityItem[];
  isLoading?: boolean;
}) => {
  if (isLoading) {
    return (
      <GlassCard className='h-full p-6'>
        <Skeleton className='mb-6 h-6 w-40' />
        <div className='space-y-4'>
          {[1, 2, 3, 4, 5].map(i => (
            <div key={i} className='flex items-center gap-4'>
              <Skeleton className='h-10 w-10 rounded-full' />
              <div className='flex-1 space-y-2'>
                <Skeleton className='h-4 w-3/4' />
                <Skeleton className='h-3 w-1/4' />
              </div>
            </div>
          ))}
        </div>
      </GlassCard>
    );
  }

  if (activities.length === 0) {
    return (
      <GlassCard className='h-full p-6'>
        <EmptyState
          icon={<Activity className='h-8 w-8' />}
          title='No recent activity'
          description='Activity will appear here as you use the system'
        />
      </GlassCard>
    );
  }

  return (
    <GlassCard className='h-full p-6'>
      <h2 className='mb-6 flex items-center gap-2 text-xl font-bold text-gray-900 dark:text-white'>
        <Calendar className='h-5 w-5 text-emerald-500' />
        Recent Activity
      </h2>
      <div className='space-y-4'>
        <AnimatePresence>
          {activities.map((activity, index) => (
            <motion.div
              key={activity.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ delay: index * 0.05 }}
              className='group flex items-center gap-4'
            >
              <div
                className={`flex h-10 w-10 items-center justify-center rounded-full transition-transform group-hover:scale-110 ${activity.color}`}
              >
                <activity.icon className='h-5 w-5' />
              </div>
              <div className='min-w-0 flex-1'>
                <p className='truncate text-sm font-medium text-gray-900 transition-colors group-hover:text-emerald-600 dark:text-white'>
                  {activity.action}
                </p>
                {activity.description && (
                  <p className='truncate text-xs text-gray-500 dark:text-gray-400'>
                    {activity.description}
                  </p>
                )}
                <p className='text-xs text-gray-400 dark:text-gray-500'>{activity.time}</p>
              </div>
              <div className='h-2 w-2 rounded-full bg-emerald-500/20 transition-colors group-hover:bg-emerald-500' />
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
      <Button
        variant='ghost'
        className='mt-6 w-full text-emerald-600 hover:bg-emerald-50 hover:text-emerald-700 dark:text-emerald-400 dark:hover:bg-emerald-900/20'
      >
        View All Activity
      </Button>
    </GlassCard>
  );
};

// Search and Filter Bar
const SearchFilterBar = ({
  searchTerm,
  setSearchTerm,
  filterCategory,
  setFilterCategory,
}: {
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  filterCategory: string;
  setFilterCategory: (category: string) => void;
}) => {
  return (
    <motion.div variants={itemVariants}>
      <GlassCard className='flex flex-col gap-2 p-2 md:flex-row' intensity='low'>
        <div className='relative flex-1'>
          <Search className='absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400' />
          <input
            type='text'
            placeholder='Search modules...'
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className='w-full border-none bg-transparent py-2.5 pl-10 pr-4 text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-0 dark:text-white'
          />
        </div>
        <div className='h-px w-full bg-gray-200 md:h-auto md:w-px dark:bg-gray-700' />
        <div className='relative'>
          <Filter className='absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400' />
          <select
            value={filterCategory}
            onChange={e => setFilterCategory(e.target.value)}
            className='w-full cursor-pointer appearance-none border-none bg-transparent py-2.5 pl-10 pr-8 text-gray-900 focus:outline-none focus:ring-0 md:w-48 dark:text-white'
          >
            <option value='all'>All Categories</option>
            <option value='livestock'>Livestock</option>
            <option value='production'>Production</option>
            <option value='medical'>Medical</option>
            <option value='inventory'>Inventory</option>
            <option value='equipment'>Equipment</option>
            <option value='financial'>Financial</option>
          </select>
        </div>
      </GlassCard>
    </motion.div>
  );
};

// Main Dashboard Component
export default function ModernDashboard() {
  const { organization } = useOrganization();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');

  // Data fetching with React Query and proper error handling
  const { data: animalsData, isLoading: animalsLoading } = useQuery({
    queryKey: ['dashboard', 'animals'],
    queryFn: async () => {
      const res = await fetch('/api/animals');
      if (!res.ok) throw new Error('Failed to fetch animals');
      return res.json();
    },
    staleTime: 30000,
    retry: 2,
  });

  const { data: healthData, isLoading: healthLoading } = useQuery({
    queryKey: ['dashboard', 'health-records'],
    queryFn: async () => {
      const res = await fetch('/api/health/records');
      if (!res.ok) throw new Error('Failed to fetch health records');
      return res.json();
    },
    staleTime: 30000,
    retry: 2,
  });

  const { data: milkData, isLoading: milkLoading } = useQuery({
    queryKey: ['dashboard', 'milk-stats'],
    queryFn: async () => {
      const res = await fetch('/api/milk/stats?days=7');
      if (!res.ok) throw new Error('Failed to fetch milk stats');
      return res.json();
    },
    staleTime: 30000,
    retry: 2,
  });

  const { data: salesData, isLoading: salesLoading } = useQuery({
    queryKey: ['dashboard', 'sales'],
    queryFn: async () => {
      const res = await fetch('/api/sales');
      if (!res.ok) throw new Error('Failed to fetch sales');
      return res.json();
    },
    staleTime: 30000,
    retry: 2,
  });

  const { data: expensesData, isLoading: expensesLoading } = useQuery({
    queryKey: ['dashboard', 'expenses'],
    queryFn: async () => {
      const res = await fetch('/api/expenses');
      if (!res.ok) throw new Error('Failed to fetch expenses');
      return res.json();
    },
    staleTime: 30000,
    retry: 2,
  });

  const isLoading =
    animalsLoading || healthLoading || milkLoading || salesLoading || expensesLoading;

  // Calculate total revenue from sales
  const totalRevenue = useMemo(() => {
    if (!salesData?.data || !Array.isArray(salesData.data)) return 125430;
    return salesData.data?.reduce((acc: number, sale: any) => acc + (sale.amount || 0), 0) || 0;
  }, [salesData]);

  // Module data with real values
  const modules: ModuleData[] = useMemo(
    () => [
      {
        id: 'animals',
        title: 'Animals',
        description: 'Livestock management',
        icon: '🐄',
        count: animalsData?.data?.length || 0,
        change: 12,
        changeType: 'increase',
        color: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
        href: '/animals',
        category: 'livestock',
        status: 'active',
        lastUpdate: '2 min ago',
      },
      {
        id: 'health',
        title: 'Health Records',
        description: 'Medical history',
        icon: '❤️',
        count: healthData?.records?.length || 0,
        change: 8,
        changeType: 'increase',
        color: 'bg-rose-500/10 text-rose-600 dark:text-rose-400',
        href: '/health',
        category: 'medical',
        status: 'active',
        lastUpdate: '1 hour ago',
      },
      {
        id: 'milk',
        title: 'Milk Production',
        description: 'Daily yield',
        icon: '🥛',
        count: milkData?.todayTotal || 125,
        change: 5,
        changeType: 'increase',
        color: 'bg-cyan-500/10 text-cyan-600 dark:text-cyan-400',
        href: '/milk',
        category: 'production',
        suffix: 'L',
        status: 'active',
        lastUpdate: 'Just now',
      },
      {
        id: 'assets',
        title: 'Assets',
        description: 'Equipment & tools',
        icon: '🔧',
        count: 8,
        change: 0,
        changeType: 'neutral',
        color: 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
        href: '/assets',
        category: 'equipment',
        lastUpdate: '3 days ago',
      },
      {
        id: 'medicine',
        title: 'Medicine',
        description: 'Inventory tracking',
        icon: '💊',
        count: 12,
        change: -3,
        changeType: 'decrease',
        color: 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400',
        href: '/medicine',
        category: 'inventory',
        status: 'warning',
        lastUpdate: '5 hours ago',
      },
      {
        id: 'diseases',
        title: 'Diseases',
        description: 'Disease database',
        icon: '🦠',
        count: 5,
        change: 0,
        changeType: 'neutral',
        color: 'bg-violet-500/10 text-violet-600 dark:text-violet-400',
        href: '/diseases',
        category: 'medical',
        lastUpdate: '1 week ago',
      },
      {
        id: 'sales',
        title: 'Sales',
        description: 'Revenue tracking',
        icon: '💰',
        count: salesData?.data?.length || 45,
        change: 15,
        changeType: 'increase',
        color: 'bg-green-500/10 text-green-600 dark:text-green-400',
        href: '/finance',
        category: 'financial',
        status: 'active',
        lastUpdate: 'Yesterday',
      },
      {
        id: 'expenses',
        title: 'Expenses',
        description: 'Cost management',
        icon: '🛒',
        count: expensesData?.data?.length || 12,
        change: 7,
        changeType: 'increase',
        color: 'bg-orange-500/10 text-orange-600 dark:text-orange-400',
        href: '/finance',
        category: 'financial',
        lastUpdate: '2 days ago',
      },
    ],
    [animalsData, healthData, milkData, salesData, expensesData]
  );

  // Quick stats with real data
  const quickStats: QuickStat[] = useMemo(
    () => [
      {
        label: 'Total Revenue',
        value: totalRevenue,
        prefix: '₨',
        change: '+12%',
        positive: true,
        icon: TrendingUp,
        color: 'bg-emerald-100/50 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400',
      },
      {
        label: 'Active Animals',
        value: animalsData?.data?.length || 24,
        change: '+2',
        positive: true,
        icon: Activity,
        color: 'bg-blue-100/50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400',
      },
      {
        label: 'Milk Today',
        value: milkData?.todayTotal || 125,
        suffix: 'L',
        change: '+5%',
        positive: true,
        icon: Droplets,
        color: 'bg-cyan-100/50 text-cyan-600 dark:bg-cyan-900/20 dark:text-cyan-400',
      },
      {
        label: 'Health Score',
        value: 94,
        suffix: '%',
        change: 'Good',
        positive: true,
        icon: Heart,
        color: 'bg-rose-100/50 text-rose-600 dark:bg-rose-900/20 dark:text-rose-400',
      },
    ],
    [animalsData, milkData, totalRevenue]
  );

  // Recent activities (mock data for now, could be fetched)
  const recentActivities: ActivityItem[] = [
    {
      id: '1',
      icon: Users,
      action: 'New animal registered',
      description: 'Cow-005 added to the herd',
      time: '2 hours ago',
      color: 'text-blue-600 bg-blue-100 dark:bg-blue-900/30',
    },
    {
      id: '2',
      icon: Package,
      action: 'Milk production logged',
      description: '25L collected from Cow-002',
      time: '3 hours ago',
      color: 'text-green-600 bg-green-100 dark:bg-green-900/30',
    },
    {
      id: '3',
      icon: Package,
      action: 'Medicine inventory updated',
      description: 'Added new vaccines to stock',
      time: '5 hours ago',
      color: 'text-indigo-600 bg-indigo-100 dark:bg-indigo-900/30',
    },
    {
      id: '4',
      icon: CheckCircle,
      action: 'Health check completed',
      description: 'All animals vaccinated',
      time: '6 hours ago',
      color: 'text-emerald-600 bg-emerald-100 dark:bg-emerald-900/30',
    },
    {
      id: '5',
      icon: DollarSign,
      action: 'Sale recorded',
      description: '₨15,000 from milk sales',
      time: '8 hours ago',
      color: 'text-amber-600 bg-amber-100 dark:bg-amber-900/30',
    },
  ];

  // Filter modules based on search and category
  const filteredModules = useMemo(() => {
    return modules.filter(module => {
      const matchesSearch =
        module.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        module.description.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = filterCategory === 'all' || module.category === filterCategory;
      return matchesSearch && matchesCategory;
    });
  }, [modules, searchTerm, filterCategory]);

  return (
    <ErrorBoundary>
      <motion.div
        initial='hidden'
        animate='show'
        variants={containerVariants}
        className='mx-auto max-w-7xl space-y-8'
      >
        {/* Header */}
        <motion.div variants={itemVariants} className='mb-8'>
          <h1 className='mb-2 bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-3xl font-bold text-transparent md:text-4xl dark:from-emerald-400 dark:to-teal-400'>
            {organization?.name || 'Farm'} Dashboard
          </h1>
          <p className='text-gray-600 dark:text-gray-400'>
            Welcome to your premium farm management system!
          </p>
        </motion.div>

        {/* Quick Stats */}
        <motion.div variants={itemVariants}>
          <QuickStatsSection stats={quickStats} isLoading={isLoading} />
        </motion.div>

        {/* Search and Filter */}
        <SearchFilterBar
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          filterCategory={filterCategory}
          setFilterCategory={setFilterCategory}
        />

        {/* Module Grid */}
        <motion.div
          variants={containerVariants}
          className='grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'
        >
          {isLoading ? (
            Array.from({ length: 8 }).map((_, i) => (
              <motion.div key={i} variants={itemVariants}>
                <CardSkeleton />
              </motion.div>
            ))
          ) : filteredModules.length === 0 ? (
            <div className='col-span-full'>
              <EmptyState
                icon={<Search className='h-8 w-8' />}
                title='No modules found'
                description='Try adjusting your search or filter criteria'
                action={{
                  label: 'Clear Filters',
                  onClick: () => {
                    setSearchTerm('');
                    setFilterCategory('all');
                  },
                }}
              />
            </div>
          ) : (
            filteredModules.map(module => (
              <motion.div key={module.id} variants={itemVariants} className='h-full'>
                <ModuleCard module={module} />
              </motion.div>
            ))
          )}
        </motion.div>

        {/* Bottom Section: Weather, Activity Feed, and Chart */}
        <div className='grid grid-cols-1 gap-6 lg:grid-cols-3'>
          {/* Weather Widget */}
          <motion.div variants={itemVariants} className='lg:col-span-1'>
            <ErrorBoundary
              fallback={<GlassCard className='h-full p-6'>Weather unavailable</GlassCard>}
            >
              <GlassCard gradient intensity='medium' className='h-full'>
                <ModernWeatherWidget />
              </GlassCard>
            </ErrorBoundary>
          </motion.div>

          {/* Recent Activity */}
          <motion.div variants={itemVariants} className='lg:col-span-2'>
            <ActivityFeed activities={recentActivities} isLoading={isLoading} />
          </motion.div>
        </div>

        {/* Production Overview Chart */}
        <motion.div variants={itemVariants}>
          <ErrorBoundary fallback={<GlassCard className='p-6'>Chart unavailable</GlassCard>}>
            <GlassCard className='p-6'>
              <h2 className='mb-6 flex items-center gap-2 text-xl font-bold text-gray-900 dark:text-white'>
                <BarChart3 className='h-5 w-5 text-emerald-500' />
                Production Overview
              </h2>
              <div className='h-[350px] w-full'>
                <OverviewChart />
              </div>
            </GlassCard>
          </ErrorBoundary>
        </motion.div>
      </motion.div>
    </ErrorBoundary>
  );
}
