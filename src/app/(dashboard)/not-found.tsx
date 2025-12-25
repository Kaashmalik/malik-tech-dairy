'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { Home, ArrowLeft, Search, Beef, Droplets, Heart } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function DashboardNotFound() {
  const quickLinks = [
    { href: '/animals', label: 'Animals', icon: Beef, color: 'text-emerald-600' },
    { href: '/milk', label: 'Milk Logs', icon: Droplets, color: 'text-blue-600' },
    { href: '/health', label: 'Health', icon: Heart, color: 'text-red-600' },
  ];

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-4 text-center">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="max-w-md"
      >
        {/* 404 Illustration */}
        <motion.div
          initial={{ scale: 0.8 }}
          animate={{ scale: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="mb-6 flex justify-center"
        >
          <div className="relative">
            <div className="rounded-2xl bg-gradient-to-br from-emerald-100 to-teal-100 p-8 dark:from-emerald-900/30 dark:to-teal-900/30">
              <span className="text-6xl">🔍</span>
            </div>
            <div className="absolute -bottom-2 -right-2 rounded-full bg-white p-2 shadow-lg dark:bg-slate-800">
              <span className="text-2xl">🐄</span>
            </div>
          </div>
        </motion.div>

        {/* Error Message */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          <h1 className="mb-3 text-2xl font-bold text-gray-900 dark:text-white">
            Page Not Found
          </h1>
          <p className="mb-6 text-gray-600 dark:text-slate-400">
            This page doesn&apos;t exist in your dashboard. It might have been moved or removed.
          </p>
        </motion.div>

        {/* Action Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="flex flex-col gap-3 sm:flex-row sm:justify-center"
        >
          <Button asChild size="lg" className="gap-2">
            <Link href="/dashboard">
              <Home className="h-4 w-4" />
              Back to Dashboard
            </Link>
          </Button>
          <Button asChild variant="outline" size="lg" className="gap-2" onClick={() => window.history.back()}>
            <span className="cursor-pointer">
              <ArrowLeft className="h-4 w-4" />
              Go Back
            </span>
          </Button>
        </motion.div>

        {/* Quick Links */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7 }}
          className="mt-8"
        >
          <p className="mb-4 text-sm text-gray-500 dark:text-slate-500">
            Or navigate to:
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            {quickLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition-all hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:border-emerald-700 dark:hover:bg-emerald-900/20 dark:hover:text-emerald-400"
              >
                <link.icon className={`h-4 w-4 ${link.color}`} />
                {link.label}
              </Link>
            ))}
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
}
