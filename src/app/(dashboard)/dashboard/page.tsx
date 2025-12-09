'use client';

import { useQuery } from '@tanstack/react-query';
import { useOrganization, useUser } from '@clerk/nextjs';
import { MilkChart } from '@/components/dashboard/MilkChart';
import { AnimalsBySpeciesChart } from '@/components/dashboard/AnimalsBySpeciesChart';
import Link from 'next/link';
import { format } from 'date-fns';
import {
  Beef,
  Droplets,
  Egg,
  Crown,
  TrendingUp,
  Plus,
  Settings,
  Heart,
  ArrowUpRight,
  Sparkles,
  Sun,
  Moon,
  CloudSun,
  Activity,
  Calendar,
  ChevronRight,
} from 'lucide-react';

// Alias icons for semantic clarity
const CowIcon = Beef;
const MilkIcon = Droplets;

export default function DashboardPageClient() {
  const { organization } = useOrganization();
  const { user } = useUser();

  const { data: animalsData, isLoading: animalsLoading } = useQuery({
    queryKey: ['animals'],
    queryFn: async () => {
      const res = await fetch('/api/animals');
      if (!res.ok) return { animals: [] };
      return res.json();
    },
  });

  const { data: milkStats, isLoading: milkLoading } = useQuery({
    queryKey: ['milk-stats'],
    queryFn: async () => {
      const res = await fetch('/api/milk/stats?days=1');
      if (!res.ok) return { todayTotal: 0 };
      return res.json();
    },
  });

  const { data: eggStats } = useQuery({
    queryKey: ['egg-stats'],
    queryFn: async () => {
      const today = format(new Date(), 'yyyy-MM-dd');
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

  const farmName = organization?.name || 'Your Farm';
  const userName = user?.firstName || 'Farmer';

  // Get greeting based on time
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return { text: 'Good Morning', icon: Sun, color: 'text-amber-500' };
    if (hour < 17) return { text: 'Good Afternoon', icon: CloudSun, color: 'text-orange-500' };
    return { text: 'Good Evening', icon: Moon, color: 'text-indigo-500' };
  };

  const greeting = getGreeting();
  const GreetingIcon = greeting.icon;

  const statCards = [
    {
      title: 'Total Animals',
      value: totalAnimals,
      suffix: '',
      icon: CowIcon,
      gradient: 'from-emerald-500 to-teal-600',
      bgGradient: 'from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20',
      iconBg: 'bg-emerald-100 dark:bg-emerald-900/50',
      iconColor: 'text-emerald-600 dark:text-emerald-400',
      trend: '+12%',
      trendUp: true,
      description: totalAnimals === 0 ? 'Add animals to start' : 'Active livestock',
      loading: animalsLoading,
    },
    {
      title: 'Milk Today',
      value: milkToday.toFixed(1),
      suffix: ' L',
      icon: MilkIcon,
      gradient: 'from-blue-500 to-cyan-600',
      bgGradient: 'from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20',
      iconBg: 'bg-blue-100 dark:bg-blue-900/50',
      iconColor: 'text-blue-600 dark:text-blue-400',
      trend: '+8%',
      trendUp: true,
      description: milkToday === 0 ? 'Start logging milk' : "Today's production",
      loading: milkLoading,
    },
    {
      title: 'Eggs Collected',
      value: eggsToday,
      suffix: '',
      icon: Egg,
      gradient: 'from-amber-500 to-orange-600',
      bgGradient: 'from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20',
      iconBg: 'bg-amber-100 dark:bg-amber-900/50',
      iconColor: 'text-amber-600 dark:text-amber-400',
      trend: '+5%',
      trendUp: true,
      description: eggsToday === 0 ? 'No eggs today' : "Today's collection",
      loading: false,
    },
    {
      title: 'Farm Status',
      value: 'Active',
      suffix: '',
      icon: Crown,
      gradient: 'from-purple-500 to-pink-600',
      bgGradient: 'from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20',
      iconBg: 'bg-purple-100 dark:bg-purple-900/50',
      iconColor: 'text-purple-600 dark:text-purple-400',
      trend: 'Free Plan',
      trendUp: null,
      description: 'Trial period active',
      loading: false,
    },
  ];

  const quickActions = [
    {
      title: 'Add Animal',
      description: 'Register new livestock',
      href: '/animals/new',
      icon: CowIcon,
      gradient: 'from-emerald-500 to-teal-600',
      bgHover: 'hover:bg-emerald-50 dark:hover:bg-emerald-900/20',
    },
    {
      title: 'Log Milk',
      description: 'Record milk production',
      href: '/milk/new',
      icon: MilkIcon,
      gradient: 'from-blue-500 to-cyan-600',
      bgHover: 'hover:bg-blue-50 dark:hover:bg-blue-900/20',
    },
    {
      title: 'Health Check',
      description: 'Add health records',
      href: '/health',
      icon: Heart,
      gradient: 'from-red-500 to-rose-600',
      bgHover: 'hover:bg-red-50 dark:hover:bg-red-900/20',
    },
    {
      title: 'Farm Settings',
      description: 'Configure your farm',
      href: '/settings',
      icon: Settings,
      gradient: 'from-gray-500 to-slate-600',
      bgHover: 'hover:bg-gray-50 dark:hover:bg-gray-800/50',
    },
  ];

  return (
    <div className='space-y-8 pb-8'>
      {/* Welcome Section */}
      <div className='relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-500 via-teal-500 to-cyan-600 p-6 text-white shadow-xl md:p-8'>
        <div className='absolute right-0 top-0 -mr-10 -mt-10 h-64 w-64 rounded-full bg-white/10 blur-3xl'></div>
        <div className='absolute bottom-0 left-0 -mb-10 -ml-10 h-48 w-48 rounded-full bg-white/10 blur-2xl'></div>

        <div className='relative z-10'>
          <div className='mb-2 flex items-center gap-2 text-emerald-100'>
            <GreetingIcon className={`h-5 w-5 ${greeting.color.replace('text-', 'text-white/')}`} />
            <span className='text-sm font-medium'>{greeting.text}</span>
          </div>

          <h1 className='mb-1 text-2xl font-bold md:text-3xl'>Welcome back, {userName}! 👋</h1>
          <p className='max-w-xl text-sm text-emerald-100 md:text-base'>
            Here&apos;s what&apos;s happening at{' '}
            <span className='font-semibold text-white'>{farmName}</span> today. Keep up the great
            work managing your dairy farm!
          </p>

          <div className='mt-6 flex flex-wrap items-center gap-4'>
            <div className='flex items-center gap-2 rounded-xl bg-white/20 px-4 py-2 backdrop-blur-sm'>
              <Calendar className='h-4 w-4' />
              <span className='text-sm font-medium'>{format(new Date(), 'EEEE, MMMM d')}</span>
            </div>
            <div className='flex items-center gap-2 rounded-xl bg-white/20 px-4 py-2 backdrop-blur-sm'>
              <Activity className='h-4 w-4' />
              <span className='text-sm font-medium'>All systems operational</span>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className='grid gap-4 sm:grid-cols-2 lg:grid-cols-4'>
        {statCards.map((stat, index) => (
          <div
            key={stat.title}
            className={`group relative overflow-hidden rounded-2xl bg-gradient-to-br ${stat.bgGradient} border border-gray-200/50 p-5 transition-all duration-300 hover:-translate-y-1 hover:scale-[1.02] hover:shadow-lg dark:border-gray-700/50`}
            style={{ animationDelay: `${index * 100}ms` }}
          >
            <div className='mb-4 flex items-start justify-between'>
              <div
                className={`rounded-xl p-3 ${stat.iconBg} transition-transform duration-300 group-hover:scale-110`}
              >
                <stat.icon className={`h-5 w-5 ${stat.iconColor}`} />
              </div>
              {stat.trendUp !== null && (
                <div
                  className={`flex items-center gap-1 rounded-full px-2 py-1 text-xs font-medium ${
                    stat.trendUp
                      ? 'bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-400'
                      : 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400'
                  }`}
                >
                  {stat.trendUp && <TrendingUp className='h-3 w-3' />}
                  {stat.trend}
                </div>
              )}
              {stat.trendUp === null && (
                <div className='flex items-center gap-1 rounded-full bg-purple-100 px-2 py-1 text-xs font-medium text-purple-700 dark:bg-purple-900/50 dark:text-purple-400'>
                  <Sparkles className='h-3 w-3' />
                  {stat.trend}
                </div>
              )}
            </div>

            <div className='space-y-1'>
              <p className='text-sm font-medium text-gray-600 dark:text-gray-400'>{stat.title}</p>
              <div className='flex items-baseline gap-1'>
                {stat.loading ? (
                  <div className='h-8 w-20 animate-pulse rounded bg-gray-200 dark:bg-gray-700'></div>
                ) : (
                  <>
                    <span className='text-3xl font-bold text-gray-900 dark:text-white'>
                      {stat.value}
                    </span>
                    <span className='text-lg font-medium text-gray-500 dark:text-gray-400'>
                      {stat.suffix}
                    </span>
                  </>
                )}
              </div>
              <p className='text-xs text-gray-500 dark:text-gray-500'>{stat.description}</p>
            </div>

            {/* Decorative gradient line at bottom */}
            <div
              className={`absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r ${stat.gradient} opacity-0 transition-opacity duration-300 group-hover:opacity-100`}
            ></div>
          </div>
        ))}
      </div>

      {/* Charts Section */}
      <div className='grid gap-6 lg:grid-cols-2'>
        <div className='rounded-2xl border border-gray-200/50 bg-white p-6 shadow-sm transition-shadow hover:shadow-md dark:border-gray-700/50 dark:bg-slate-900'>
          <div className='mb-4 flex items-center justify-between'>
            <div>
              <h3 className='font-semibold text-gray-900 dark:text-white'>Milk Production</h3>
              <p className='text-sm text-gray-500 dark:text-gray-400'>Last 7 days trend</p>
            </div>
            <Link
              href='/milk'
              className='flex items-center gap-1 text-sm text-emerald-600 hover:underline dark:text-emerald-400'
            >
              View all <ChevronRight className='h-4 w-4' />
            </Link>
          </div>
          <MilkChart />
        </div>

        <div className='rounded-2xl border border-gray-200/50 bg-white p-6 shadow-sm transition-shadow hover:shadow-md dark:border-gray-700/50 dark:bg-slate-900'>
          <div className='mb-4 flex items-center justify-between'>
            <div>
              <h3 className='font-semibold text-gray-900 dark:text-white'>Animals by Species</h3>
              <p className='text-sm text-gray-500 dark:text-gray-400'>Distribution overview</p>
            </div>
            <Link
              href='/animals'
              className='flex items-center gap-1 text-sm text-emerald-600 hover:underline dark:text-emerald-400'
            >
              View all <ChevronRight className='h-4 w-4' />
            </Link>
          </div>
          <AnimalsBySpeciesChart />
        </div>
      </div>

      {/* Quick Actions */}
      <div className='rounded-2xl border border-gray-200/50 bg-white p-6 shadow-sm dark:border-gray-700/50 dark:bg-slate-900'>
        <div className='mb-6 flex items-center justify-between'>
          <div>
            <h3 className='flex items-center gap-2 font-semibold text-gray-900 dark:text-white'>
              <Sparkles className='h-5 w-5 text-amber-500' />
              Quick Actions
            </h3>
            <p className='text-sm text-gray-500 dark:text-gray-400'>
              Common tasks at your fingertips
            </p>
          </div>
        </div>

        <div className='grid gap-4 sm:grid-cols-2 lg:grid-cols-4'>
          {quickActions.map((action, index) => (
            <Link
              key={action.title}
              href={action.href}
              className={`group relative overflow-hidden rounded-xl border border-gray-200/50 p-5 transition-all duration-300 dark:border-gray-700/50 ${action.bgHover} hover:-translate-y-1 hover:shadow-md`}
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <div
                className={`inline-flex rounded-xl bg-gradient-to-br p-3 ${action.gradient} mb-4 text-white shadow-lg transition-transform duration-300 group-hover:scale-110`}
              >
                <action.icon className='h-5 w-5' />
              </div>

              <h4 className='mb-1 font-semibold text-gray-900 transition-colors group-hover:text-emerald-600 dark:text-white dark:group-hover:text-emerald-400'>
                {action.title}
              </h4>
              <p className='text-sm text-gray-500 dark:text-gray-400'>{action.description}</p>

              <div className='absolute right-4 top-4 opacity-0 transition-opacity group-hover:opacity-100'>
                <ArrowUpRight className='h-5 w-5 text-gray-400' />
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Footer tip */}
      <div className='py-4 text-center'>
        <p className='text-sm text-gray-500 dark:text-gray-500'>
          💡 <span className='font-medium'>Tip:</span> Log your milk production daily for accurate
          analytics
        </p>
      </div>
    </div>
  );
}
