'use client';

import * as React from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface LoadingOverlayProps {
  isLoading: boolean;
  message?: string;
  fullScreen?: boolean;
  blur?: boolean;
  spinnerSize?: 'sm' | 'md' | 'lg';
  className?: string;
  children?: React.ReactNode;
}

const spinnerSizes = {
  sm: 'h-6 w-6',
  md: 'h-8 w-8',
  lg: 'h-12 w-12',
};

export function LoadingOverlay({
  isLoading,
  message = 'Loading...',
  fullScreen = false,
  blur = true,
  spinnerSize = 'md',
  className,
  children,
}: LoadingOverlayProps) {
  if (!isLoading) {
    return <>{children}</>;
  }

  const overlayContent = (
    <div
      className={cn(
        'flex flex-col items-center justify-center gap-3',
        fullScreen ? 'fixed inset-0 z-50' : 'absolute inset-0 z-10',
        blur ? 'bg-white/80 backdrop-blur-sm dark:bg-slate-900/80' : 'bg-white dark:bg-slate-900',
        className
      )}
    >
      <div className="flex flex-col items-center gap-3">
        <Loader2 className={cn('animate-spin text-emerald-600 dark:text-emerald-400', spinnerSizes[spinnerSize])} />
        {message && (
          <p className="text-sm font-medium text-gray-600 dark:text-slate-400">
            {message}
          </p>
        )}
      </div>
    </div>
  );

  if (fullScreen) {
    return (
      <>
        {children}
        {overlayContent}
      </>
    );
  }

  return (
    <div className="relative">
      {children}
      {overlayContent}
    </div>
  );
}

// Simple inline loader
interface InlineLoaderProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function InlineLoader({ size = 'md', className }: InlineLoaderProps) {
  return (
    <Loader2 
      className={cn(
        'animate-spin text-emerald-600 dark:text-emerald-400',
        spinnerSizes[size],
        className
      )} 
    />
  );
}

// Page loading state
interface PageLoaderProps {
  message?: string;
}

export function PageLoader({ message = 'Loading...' }: PageLoaderProps) {
  return (
    <div className="flex min-h-[400px] flex-col items-center justify-center gap-4">
      <div className="relative">
        <div className="h-16 w-16 rounded-full border-4 border-emerald-200 dark:border-emerald-900" />
        <div className="absolute inset-0 h-16 w-16 animate-spin rounded-full border-4 border-emerald-600 border-t-transparent dark:border-emerald-400" />
      </div>
      <p className="text-sm font-medium text-gray-600 dark:text-slate-400">{message}</p>
    </div>
  );
}

// Button loading state
interface ButtonLoaderProps {
  className?: string;
}

export function ButtonLoader({ className }: ButtonLoaderProps) {
  return <Loader2 className={cn('h-4 w-4 animate-spin', className)} />;
}

// Data loading wrapper
interface DataLoaderProps {
  isLoading: boolean;
  isEmpty: boolean;
  error?: Error | null;
  loadingMessage?: string;
  emptyMessage?: string;
  emptyIcon?: React.ReactNode;
  onRetry?: () => void;
  children: React.ReactNode;
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
}: DataLoaderProps) {
  if (isLoading) {
    return <PageLoader message={loadingMessage} />;
  }

  if (error) {
    return (
      <div className="flex min-h-[400px] flex-col items-center justify-center gap-4 text-center">
        <div className="rounded-full bg-red-100 p-4 dark:bg-red-900/30">
          <span className="text-4xl">⚠️</span>
        </div>
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Something went wrong
          </h3>
          <p className="mt-1 text-sm text-gray-600 dark:text-slate-400">
            {error.message || 'An unexpected error occurred'}
          </p>
        </div>
        {onRetry && (
          <button
            onClick={onRetry}
            className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700"
          >
            Try Again
          </button>
        )}
      </div>
    );
  }

  if (isEmpty) {
    return (
      <div className="flex min-h-[400px] flex-col items-center justify-center gap-4 text-center">
        {emptyIcon || (
          <div className="rounded-full bg-gray-100 p-4 dark:bg-slate-800">
            <span className="text-4xl">📭</span>
          </div>
        )}
        <p className="text-gray-600 dark:text-slate-400">{emptyMessage}</p>
      </div>
    );
  }

  return <>{children}</>;
}
