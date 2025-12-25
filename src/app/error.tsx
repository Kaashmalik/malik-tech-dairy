'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import * as Sentry from '@sentry/nextjs';
import { AlertTriangle, RefreshCw, Home, MessageSquare, Copy, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useState } from 'react';

interface ErrorPageProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function GlobalError({ error, reset }: ErrorPageProps) {
  const [copied, setCopied] = useState(false);
  const [eventId, setEventId] = useState<string | null>(null);

  useEffect(() => {
    // Log error to Sentry
    const id = Sentry.captureException(error, {
      tags: {
        errorBoundary: 'global',
      },
    });
    setEventId(id);

    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
    }
  }, [error]);

  const copyErrorId = async () => {
    if (error.digest) {
      await navigator.clipboard.writeText(error.digest);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleReportFeedback = () => {
    if (eventId) {
      Sentry.showReportDialog({ eventId });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-orange-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
      <div className="flex min-h-screen flex-col items-center justify-center px-4 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="max-w-lg"
        >
          {/* Error Icon */}
          <motion.div
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="mb-6 flex justify-center"
          >
            <div className="rounded-full bg-red-100 p-6 dark:bg-red-900/30">
              <AlertTriangle className="h-12 w-12 text-red-600 dark:text-red-400" />
            </div>
          </motion.div>

          {/* Error Message */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            <h1 className="mb-3 text-2xl font-bold text-gray-900 dark:text-white">
              Something Went Wrong
            </h1>
            <p className="mb-6 text-gray-600 dark:text-slate-400">
              We encountered an unexpected error. Our team has been notified and is working to fix it.
            </p>
          </motion.div>

          {/* Error Details (Development Only) */}
          {process.env.NODE_ENV === 'development' && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4 text-left dark:border-red-800 dark:bg-red-900/20"
            >
              <p className="mb-2 text-sm font-semibold text-red-800 dark:text-red-300">
                Error Details (Dev Only):
              </p>
              <p className="break-all font-mono text-xs text-red-700 dark:text-red-400">
                {error.message}
              </p>
              {error.stack && (
                <details className="mt-2">
                  <summary className="cursor-pointer text-xs text-red-600 dark:text-red-400">
                    View Stack Trace
                  </summary>
                  <pre className="mt-2 max-h-40 overflow-auto whitespace-pre-wrap text-xs text-red-600 dark:text-red-400">
                    {error.stack}
                  </pre>
                </details>
              )}
            </motion.div>
          )}

          {/* Error ID */}
          {error.digest && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.45 }}
              className="mb-6 flex items-center justify-center gap-2"
            >
              <span className="text-sm text-gray-500 dark:text-slate-500">
                Error ID: <code className="rounded bg-gray-100 px-2 py-1 font-mono text-xs dark:bg-slate-700">{error.digest}</code>
              </span>
              <button
                onClick={copyErrorId}
                className="rounded p-1 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-slate-700 dark:hover:text-slate-300"
                title="Copy error ID"
              >
                {copied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
              </button>
            </motion.div>
          )}

          {/* Action Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="flex flex-col gap-3 sm:flex-row sm:justify-center"
          >
            <Button onClick={reset} size="lg" className="gap-2">
              <RefreshCw className="h-4 w-4" />
              Try Again
            </Button>
            <Button asChild variant="outline" size="lg" className="gap-2">
              <Link href="/dashboard">
                <Home className="h-4 w-4" />
                Go to Dashboard
              </Link>
            </Button>
          </motion.div>

          {/* Report Button */}
          {eventId && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.7 }}
              className="mt-4"
            >
              <Button
                variant="ghost"
                size="sm"
                onClick={handleReportFeedback}
                className="gap-2 text-gray-500 hover:text-gray-700 dark:text-slate-400 dark:hover:text-slate-300"
              >
                <MessageSquare className="h-4 w-4" />
                Report this issue
              </Button>
            </motion.div>
          )}

          {/* Support Info */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
            className="mt-8 text-sm text-gray-500 dark:text-slate-500"
          >
            If this problem persists, please contact{' '}
            <a
              href="mailto:support@maliktechdairy.com"
              className="text-emerald-600 hover:underline dark:text-emerald-400"
            >
              support@maliktechdairy.com
            </a>
          </motion.p>
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