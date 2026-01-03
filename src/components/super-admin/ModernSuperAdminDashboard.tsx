'use client';

import React, { useMemo } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
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
    Shield,
    Activity,
    Zap,
    BarChart3,
    Search,
} from 'lucide-react';
import { GlassCard } from '@/components/ui/glass-card';
import { AnimatedCounter } from '@/components/ui/animated-counter';
import { Button } from '@/components/ui/button';

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

interface Stats {
    totalApplications: number;
    pendingApplications: number;
    approvedApplications: number;
    totalTenants: number;
    totalUsers: number;
    totalAnimals: number;
    totalAssets: number;
}

interface Application {
    id: string;
    farm_name: string;
    owner_name: string;
    requested_plan: string;
    status: string;
    created_at: string;
}

const statusConfig: Record<string, { label: string; color: string; bgColor: string; icon: any }> = {
    pending: { label: 'Pending', color: 'text-gray-700', bgColor: 'bg-gray-100', icon: Clock },
    payment_uploaded: { label: 'Payment Uploaded', color: 'text-amber-700', bgColor: 'bg-amber-100', icon: Upload },
    approved: { label: 'Approved', color: 'text-emerald-700', bgColor: 'bg-emerald-100', icon: CheckCircle2 },
    rejected: { label: 'Rejected', color: 'text-red-700', bgColor: 'bg-red-100', icon: XCircle },
};

export function ModernSuperAdminDashboard({
    stats,
    recentApplications,
}: {
    stats: Stats;
    recentApplications: Application[];
}) {
    const quickStats = useMemo(() => [
        {
            label: 'Total Farms',
            value: stats.totalTenants,
            icon: Building2,
            color: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
            href: '/super-admin/farms',
        },
        {
            label: 'Total Users',
            value: stats.totalUsers,
            icon: Users,
            color: 'bg-blue-500/10 text-blue-600 dark:text-blue-400',
            href: '/super-admin/users',
        },
        {
            label: 'Pending Apps',
            value: stats.pendingApplications,
            icon: FileText,
            color: 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
            href: '/super-admin/applications?status=pending',
        },
        {
            label: 'Platform Assets',
            value: stats.totalAssets,
            icon: CreditCard,
            color: 'bg-rose-500/10 text-rose-600 dark:text-rose-400',
            href: '/super-admin/farms',
        },
    ], [stats]);

    return (
        <motion.div
            initial="hidden"
            animate="show"
            variants={containerVariants}
            className="mx-auto max-w-7xl space-y-8"
        >
            {/* Header */}
            <motion.div variants={itemVariants} className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                    <h1 className="mb-1 bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-3xl font-bold text-transparent md:text-4xl dark:from-emerald-400 dark:to-teal-400">
                        Super Admin Console
                    </h1>
                    <p className="text-gray-600 dark:text-gray-400">
                        Global platform overview and mission control
                    </p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" className="border-emerald-500/20 bg-emerald-500/5 text-emerald-600 hover:bg-emerald-500/10">
                        <BarChart3 className="mr-2 h-4 w-4" /> Reports
                    </Button>
                    <Button className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-lg hover:from-emerald-700 hover:to-teal-700">
                        <Shield className="mr-2 h-4 w-4" /> Security Audit
                    </Button>
                </div>
            </motion.div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
                {quickStats.map((stat, idx) => (
                    <motion.div key={idx} variants={itemVariants}>
                        <Link href={stat.href}>
                            <GlassCard hoverEffect intensity="low" className="group relative overflow-hidden p-6">
                                <div className="mb-4 flex items-start justify-between">
                                    <div className={`rounded-xl p-2.5 transition-transform duration-300 group-hover:scale-110 ${stat.color}`}>
                                        <stat.icon className="h-5 w-5" />
                                    </div>
                                    <div className="flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400">
                                        Live
                                    </div>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{stat.label}</p>
                                    <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
                                        <AnimatedCounter value={stat.value} />
                                    </h3>
                                </div>
                                <div className="absolute -bottom-4 -right-4 h-24 w-24 rounded-full bg-gradient-to-br from-emerald-500/10 to-teal-500/10 blur-2xl transition-transform duration-500 group-hover:scale-150" />
                            </GlassCard>
                        </Link>
                    </motion.div>
                ))}
            </div>

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                {/* Recent Applications */}
                <motion.div variants={itemVariants} className="lg:col-span-2">
                    <GlassCard className="h-full overflow-hidden">
                        <div className="flex items-center justify-between border-b border-white/10 bg-white/5 p-6 dark:bg-black/20">
                            <div>
                                <h2 className="text-xl font-bold text-gray-900 dark:text-white">Recent Applications</h2>
                                <p className="text-sm text-gray-500 dark:text-gray-400">New farm registrations requiring attention</p>
                            </div>
                            <Link href="/super-admin/applications">
                                <Button variant="ghost" size="sm" className="text-emerald-600 hover:text-emerald-700 dark:text-emerald-400">
                                    View All <ArrowRight className="ml-2 h-4 w-4" />
                                </Button>
                            </Link>
                        </div>
                        <div className="p-6">
                            <AnimatePresence mode="popLayout">
                                {recentApplications.length === 0 ? (
                                    <motion.div
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        className="flex flex-col items-center justify-center py-12 text-center"
                                    >
                                        <div className="mb-4 rounded-full bg-gray-100 p-4 dark:bg-gray-800">
                                            <FileText className="h-8 w-8 text-gray-400" />
                                        </div>
                                        <h3 className="text-lg font-medium text-gray-900 dark:text-white">All caught up!</h3>
                                        <p className="text-gray-500">No pending applications at the moment.</p>
                                    </motion.div>
                                ) : (
                                    <div className="space-y-3">
                                        {recentApplications.map((app, idx) => {
                                            const config = statusConfig[app.status] || statusConfig.pending;
                                            const StatusIcon = config.icon;
                                            return (
                                                <motion.div
                                                    key={app.id}
                                                    initial={{ opacity: 0, x: -10 }}
                                                    animate={{ opacity: 1, x: 0 }}
                                                    transition={{ delay: idx * 0.05 }}
                                                >
                                                    <Link href={`/super-admin/applications?id=${app.id}`}>
                                                        <div className="group flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 p-4 transition-all hover:bg-white/10 hover:shadow-md dark:hover:bg-slate-800/40">
                                                            <div className="flex items-center gap-4">
                                                                <div className={`flex h-12 w-12 items-center justify-center rounded-xl transition-transform group-hover:scale-105 ${config.bgColor} ${config.color}`}>
                                                                    <StatusIcon className="h-6 w-6" />
                                                                </div>
                                                                <div>
                                                                    <p className="font-bold text-gray-900 dark:text-white">{app.farm_name}</p>
                                                                    <p className="text-xs font-medium text-gray-500 dark:text-gray-400">
                                                                        {app.owner_name} • <span className="uppercase text-emerald-600/80 dark:text-emerald-400/80">{app.requested_plan}</span>
                                                                    </p>
                                                                </div>
                                                            </div>
                                                            <div className="flex flex-col items-end gap-2">
                                                                <span className={`rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-wider ${config.bgColor} ${config.color}`}>
                                                                    {config.label}
                                                                </span>
                                                                <p className="flex items-center gap-1 text-[10px] text-gray-400">
                                                                    <Clock className="h-3 w-3" />
                                                                    {new Date(app.created_at).toLocaleDateString()}
                                                                </p>
                                                            </div>
                                                        </div>
                                                    </Link>
                                                </motion.div>
                                            );
                                        })}
                                    </div>
                                )}
                            </AnimatePresence>
                        </div>
                    </GlassCard>
                </motion.div>

                {/* Sidebar Widgets */}
                <div className="space-y-6">
                    {/* Quick Actions */}
                    <motion.div variants={itemVariants}>
                        <GlassCard className="p-6">
                            <h2 className="mb-6 text-xl font-bold text-gray-900 dark:text-white">Quick Actions</h2>
                            <div className="grid grid-cols-2 gap-4">
                                {[
                                    { label: 'Review Apps', icon: Shield, href: '/super-admin/applications', color: 'from-amber-500 to-orange-600', bg: 'bg-amber-500/10' },
                                    { label: 'Register Farm', icon: Building2, href: '/super-admin/farms/new', color: 'from-emerald-500 to-teal-600', bg: 'bg-emerald-500/10' },
                                    { label: 'User Control', icon: Users, href: '/super-admin/users', color: 'from-blue-500 to-indigo-600', bg: 'bg-blue-500/10' },
                                    { label: 'System Audit', icon: Zap, href: '/super-admin/migration', color: 'from-purple-500 to-pink-600', bg: 'bg-purple-500/10' },
                                ].map((action, idx) => (
                                    <Link key={idx} href={action.href}>
                                        <div className="group flex flex-col items-center justify-center rounded-2xl bg-white/5 p-4 text-center transition-all hover:bg-white/10 dark:bg-slate-800/20">
                                            <div className={`mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br opacity-80 shadow-lg group-hover:opacity-100 ${action.color}`}>
                                                <action.icon className="h-6 w-6 text-white" />
                                            </div>
                                            <span className="text-xs font-bold text-gray-700 dark:text-gray-300">{action.label}</span>
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        </GlassCard>
                    </motion.div>

                    {/* System Health */}
                    <motion.div variants={itemVariants}>
                        <GlassCard gradient intensity="medium" className="relative overflow-hidden p-6">
                            <div className="relative z-10">
                                <h2 className="mb-6 flex items-center gap-2 text-xl font-bold text-gray-900 dark:text-white">
                                    <Activity className="h-5 w-5 text-emerald-500" />
                                    System Health
                                </h2>
                                <div className="space-y-4">
                                    {[
                                        { label: 'Database Sync', value: '100%', status: 'success' },
                                        { label: 'Feature Flags', value: 'Live', status: 'success' },
                                        { label: 'Storage Usage', value: '12.4 GB', status: 'warning' },
                                        { label: 'Migration API', value: 'Online', status: 'success' },
                                    ].map((metric, idx) => (
                                        <div key={idx} className="flex items-center justify-between">
                                            <span className="text-sm font-medium text-gray-500 dark:text-gray-400">{metric.label}</span>
                                            <div className="flex items-center gap-2">
                                                <span className="text-sm font-bold dark:text-white">{metric.value}</span>
                                                <div className={`h-2 w-2 rounded-full ${metric.status === 'success' ? 'bg-emerald-500' : 'bg-amber-500'} animate-pulse`} />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                                <Button variant="outline" className="mt-6 w-full border-white/20 bg-white/5 text-xs font-bold uppercase tracking-wider hover:bg-white/10 dark:text-white">
                                    Run Full Diagnostics
                                </Button>
                            </div>
                            <div className="absolute -left-4 -top-4 h-32 w-32 rounded-full bg-emerald-500/5 blur-3xl" />
                        </GlassCard>
                    </motion.div>
                </div>
            </div>
        </motion.div>
    );
}
