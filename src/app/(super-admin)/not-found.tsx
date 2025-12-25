'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { Shield, ArrowLeft, Home, Users, Building2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function SuperAdminNotFound() {
  const adminLinks = [
    { href: '/super-admin', label: 'Admin Dashboard', icon: Shield },
    { href: '/super-admin/applications', label: 'Applications', icon: Users },
    { href: '/super-admin/farms', label: 'Farms', icon: Building2 },
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
          <div className="rounded-2xl bg-gradient-to-br from-purple-100 to-indigo-100 p-8 dark:from-purple-900/30 dark:to-indigo-900/30">
            <Shield className="h-16 w-16 text-purple-600 dark:text-purple-400" />
          </div>
        </motion.div>

        {/* Error Message */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          <h1 className="mb-3 text-2xl font-bold text-gray-900 dark:text-white">
            Admin Page Not Found
          </h1>
          <p className="mb-6 text-gray-600 dark:text-slate-400">
            This admin page doesn&apos;t exist. You may not have permission to access it, 
            or it may have been moved.
          </p>
        </motion.div>

        {/* Action Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="flex flex-col gap-3 sm:flex-row sm:justify-center"
        >
          <Button asChild size="lg" className="gap-2 bg-purple-600 hover:bg-purple-700">
            <Link href="/super-admin">
              <Shield className="h-4 w-4" />
              Admin Dashboard
            </Link>
          </Button>
          <Button asChild variant="outline" size="lg" className="gap-2">
            <Link href="/dashboard">
              <Home className="h-4 w-4" />
              User Dashboard
            </Link>
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
            Admin sections:
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            {adminLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="flex items-center gap-2 rounded-lg border border-purple-200 bg-white px-4 py-2 text-sm font-medium text-purple-700 transition-all hover:border-purple-400 hover:bg-purple-50 dark:border-purple-800 dark:bg-slate-800 dark:text-purple-400 dark:hover:border-purple-600 dark:hover:bg-purple-900/20"
              >
                <link.icon className="h-4 w-4" />
                {link.label}
              </Link>
            ))}
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
}
