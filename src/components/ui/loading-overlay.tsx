'use client';

import * as React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Loader2 } from 'lucide-react';

export interface LoadingOverlayProps {
  isLoading: boolean;
  message?: string;
  fullScreen?: boolean;
  blur?: boolean; // Kept for compatibility, though branding overlay uses blur by default
  spinnerSize?: 'sm' | 'md' | 'lg'; // Kept for compatibility
  className?: string; // Kept for compatibility
  children?: React.ReactNode;
}

export function LoadingOverlay({
  isLoading,
  message = "Loading...",
  fullScreen = true,
  children
}: LoadingOverlayProps) {
  // If not fullScreen (i.e. wrapping children), we just render children + overlay if loading
  // But strictly matching previous API where it might wrap content

  return (
    <div className={cn("relative", fullScreen ? "static" : "h-full w-full")}>
      {children}
      <AnimatePresence>
        {isLoading && (
          <motion.div
            initial={{ opacity: 0, backdropFilter: "blur(0px)" }}
            animate={{ opacity: 1, backdropFilter: "blur(12px)" }}
            exit={{ opacity: 0, backdropFilter: "blur(0px)" }}
            transition={{ duration: 0.4 }}
            className={cn(
              "flex flex-col items-center justify-center z-50 bg-background/60",
              fullScreen ? "fixed inset-0" : "absolute inset-0 rounded-inherit"
            )}
          >
            <div className="relative flex flex-col items-center gap-6">
              {/* Branding / Logo Animation */}
              <motion.div
                animate={{
                  scale: [1, 1.1, 1],
                  opacity: [0.8, 1, 0.8],
                  rotate: [0, 5, -5, 0],
                }}
                transition={{
                  duration: 3,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
                className="relative flex items-center justify-center p-6 rounded-full bg-primary/10 shadow-xl border border-primary/20"
              >
                {/* Fallback Pulse Circle or Logo */}
                <div className="h-10 w-10 rounded-full bg-gradient-to-tr from-primary to-primary/60 shadow-[0_0_20px_rgba(var(--primary),0.5)]" />
              </motion.div>

              {/* Loading Message */}
              <div className="text-center space-y-2">
                {message && (
                  <motion.p
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-lg font-medium text-foreground tracking-tight"
                  >
                    {message}
                  </motion.p>
                )}

                {/* Progress Bar (Indeterminate) */}
                <div className="h-1 w-32 bg-muted overflow-hidden rounded-full mx-auto">
                  <motion.div
                    className="h-full bg-primary"
                    animate={{ x: ["-100%", "100%"] }}
                    transition={{
                      repeat: Infinity,
                      duration: 1.5,
                      ease: "linear",
                    }}
                  />
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// Keeping other exports for compatibility but updated visuals
export function InlineLoader({ size = 'md', className }: { size?: 'sm' | 'md' | 'lg', className?: string }) {
  const sizes = { sm: 'h-4 w-4', md: 'h-6 w-6', lg: 'h-8 w-8' };
  return (
    <Loader2
      className={cn(
        'animate-spin text-primary',
        sizes[size],
        className
      )}
    />
  );
}

export function PageLoader({ message = 'Loading...' }: { message?: string }) {
  return <LoadingOverlay isLoading={true} message={message} fullScreen={false} className="min-h-[400px]" />;
}

export function ButtonLoader({ className }: { className?: string }) {
  return <Loader2 className={cn('h-4 w-4 animate-spin', className)} />;
}

export function DataLoader({
  isLoading,
  isEmpty,
  error,
  loadingMessage = 'Loading data...',
  emptyMessage = 'No data found',
  emptyIcon,
  onRetry,
  children,
}: any) {
  if (isLoading) {
    return <PageLoader message={loadingMessage} />;
  }

  if (error) {
    return (
      <div className="flex min-h-[300px] flex-col items-center justify-center gap-4 text-center p-8 rounded-xl border border-dashed border-destructive/20 bg-destructive/5">
        <div className="rounded-full bg-destructive/10 p-4">
          <span className="text-2xl">⚠️</span>
        </div>
        <div>
          <h3 className="text-lg font-semibold text-foreground">
            Something went wrong
          </h3>
          <p className="mt-1 text-sm text-muted-foreground">
            {error.message || 'An unexpected error occurred'}
          </p>
        </div>
        {onRetry && (
          <button
            onClick={onRetry}
            className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            Try Again
          </button>
        )}
      </div>
    );
  }

  if (isEmpty) {
    const EmptyIcon = () => (
      <div className="rounded-full bg-muted p-6">
        <span className="text-2xl">📭</span>
      </div>
    );

    return (
      <div className="flex min-h-[300px] flex-col items-center justify-center gap-4 text-center p-8">
        {emptyIcon || <EmptyIcon />}
        <p className="text-muted-foreground font-medium">{emptyMessage}</p>
      </div>
    );
  }

  return <>{children}</>;
}
