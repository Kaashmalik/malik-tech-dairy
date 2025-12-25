'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import ModernWeatherWidget from '@/components/weather/ModernWeatherWidget';
import { GlassCard } from '@/components/ui/glass-card';
import { AnimatedCounter } from '@/components/ui/animated-counter';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import { Search, Filter, TrendingUp, TrendingDown, Activity, Calendar, Droplets, Heart } from 'lucide-react';

export default function DashboardPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
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
      category: 'livestock'
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
      category: 'medical'
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
      category: 'production'
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
      category: 'equipment'
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
      category: 'inventory'
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
      category: 'medical'
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
      category: 'financial'
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
      category: 'financial'
    }
  ];

  const filteredModules = modules.filter(module => {
    const matchesSearch = module.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      module.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = filterCategory === 'all' || module.category === filterCategory;
    return matchesSearch && matchesCategory;
  });

  const quickStats = [
    { label: 'Total Revenue', value: 125430, prefix: '₨', change: '+12%', positive: true, icon: TrendingUp },
    { label: 'Active Animals', value: 24, change: '+2', positive: true, icon: Activity },
    { label: 'Milk Today', value: 125, suffix: 'L', change: '+5%', positive: true, icon: Droplets }, // Fixed icon usage below
    { label: 'Health Score', value: 94, suffix: '%', change: 'Good', positive: true, icon: Heart }
  ];

  const recentActivity = [
    { icon: '🐄', action: 'New animal registered', time: '2 hours ago', color: 'text-blue-600 bg-blue-100 dark:bg-blue-900/30' },
    { icon: '📦', action: 'Milk production logged', time: '3 hours ago', color: 'text-green-600 bg-green-100 dark:bg-green-900/30' },
    { icon: '💊', action: 'Medicine inventory updated', time: '5 hours ago', color: 'text-indigo-600 bg-indigo-100 dark:bg-indigo-900/30' },
    { icon: '❤️', action: 'Health check completed', time: '6 hours ago', color: 'text-red-600 bg-red-100 dark:bg-red-900/30' },
    { icon: '💰', action: 'Sale recorded', time: '8 hours ago', color: 'text-emerald-600 bg-emerald-100 dark:bg-emerald-900/30' }
  ];

  return (
    <motion.div
      initial="hidden"
      animate="show"
      variants={container}
      className="max-w-7xl mx-auto space-y-8"
    >
      {/* Header */}
      <motion.div variants={item} className="mb-8">
        <h1 className="text-3xl md:text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-emerald-600 to-teal-600 dark:from-emerald-400 dark:to-teal-400 mb-2">
          Farm Dashboard
        </h1>
        <p className="text-gray-600 dark:text-gray-400">Welcome to your premium farm management system!</p>
      </motion.div>

      {/* Quick Stats */}
      <motion.div variants={item} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {quickStats.map((stat, index) => (
          <GlassCard key={index} gradient intensity="low" className="p-6 relative overflow-hidden group">
            <div className="flex justify-between items-start mb-4">
              <div className="p-2 rounded-xl bg-emerald-100/50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 group-hover:scale-110 transition-transform duration-300">
                <stat.icon size={20} />
              </div>
              <span className={`text-xs font-medium px-2 py-1 rounded-full ${stat.positive
                ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                }`}>
                {stat.change}
              </span>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">{stat.label}</p>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
                <AnimatedCounter value={stat.value} prefix={stat.prefix} suffix={stat.suffix} />
              </h3>
            </div>
            <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-gradient-to-br from-emerald-500/10 to-teal-500/10 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-500" />
          </GlassCard>
        ))}
      </motion.div>

      {/* Search and Filter */}
      <motion.div variants={item}>
        <GlassCard className="p-2 flex flex-col md:flex-row gap-2" intensity="low">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search modules..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-transparent border-none focus:ring-0 text-gray-900 dark:text-white placeholder:text-gray-400"
            />
          </div>
          <div className="h-px md:h-8 w-full md:w-px bg-gray-200 dark:bg-gray-700" />
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="w-full md:w-48 pl-9 pr-8 py-2 bg-transparent border-none focus:ring-0 text-gray-900 dark:text-white appearance-none cursor-pointer"
            >
              <option value="all">All Categories</option>
              <option value="livestock">Livestock</option>
              <option value="production">Production</option>
              <option value="medical">Medical</option>
              <option value="inventory">Inventory</option>
              <option value="equipment">Equipment</option>
              <option value="financial">Financial</option>
            </select>
          </div>
        </GlassCard>
      </motion.div>

      {/* Module Grid */}
      <motion.div variants={item} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {filteredModules.map((module) => (
          <Link key={module.id} href={module.href}>
            <GlassCard hoverEffect className="h-full p-6 group relative">
              <div className="flex justify-between items-start mb-4">
                <div className={`text-3xl p-3 rounded-2xl ${module.color}`}>
                  {module.icon}
                </div>
                <div className={`px-2 py-1 rounded-full text-xs font-medium ${module.trend.startsWith('+') ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
                  module.trend.startsWith('-') ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' :
                    'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400'
                  }`}>
                  {module.trend}
                </div>
              </div>

              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                {module.title}
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">{module.description}</p>

              <div className="flex items-end justify-between mt-auto">
                <div className="text-2xl font-bold text-gray-900 dark:text-white">
                  {typeof module.count === 'number' ? (
                    <AnimatedCounter
                      value={module.count}
                      prefix={module.prefix}
                      suffix={module.displaySuffix || module.suffix}
                    />
                  ) : module.count}
                </div>
                <div className="h-8 w-8 rounded-full bg-gray-50 dark:bg-gray-800 flex items-center justify-center group-hover:bg-emerald-500 group-hover:text-white transition-colors">
                  →
                </div>
              </div>
            </GlassCard>
          </Link>
        ))}
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Weather Widget */}
        <motion.div variants={item} className="lg:col-span-1">
          <GlassCard gradient intensity="medium" className='h-full'>
            <ModernWeatherWidget />
          </GlassCard>
        </motion.div>

        {/* Recent Activity */}
        <motion.div variants={item} className="lg:col-span-2">
          <GlassCard className="p-6 h-full">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
              <Calendar className="h-5 w-5 text-emerald-500" />
              Recent Activity
            </h2>
            <div className="space-y-4">
              {recentActivity.map((activity, index) => (
                <div key={index} className="flex items-center gap-4 group">
                  <div className={`h-10 w-10 rounded-full flex items-center justify-center text-lg ${activity.color} group-hover:scale-110 transition-transform`}>
                    {activity.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 dark:text-white truncate group-hover:text-emerald-600 transition-colors">{activity.action}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{activity.time}</p>
                  </div>
                  <div className="h-2 w-2 rounded-full bg-emerald-500/20 group-hover:bg-emerald-500 transition-colors" />
                </div>
              ))}
            </div>
            <Button variant="ghost" className="w-full mt-6 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 dark:text-emerald-400 dark:hover:bg-emerald-900/20">
              View All Activity
            </Button>
          </GlassCard>
        </motion.div>
      </div>
    </motion.div>
  );
}