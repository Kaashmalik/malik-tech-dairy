// Next.js Instrumentation Hook
// This file is loaded once when the Next.js server starts
// https://nextjs.org/docs/app/building-your-application/optimizing/instrumentation

export async function register() {
  // Only run Sentry on server-side
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    // Dynamically import Sentry server config
    const Sentry = await import('@sentry/nextjs');
    
    Sentry.init({
      dsn: process.env.SENTRY_DSN || process.env.NEXT_PUBLIC_SENTRY_DSN,
      
      // Disable Sentry if no DSN is configured
      enabled: !!(process.env.SENTRY_DSN || process.env.NEXT_PUBLIC_SENTRY_DSN),
      
      // Performance monitoring
      tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 0,
      
      // Environment
      environment: process.env.NODE_ENV || 'development',
      
      // Disable debug in development to reduce noise
      debug: false,
      
      // Ignore certain errors
      ignoreErrors: [
        'ECONNREFUSED',
        'ECONNRESET',
        'ETIMEDOUT',
        'Redis credentials not configured',
      ],
    });
  }

  if (process.env.NEXT_RUNTIME === 'edge') {
    // Edge runtime Sentry config
    const Sentry = await import('@sentry/nextjs');
    
    Sentry.init({
      dsn: process.env.SENTRY_DSN || process.env.NEXT_PUBLIC_SENTRY_DSN,
      enabled: !!(process.env.SENTRY_DSN || process.env.NEXT_PUBLIC_SENTRY_DSN),
      tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 0,
      environment: process.env.NODE_ENV || 'development',
      debug: false,
    });
  }
}
