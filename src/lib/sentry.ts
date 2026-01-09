/**
 * Sentry Error Tracking Configuration
 * Production-ready error monitoring and performance tracking
 */

import * as Sentry from '@sentry/nextjs';

// Check if Sentry is configured
const isSentryConfigured = !!(process.env.SENTRY_DSN || process.env.NEXT_PUBLIC_SENTRY_DSN);

/**
 * Initialize Sentry for server-side
 */
export function initSentry() {
  if (!isSentryConfigured) {
    console.warn('Sentry not configured, error tracking disabled');
    return;
  }

  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    environment: process.env.NODE_ENV || 'development',
    release: process.env.npm_package_version || '1.0.0',

    // Performance monitoring
    tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,

    // Session replay
    replaysSessionSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
    replaysOnErrorSampleRate: 1.0,

    // Before send for filtering
    beforeSend(event, hint) {
      // Filter out specific errors
      if (event.exception) {
        const error = hint.originalException as Error;

        // Ignore certain error types
        if (error?.message?.includes('AbortError')) {
          return null;
        }

        // Ignore network errors in development
        if (process.env.NODE_ENV === 'development' && error?.message?.includes('fetch')) {
          return null;
        }
      }

      // Add custom context
      event.tags = {
        ...event.tags,
        region: process.env.VERCEL_REGION || 'unknown',
      };

      return event;
    },

    // Before breadcrumb for filtering
    beforeBreadcrumb(breadcrumb) {
      // Filter out sensitive breadcrumbs
      if (breadcrumb.category === 'xhr' || breadcrumb.category === 'fetch') {
        const url = breadcrumb.data?.url as string;

        // Filter out API keys in URLs
        if (url?.includes('api_key') || url?.includes('token')) {
          return null;
        }
      }

      return breadcrumb;
    },
  });

  console.log('Sentry initialized');
}

/**
 * Capture exception with context
 */
export function captureException(
  error: Error,
  context?: {
    tenantId?: string;
    userId?: string;
    requestId?: string;
    [key: string]: unknown;
  }
) {
  if (!isSentryConfigured) return;

  Sentry.withScope(scope => {
    if (context?.tenantId) {
      scope.setTag('tenantId', context.tenantId);
      scope.setContext('tenant', { id: context.tenantId });
    }

    if (context?.userId) {
      scope.setUser({ id: context.userId });
    }

    if (context?.requestId) {
      scope.setTag('requestId', context.requestId);
    }

    if (context) {
      scope.setContext('additional', context);
    }

    Sentry.captureException(error);
  });
}

/**
 * Capture message with level
 */
export function captureMessage(
  message: string,
  level: 'info' | 'warning' | 'error' = 'info',
  context?: Record<string, unknown>
) {
  if (!isSentryConfigured) return;

  Sentry.withScope(scope => {
    if (context) {
      scope.setContext('context', context);
    }

    Sentry.captureMessage(message, { level });
  });
}

/**
 * Add breadcrumb for tracking
 */
export function addBreadcrumb(
  message: string,
  category: string,
  level: 'info' | 'warning' | 'error' = 'info',
  data?: Record<string, unknown>
) {
  if (!isSentryConfigured) return;

  Sentry.addBreadcrumb({
    message,
    category,
    level,
    data,
  });
}

/**
 * Set user context
 */
export function setUser(userId: string, email?: string, tenantId?: string) {
  if (!isSentryConfigured) return;

  Sentry.setUser({
    id: userId,
    email,
    tenantId,
  });
}

/**
 * Clear user context
 */
export function clearUser() {
  if (!isSentryConfigured) return;

  Sentry.setUser(null);
}

/**
 * Start a performance transaction
 */
export function startTransaction(name: string, op: string) {
  if (!isSentryConfigured) return null;

  return Sentry.startSpan(
    {
      name,
      op,
    },
    () => ({})
  );
}

/**
 * Set transaction data
 */
export function setTransactionData(key: string, value: unknown) {
  if (!isSentryConfigured) return;

  const span = Sentry.getActiveSpan();
  if (span) {
    span.setAttribute(key, value as string | number | boolean);
  }
}

/**
 * Flush pending events
 */
export async function flush(timeout: number = 2000): Promise<boolean> {
  if (!isSentryConfigured) return true;

  return await Sentry.flush(timeout);
}

/**
 * Get Sentry configuration status
 */
export function getSentryStatus() {
  return {
    configured: isSentryConfigured,
    environment: process.env.NODE_ENV || 'development',
    release: process.env.npm_package_version || '1.0.0',
    dsn: process.env.SENTRY_DSN || process.env.NEXT_PUBLIC_SENTRY_DSN,
  };
}

/**
 * Custom error classes for better Sentry tracking
 */
export class TrackedError extends Error {
  constructor(
    message: string,
    public code: string,
    public context?: Record<string, unknown>
  ) {
    super(message);
    this.name = 'TrackedError';
  }
}

export class DatabaseError extends TrackedError {
  constructor(message: string, context?: Record<string, unknown>) {
    super(message, 'DATABASE_ERROR', context);
    this.name = 'DatabaseError';
  }
}

export class AuthenticationError extends TrackedError {
  constructor(message: string, context?: Record<string, unknown>) {
    super(message, 'AUTH_ERROR', context);
    this.name = 'AuthenticationError';
  }
}

export class AuthorizationError extends TrackedError {
  constructor(message: string, context?: Record<string, unknown>) {
    super(message, 'AUTHORIZATION_ERROR', context);
    this.name = 'AuthorizationError';
  }
}

export class ValidationError extends TrackedError {
  constructor(message: string, context?: Record<string, unknown>) {
    super(message, 'VALIDATION_ERROR', context);
    this.name = 'ValidationError';
  }
}

export class ExternalServiceError extends TrackedError {
  constructor(
    message: string,
    public service: string,
    context?: Record<string, unknown>
  ) {
    super(message, 'EXTERNAL_SERVICE_ERROR', { ...context, service });
    this.name = 'ExternalServiceError';
  }
}

/**
 * Error tracking middleware
 */
export function withErrorTracking<T extends (...args: unknown[]) => Promise<unknown>>(
  fn: T,
  options?: {
    name?: string;
    captureException?: boolean;
    context?: () => Record<string, unknown>;
  }
): T {
  return (async (...args: unknown[]) => {
    const transaction = startTransaction(options?.name || fn.name || 'anonymous', 'function');

    try {
      const result = await fn(...args);

      if (transaction) {
        const tx = transaction as any;
        tx.setStatus?.({ code: 'ok' });
        tx.end?.();
      }

      return result;
    } catch (error) {
      if (transaction) {
        const tx = transaction as any;
        tx.setStatus?.({ code: 'internal_error' });
        tx.end?.();
      }

      if (options?.captureException !== false) {
        const context = options?.context?.() || {};
        captureException(error as Error, context);
      }

      throw error;
    }
  }) as T;
}
