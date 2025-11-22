// Sentry edge runtime configuration
import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.SENTRY_DSN || process.env.NEXT_PUBLIC_SENTRY_DSN,
  
  // Set tracesSampleRate to 1.0 to capture 100% of the transactions for performance monitoring
  tracesSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 1.0,
  
  // Environment
  environment: process.env.NODE_ENV || "development",
  
  // Enable debug mode in development
  debug: process.env.NODE_ENV === "development",
  
  // Before send hook to add tenant context
  beforeSend(event, hint) {
    const request = hint.request;
    if (request?.headers) {
      const tenantId = request.headers["x-tenant-id"];
      const userId = request.headers["x-user-id"];
      
      if (tenantId) {
        event.tags = {
          ...event.tags,
          tenantId: Array.isArray(tenantId) ? tenantId[0] : tenantId,
        };
      }
      
      if (userId) {
        event.user = {
          ...event.user,
          id: Array.isArray(userId) ? userId[0] : userId,
        };
      }
    }
    
    return event;
  },
});

