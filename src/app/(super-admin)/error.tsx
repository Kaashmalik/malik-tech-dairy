'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import * as Sentry from '@sentry/nextjs';
import { ShieldAlert, RefreshCw, Shield, MessageSquare, Bug, Copy, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface AdminErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function SuperAdminError({ error, reset }: AdminErrorProps) {
  const [eventId, setEventId] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    // Log error to Sentry with admin context
    const id = Sentry.captureException(error, {
      tags: {
        errorBoundary: 'super-admin',
        section: 'platform-admin',
      },
      level: 'error',
    });
    setEventId(id);

    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
    }
  }, [error]);

  const copyErrorDetails = async () => {
    const details = `Error: ${error.message}\nDigest: ${error.digest || 'N/A'}\nEvent ID: ${eventId || 'N/A'}\nTimestamp: ${new Date().toISOString()}`;
    await navigator.clipboard.writeText(details);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

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
        <Card className="border-purple-200 bg-gradient-to-br from-purple-50 to-indigo-50 shadow-lg dark:border-purple-800 dark:from-purple-900/20 dark:to-indigo-900/20">
          <CardHeader className="text-center">
            <motion.div
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2 }}
              className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-purple-100 dark:bg-purple-900/50"
            >
              <ShieldAlert className="h-8 w-8 text-purple-600 dark:text-purple-400" />
            </motion.div>
            <CardTitle className="text-xl text-gray-900 dark:text-white">
              Admin Panel Error
            </CardTitle>
            <CardDescription className="text-gray-600 dark:text-slate-400">
              An error occurred in the admin panel. Platform data is unaffected.
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-4">
            {/* Error Details */}
            <div className="rounded-lg border border-purple-200 bg-white/50 p-3 dark:border-purple-800 dark:bg-slate-800/50">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm font-medium text-purple-700 dark:text-purple-400">
                  <Bug className="h-4 w-4" />
                  Error Details
                </div>
                <button
                  onClick={copyErrorDetails}
                  className="rounded p-1 text-purple-500 transition-colors hover:bg-purple-100 dark:hover:bg-purple-900/30"
                  title="Copy error details"
                >
                  {copied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                </button>
              </div>
              <p className="mt-1 break-all font-mono text-xs text-purple-600 dark:text-purple-400">
                {error.message}
              </p>
              {error.digest && (
                <p className="mt-1 text-xs text-gray-500 dark:text-slate-500">
                  Digest: {error.digest}
                </p>
              )}
            </div>

            {/* Stack Trace (Development Only) */}
            {process.env.NODE_ENV === 'development' && error.stack && (
              <details className="rounded-lg border border-gray-200 bg-gray-50 p-3 dark:border-slate-700 dark:bg-slate-800">
                <summary className="cursor-pointer text-sm font-medium text-gray-700 dark:text-slate-300">
                  View Stack Trace
                </summary>
                <pre className="mt-2 max-h-32 overflow-auto whitespace-pre-wrap text-xs text-gray-600 dark:text-slate-400">
                  {error.stack}
                </pre>
              </details>
            )}

            {/* Action Buttons */}
            <div className="flex flex-col gap-2 pt-2 sm:flex-row">
              <Button onClick={reset} className="flex-1 gap-2 bg-purple-600 hover:bg-purple-700">
                <RefreshCw className="h-4 w-4" />
                Try Again
              </Button>
              <Button asChild variant="outline" className="flex-1 gap-2">
                <Link href="/super-admin">
                  <Shield className="h-4 w-4" />
                  Admin Home
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

        {/* Event ID */}
        {eventId && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="mt-4 text-center text-xs text-gray-500 dark:text-slate-500"
          >
            Sentry Event ID: <code className="rounded bg-gray-100 px-1.5 py-0.5 font-mono dark:bg-slate-700">{eventId}</code>
          </motion.p>
        )}
      </motion.div>
    </div>
  );
}