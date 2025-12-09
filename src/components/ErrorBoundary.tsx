'use client';

import React from 'react';
import * as Sentry from '@sentry/nextjs';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertCircle, RefreshCw, Home, MessageSquare } from 'lucide-react';

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  eventId: string | null;
}

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
  showReportDialog?: boolean;
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null, eventId: null };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Log to Sentry with component stack
    const eventId = Sentry.captureException(error, {
      contexts: {
        react: {
          componentStack: errorInfo.componentStack,
        },
      },
    });

    this.setState({ eventId });

    // Call custom error handler if provided
    this.props.onError?.(error, errorInfo);

    // Also log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.error('ErrorBoundary caught an error:', error, errorInfo);
    }
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null, eventId: null });
  };

  handleReportFeedback = () => {
    if (this.state.eventId) {
      Sentry.showReportDialog({ eventId: this.state.eventId });
    }
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className='bg-background flex min-h-screen items-center justify-center p-4'>
          <Card className='w-full max-w-md shadow-lg'>
            <CardHeader>
              <div className='flex items-center gap-2'>
                <AlertCircle className='text-destructive h-6 w-6' />
                <CardTitle className='text-xl'>Something went wrong</CardTitle>
              </div>
              <CardDescription>
                We encountered an unexpected error. Our team has been notified.
              </CardDescription>
            </CardHeader>
            <CardContent className='space-y-4'>
              {process.env.NODE_ENV === 'development' && this.state.error && (
                <div className='bg-muted max-h-32 overflow-auto rounded-lg p-3'>
                  <p className='text-muted-foreground break-all font-mono text-sm'>
                    {this.state.error.message}
                  </p>
                </div>
              )}

              {this.state.eventId && (
                <p className='text-muted-foreground text-center text-xs'>
                  Error ID: <code className='bg-muted rounded px-1'>{this.state.eventId}</code>
                </p>
              )}

              <div className='flex flex-col gap-2 sm:flex-row'>
                <Button
                  onClick={() => {
                    this.handleReset();
                    window.location.reload();
                  }}
                  className='flex-1'
                >
                  <RefreshCw className='mr-2 h-4 w-4' />
                  Reload Page
                </Button>
                <Button variant='outline' onClick={() => (window.location.href = '/dashboard')}>
                  <Home className='mr-2 h-4 w-4' />
                  Go Home
                </Button>
              </div>

              {this.props.showReportDialog && this.state.eventId && (
                <Button
                  variant='ghost'
                  size='sm'
                  onClick={this.handleReportFeedback}
                  className='w-full'
                >
                  <MessageSquare className='mr-2 h-4 w-4' />
                  Report this issue
                </Button>
              )}
            </CardContent>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}

/**
 * Higher-order component to wrap any component with error boundary
 */
export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  errorBoundaryProps?: Omit<ErrorBoundaryProps, 'children'>
) {
  const displayName = Component.displayName || Component.name || 'Component';

  const WrappedComponent = (props: P) => (
    <ErrorBoundary {...errorBoundaryProps}>
      <Component {...props} />
    </ErrorBoundary>
  );

  WrappedComponent.displayName = `withErrorBoundary(${displayName})`;

  return WrappedComponent;
}
