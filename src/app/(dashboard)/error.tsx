'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import * as Sentry from '@sentry/nextjs';
import { AlertTriangle, RefreshCw, Home, MessageSquare, Bug } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface DashboardErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function DashboardError({ error, reset }: DashboardErrorProps) {
  const [eventId, setEventId] = useState<string | null>(null);

  useEffect(() => {
    // Log error to Sentry with dashboard context
    const id = Sentry.captureException(error, {
      tags: {
        errorBoundary: 'dashboard',
        section: 'farm-management',
      },
    });
    setEventId(id);

    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
    }
  }, [error]);

  const handleReportFeedback = () => {
    if (eventId) {
      Sentry.showReportDialog({ eventId });
    }
  };

  return (
    <div className="flex min-h-[60vh] items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-lg"
      >
        <Card className="border-red-200 bg-gradient-to-br from-red-50 to-orange-50 shadow-lg dark:border-red-800 dark:from-red-900/20 dark:to-orange-900/20">
          <CardHeader className="text-center">
            <motion.div
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2 }}
              className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/50"
            >
              <AlertTriangle className="h-8 w-8 text-red-600 dark:text-red-400" />
            </motion.div>
            <CardTitle className="text-xl text-gray-900 dark:text-white">
              Dashboard Error
            </CardTitle>
            <CardDescription className="text-gray-600 dark:text-slate-400">
              Something went wrong while loading this section. Your data is safe.
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-4">
            {/* Error Details (Development Only) */}
            {process.env.NODE_ENV === 'development' && (
              <div className="rounded-lg border border-red-200 bg-white/50 p-3 dark:border-red-800 dark:bg-slate-800/50">
                <div className="flex items-center gap-2 text-sm font-medium text-red-700 dark:text-red-400">
                  <Bug className="h-4 w-4" />
                  Dev Error Info
                </div>
                <p className="mt-1 break-all font-mono text-xs text-red-600 dark:text-red-400">
                  {error.message}
                </p>
              </div>
            )}

            {/* Error ID */}
            {error.digest && (
              <p className="text-center text-xs text-gray-500 dark:text-slate-500">
                Error ID: <code className="rounded bg-gray-100 px-1.5 py-0.5 font-mono dark:bg-slate-700">{error.digest}</code>
              </p>
            )}

            {/* Action Buttons */}
            <div className="flex flex-col gap-2 pt-2 sm:flex-row">
              <Button onClick={reset} className="flex-1 gap-2">
                <RefreshCw className="h-4 w-4" />
                Try Again
              </Button>
              <Button asChild variant="outline" className="flex-1 gap-2">
                <Link href="/dashboard">
                  <Home className="h-4 w-4" />
                  Go to Dashboard
                </Link>
              </Button>
            </div>

            {/* Report Button */}
            {eventId && (
              <div className="text-center">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleReportFeedback}
                  className="gap-2 text-gray-500 hover:text-gray-700 dark:text-slate-400 dark:hover:text-slate-300"
                >
                  <MessageSquare className="h-4 w-4" />
                  Report this issue
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Help Text */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="mt-4 text-center text-sm text-gray-500 dark:text-slate-500"
        >
          If this keeps happening, try{' '}
          <button
            onClick={() => window.location.reload()}
            className="text-emerald-600 hover:underline dark:text-emerald-400"
          >
            refreshing the page
          </button>{' '}
          or{' '}
          <Link href="/help" className="text-emerald-600 hover:underline dark:text-emerald-400">
            contact support
          </Link>
          .
        </motion.p>
      </motion.div>
    </div>
  );
}