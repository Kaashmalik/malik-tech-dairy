// Sentry client-side configuration
import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,

  // Set tracesSampleRate to 1.0 to capture 100% of the transactions for performance monitoring
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,

  // Session Replay
  replaysSessionSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
  replaysOnErrorSampleRate: 1.0,

  // Environment
  environment: process.env.NODE_ENV || 'development',

  // Enable debug mode in development
  debug: process.env.NODE_ENV === 'development',

  // Integrations
  integrations: [
    Sentry.replayIntegration({
      maskAllText: true,
      blockAllMedia: true,
    }),
    Sentry.browserTracingIntegration(),
  ],

  // Before send hook to add tenant context
  beforeSend(event, hint) {
    // Add tenant context from window if available
    if (typeof window !== 'undefined') {
      // Try to get from Clerk context stored in window
      const tenantId = (window as any).__TENANT_ID__ || (window as any).__CLERK_ORG_ID__;
      const userId = (window as any).__USER_ID__ || (window as any).__CLERK_USER_ID__;

      if (tenantId) {
        event.tags = {
          ...event.tags,
          tenantId: String(tenantId),
        };
        event.contexts = {
          ...event.contexts,
          tenant: {
            id: String(tenantId),
          },
        };
      }

      if (userId) {
        event.user = {
          ...event.user,
          id: String(userId),
        };
      }
    }

    return event;
  },

  // Set user context on initialization
  initialScope: {
    tags: {},
    contexts: {},
  },

  // Ignore certain errors
  ignoreErrors: [
    // Browser extensions
    'top.GLOBALS',
    'originalCreateNotification',
    'canvas.contentDocument',
    'MyApp_RemoveAllHighlights',
    'atomicFindClose',
    // Network errors that are not actionable
    'NetworkError',
    'Network request failed',
    // Third-party scripts
    'fb_xd_fragment',
    'bmi_SafeAddOnload',
    'EBCallBackMessageReceived',
    // Common non-actionable errors
    'ResizeObserver loop limit exceeded',
    'Non-Error promise rejection captured',
  ],
});
