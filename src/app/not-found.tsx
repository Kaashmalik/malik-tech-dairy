'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { Home, ArrowLeft, Search, HelpCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-emerald-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
      <div className="flex min-h-screen flex-col items-center justify-center px-4 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="max-w-md"
        >
          {/* 404 Illustration */}
          <div className="relative mb-8">
            <motion.div
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="text-[150px] font-bold leading-none text-emerald-500/20 dark:text-emerald-400/10"
            >
              404
            </motion.div>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="absolute inset-0 flex items-center justify-center"
            >
              <div className="rounded-full bg-emerald-100 p-6 dark:bg-emerald-900/30">
                <span className="text-6xl">🐄</span>
              </div>
            </motion.div>
          </div>

          {/* Error Message */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            <h1 className="mb-3 text-2xl font-bold text-gray-900 dark:text-white">
              Oops! Page Not Found
            </h1>
            <p className="mb-8 text-gray-600 dark:text-slate-400">
              The page you&apos;re looking for seems to have wandered off the farm. 
              Let&apos;s get you back on track!
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
                Go to Dashboard
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="gap-2">
              <Link href="/">
                <ArrowLeft className="h-4 w-4" />
                Back to Home
              </Link>
            </Button>
          </motion.div>

          {/* Help Links */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.7 }}
            className="mt-8 flex items-center justify-center gap-6 text-sm text-gray-500 dark:text-slate-500"
          >
            <Link
              href="/help"
              className="flex items-center gap-1 transition-colors hover:text-emerald-600 dark:hover:text-emerald-400"
            >
              <HelpCircle className="h-4 w-4" />
              Help Center
            </Link>
            <span className="text-gray-300 dark:text-slate-700">|</span>
            <Link
              href="/animals"
              className="flex items-center gap-1 transition-colors hover:text-emerald-600 dark:hover:text-emerald-400"
            >
              <Search className="h-4 w-4" />
              Search Animals
            </Link>
          </motion.div>
        </motion.div>

        {/* Footer */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.9 }}
          className="absolute bottom-8 text-xs text-gray-400 dark:text-slate-600"
        >
          MTK Dairy • Smart Farm Management
        </motion.p>
      </div>
    </div>
  );
}
