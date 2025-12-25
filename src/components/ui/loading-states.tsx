/**
 * Enhanced Loading States
 * Provides better UX with loading spinners, messages, and progress indicators
 */

import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  text?: string;
}

export function LoadingSpinner({ size = 'md', className, text }: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-6 w-6',
    lg: 'h-8 w-8',
  };

  return (
    <div className={cn('flex items-center gap-2', className)}>
      <Loader2 className={cn('animate-spin', sizeClasses[size])} />
      {text && <span className="text-sm text-muted-foreground">{text}</span>}
    </div>
  );
}

// Full page loading state
export function FullPageLoading({
  title = 'Loading...',
  description = 'Please wait while we fetch your data',
}: {
  title?: string;
  description?: string;
}) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center">
      <div className="flex flex-col items-center space-y-4 text-center">
        <LoadingSpinner size="lg" />
        <div className="space-y-2">
          <h2 className="text-lg font-semibold">{title}</h2>
          <p className="text-sm text-muted-foreground">{description}</p>
        </div>
      </div>
    </div>
  );
}

// Page content loading state
export function PageLoading({
  title = 'Loading...',
  height = '400px',
}: {
  title?: string;
  height?: string;
}) {
  return (
    <div 
      className="flex flex-col items-center justify-center w-full bg-white rounded-lg border border-gray-200"
      style={{ height }}
    >
      <div className="flex flex-col items-center space-y-3 text-center">
        <LoadingSpinner size="lg" />
        <p className="text-sm font-medium text-gray-900">{title}</p>
        <p className="text-xs text-gray-500">This might take a moment</p>
      </div>
    </div>
  );
}

// Button loading state
export function ButtonLoading({ text = 'Loading...' }: { text?: string }) {
  return (
    <div className="flex items-center justify-center gap-2">
      <Loader2 className="h-4 w-4 animate-spin" />
      <span>{text}</span>
    </div>
  );
}

// Table loading overlay
export function TableLoading() {
  return (
    <div className="absolute inset-0 flex items-center justify-center bg-white/80 backdrop-blur-sm z-10">
      <div className="flex flex-col items-center space-y-2">
        <LoadingSpinner size="lg" text="Loading data..." />
      </div>
    </div>
  );
}

// Form loading state
export function FormLoading({
  title = 'Saving...',
  description = 'Please wait while we process your request',
}: {
  title?: string;
  description?: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-12">
      <LoadingSpinner size="lg" />
      <div className="mt-4 text-center">
        <p className="text-sm font-medium">{title}</p>
        <p className="text-xs text-muted-foreground mt-1">{description}</p>
      </div>
    </div>
  );
}

// Empty state with loading
export function EmptyStateLoading({
  title = 'Loading data...',
  icon = true,
}: {
  title?: string;
  icon?: boolean;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-12">
      {icon && (
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gray-100">
          <LoadingSpinner size="sm" />
        </div>
      )}
      <p className="mt-2 text-sm font-medium text-gray-900">{title}</p>
      <p className="mt-1 text-xs text-gray-500">Fetching latest information</p>
    </div>
  );
}

// Progress loading state
export function ProgressLoading({
  progress = 0,
  title = 'Loading...',
  showPercentage = true,
}: {
  progress?: number;
  title?: string;
  showPercentage?: boolean;
}) {
  return (
    <div className="w-full space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium">{title}</span>
        {showPercentage && (
          <span className="text-sm text-muted-foreground">{Math.round(progress)}%</span>
        )}
      </div>
      <div className="w-full bg-gray-200 rounded-full h-2">
        <div
          className="bg-blue-600 h-2 rounded-full transition-all duration-300 ease-out"
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
}

// Card loading overlay
export function CardLoading() {
  return (
    <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/90 rounded-lg">
      <LoadingSpinner size="md" />
    </div>
  );
}

// List loading state
export function ListLoading({ itemCount = 5 }: { itemCount?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: itemCount }).map((_, i) => (
        <div key={i} className="flex items-center space-x-3 p-3">
          <LoadingSpinner size="sm" />
          <div className="flex-1">
            <div className="h-4 bg-gray-200 rounded w-3/4 animate-pulse" />
            <div className="h-3 bg-gray-200 rounded w-1/2 mt-2 animate-pulse" />
          </div>
        </div>
      ))}
    </div>
  );
}

// Modal loading state
export function ModalLoading({
  title = 'Processing...',
  message = 'Please wait',
}: {
  title?: string;
  message?: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-8">
      <LoadingSpinner size="lg" />
      <div className="mt-4 text-center">
        <h3 className="text-lg font-medium">{title}</h3>
        <p className="text-sm text-muted-foreground mt-1">{message}</p>
      </div>
    </div>
  );
}

// File upload loading state
export function FileUploadLoading({
  progress = 0,
  fileName = 'file.jpg',
}: {
  progress?: number;
  fileName?: string;
}) {
  return (
    <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
      <LoadingSpinner size="sm" />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">{fileName}</p>
        <div className="mt-1">
          <ProgressLoading progress={progress} showPercentage={false} />
        </div>
      </div>
      <span className="text-xs text-muted-foreground">{Math.round(progress)}%</span>
    </div>
  );
}

// Chart loading state
export function ChartLoading({ height = 300 }: { height?: number }) {
  return (
    <div 
      className="flex items-center justify-center bg-white rounded-lg border border-gray-200"
      style={{ height }}
    >
      <div className="flex flex-col items-center space-y-2">
        <LoadingSpinner size="md" />
        <p className="text-sm text-muted-foreground">Loading chart...</p>
      </div>
    </div>
  );
}

// Search loading state
export function SearchLoading() {
  return (
    <div className="flex items-center justify-center py-8">
      <LoadingSpinner size="md" text="Searching..." />
    </div>
  );
}

// Infinite scroll loading
export function InfiniteScrollLoading() {
  return (
    <div className="flex justify-center py-4">
      <LoadingSpinner size="md" text="Loading more..." />
    </div>
  );
}
