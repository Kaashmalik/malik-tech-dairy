'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import ModernWeatherWidget from '@/components/weather/ModernWeatherWidget';
import { GlassCard } from '@/components/ui/glass-card';
import { AnimatedCounter } from '@/components/ui/animated-counter';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import {
  Search,
  Filter,
  TrendingUp,
  TrendingDown,
  Activity,
  Calendar,
  Droplets,
  Heart,
} from 'lucide-react';

export default function DashboardPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 },
  };

  const modules = [
    {
      id: 'animals',
      title: 'Animals',
      description: 'Livestock management',
      icon: '🐄',
      count: 24,
      trend: '+12%',
      color: 'bg-emerald-500/10 text-emerald-600',
      href: '/animals',
      category: 'livestock',
    },
    {
      id: 'health',
      title: 'Health Records',
      description: 'Medical history',
      icon: '❤️',
      count: 15,
      trend: '+8%',
      color: 'bg-rose-500/10 text-rose-600',
      href: '/health',
      category: 'medical',
    },
    {
      id: 'milk',
      title: 'Milk Production',
      description: 'Daily yield',
      icon: '📦',
      count: 125, // Changed to number for counter
      suffix: 'L',
      trend: '+5%',
      color: 'bg-cyan-500/10 text-cyan-600',
      href: '/milk',
      category: 'production',
    },
    {
      id: 'assets',
      title: 'Assets',
      description: 'Equipment & tools',
      icon: '🔧',
      count: 8,
      trend: '0%',
      color: 'bg-amber-500/10 text-amber-600',
      href: '/assets',
      category: 'equipment',
    },
    {
      id: 'medicine',
      title: 'Medicine',
      description: 'Inventory tracking',
      icon: '💊',
      count: 12,
      trend: '-3%',
      color: 'bg-indigo-500/10 text-indigo-600',
      href: '/medicine',
      category: 'inventory',
    },
    {
      id: 'diseases',
      title: 'Diseases',
      description: 'Disease database',
      icon: '🦠',
      count: 5,
      trend: '0%',
      color: 'bg-violet-500/10 text-violet-600',
      href: '/diseases',
      category: 'medical',
    },
    {
      id: 'sales',
      title: 'Sales',
      description: 'Revenue tracking',
      icon: '💰',
      count: 45000,
      prefix: '₨',
      suffix: 'K', // Keep text representation logic or use full number
      displaySuffix: 'K', // Custom property for display
      trend: '+15%',
      color: 'bg-green-500/10 text-green-600',
      href: '/sales',
      category: 'financial',
    },
    {
      id: 'expenses',
      title: 'Expenses',
      description: 'Cost management',
      icon: '🛒',
      count: 12000,
      prefix: '₨',
      displaySuffix: 'K',
      trend: '+7%',
      color: 'bg-orange-500/10 text-orange-600',
      href: '/expenses',
      category: 'financial',
    },
  ];

  const filteredModules = modules.filter(module => {
    const matchesSearch =
      module.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      module.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = filterCategory === 'all' || module.category === filterCategory;
    return matchesSearch && matchesCategory;
  });

  const quickStats = [
    {
      label: 'Total Revenue',
      value: 125430,
      prefix: '₨',
      change: '+12%',
      positive: true,
      icon: TrendingUp,
    },
    { label: 'Active Animals', value: 24, change: '+2', positive: true, icon: Activity },
    { label: 'Milk Today', value: 125, suffix: 'L', change: '+5%', positive: true, icon: Droplets }, // Fixed icon usage below
    { label: 'Health Score', value: 94, suffix: '%', change: 'Good', positive: true, icon: Heart },
  ];

  const recentActivity = [
    {
      icon: '🐄',
      action: 'New animal registered',
      time: '2 hours ago',
      color: 'text-blue-600 bg-blue-100 dark:bg-blue-900/30',
    },
    {
      icon: '📦',
      action: 'Milk production logged',
      time: '3 hours ago',
      color: 'text-green-600 bg-green-100 dark:bg-green-900/30',
    },
    {
      icon: '💊',
      action: 'Medicine inventory updated',
      time: '5 hours ago',
      color: 'text-indigo-600 bg-indigo-100 dark:bg-indigo-900/30',
    },
    {
      icon: '❤️',
      action: 'Health check completed',
      time: '6 hours ago',
      color: 'text-red-600 bg-red-100 dark:bg-red-900/30',
    },
    {
      icon: '💰',
      action: 'Sale recorded',
      time: '8 hours ago',
      color: 'text-emerald-600 bg-emerald-100 dark:bg-emerald-900/30',
    },
  ];

  return (
    <motion.div
      initial='hidden'
      animate='show'
      variants={container}
      className='mx-auto max-w-7xl space-y-8'
    >
      {/* Header */}
      <motion.div variants={item} className='mb-8'>
        <h1 className='mb-2 bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-3xl font-bold text-transparent md:text-4xl dark:from-emerald-400 dark:to-teal-400'>
          Farm Dashboard
        </h1>
        <p className='text-gray-600 dark:text-gray-400'>
          Welcome to your premium farm management system!
        </p>
      </motion.div>

      {/* Quick Stats */}
      <motion.div variants={item} className='grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4'>
        {quickStats.map((stat, index) => (
          <GlassCard
            key={index}
            gradient
            intensity='low'
            className='group relative overflow-hidden p-6'
          >
            <div className='mb-4 flex items-start justify-between'>
              <div className='rounded-xl bg-emerald-100/50 p-2 text-emerald-600 transition-transform duration-300 group-hover:scale-110 dark:bg-emerald-900/20 dark:text-emerald-400'>
                <stat.icon size={20} />
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
        ))}
      </motion.div>

      {/* Search and Filter */}
      <motion.div variants={item}>
        <GlassCard className='flex flex-col gap-2 p-2 md:flex-row' intensity='low'>
          <div className='relative flex-1'>
            <Search className='absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400' />
            <input
              type='text'
              placeholder='Search modules...'
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className='w-full border-none bg-transparent py-2 pl-9 pr-4 text-gray-900 placeholder:text-gray-400 focus:ring-0 dark:text-white'
            />
          </div>
          <div className='h-px w-full bg-gray-200 md:h-8 md:w-px dark:bg-gray-700' />
          <div className='relative'>
            <Filter className='absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400' />
            <select
              value={filterCategory}
              onChange={e => setFilterCategory(e.target.value)}
              className='w-full cursor-pointer appearance-none border-none bg-transparent py-2 pl-9 pr-8 text-gray-900 focus:ring-0 md:w-48 dark:text-white'
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

      {/* Module Grid */}
      <motion.div
        variants={item}
        className='grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'
      >
        {filteredModules.map(module => (
          <Link key={module.id} href={module.href}>
            <GlassCard hoverEffect className='group relative h-full p-6'>
              <div className='mb-4 flex items-start justify-between'>
                <div className={`rounded-2xl p-3 text-3xl ${module.color}`}>{module.icon}</div>
                <div
                  className={`rounded-full px-2 py-1 text-xs font-medium ${
                    module.trend.startsWith('+')
                      ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                      : module.trend.startsWith('-')
                        ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                        : 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400'
                  }`}
                >
                  {module.trend}
                </div>
              </div>

              <h3 className='mb-1 text-lg font-bold text-gray-900 transition-colors group-hover:text-emerald-600 dark:text-white dark:group-hover:text-emerald-400'>
                {module.title}
              </h3>
              <p className='mb-4 text-sm text-gray-500 dark:text-gray-400'>{module.description}</p>

              <div className='mt-auto flex items-end justify-between'>
                <div className='text-2xl font-bold text-gray-900 dark:text-white'>
                  {typeof module.count === 'number' ? (
                    <AnimatedCounter
                      value={module.count}
                      prefix={module.prefix}
                      suffix={module.displaySuffix || module.suffix}
                    />
                  ) : (
                    module.count
                  )}
                </div>
                <div className='flex h-8 w-8 items-center justify-center rounded-full bg-gray-50 transition-colors group-hover:bg-emerald-500 group-hover:text-white dark:bg-gray-800'>
                  →
                </div>
              </div>
            </GlassCard>
          </Link>
        ))}
      </motion.div>

      <div className='grid grid-cols-1 gap-6 lg:grid-cols-3'>
        {/* Weather Widget */}
        <motion.div variants={item} className='lg:col-span-1'>
          <GlassCard gradient intensity='medium' className='h-full'>
            <ModernWeatherWidget />
          </GlassCard>
        </motion.div>

        {/* Recent Activity */}
        <motion.div variants={item} className='lg:col-span-2'>
          <GlassCard className='h-full p-6'>
            <h2 className='mb-6 flex items-center gap-2 text-xl font-bold text-gray-900 dark:text-white'>
              <Calendar className='h-5 w-5 text-emerald-500' />
              Recent Activity
            </h2>
            <div className='space-y-4'>
              {recentActivity.map((activity, index) => (
                <div key={index} className='group flex items-center gap-4'>
                  <div
                    className={`flex h-10 w-10 items-center justify-center rounded-full text-lg ${activity.color} transition-transform group-hover:scale-110`}
                  >
                    {activity.icon}
                  </div>
                  <div className='min-w-0 flex-1'>
                    <p className='truncate text-sm font-medium text-gray-900 transition-colors group-hover:text-emerald-600 dark:text-white'>
                      {activity.action}
                    </p>
                    <p className='text-xs text-gray-500 dark:text-gray-400'>{activity.time}</p>
                  </div>
                  <div className='h-2 w-2 rounded-full bg-emerald-500/20 transition-colors group-hover:bg-emerald-500' />
                </div>
              ))}
            </div>
            <Button
              variant='ghost'
              className='mt-6 w-full text-emerald-600 hover:bg-emerald-50 hover:text-emerald-700 dark:text-emerald-400 dark:hover:bg-emerald-900/20'
            >
              View All Activity
            </Button>
          </GlassCard>
        </motion.div>
      </div>
    </motion.div>
  );
}
