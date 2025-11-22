/**
 * Structured logging utility with tenant and user context
 * Automatically sends fatal errors to Sentry
 */

import * as Sentry from "@sentry/nextjs";

export type LogLevel = "debug" | "info" | "warn" | "error" | "fatal";

interface LogContext {
  tenantId?: string;
  userId?: string;
  [key: string]: unknown;
}

class Logger {
  private context: LogContext = {};

  /**
   * Set default context for all subsequent logs
   */
  setContext(context: LogContext) {
    this.context = { ...this.context, ...context };
  }

  /**
   * Clear the default context
   */
  clearContext() {
    this.context = {};
  }

  /**
   * Format log message with context
   */
  private formatMessage(level: LogLevel, message: string, extra?: LogContext): string {
    const context = { ...this.context, ...extra };
    const contextStr = Object.keys(context).length > 0 
      ? ` [${JSON.stringify(context)}]` 
      : "";
    return `[${level.toUpperCase()}] ${message}${contextStr}`;
  }

  /**
   * Log a debug message
   */
  debug(message: string, extra?: LogContext) {
    if (process.env.NODE_ENV === "development") {
      console.debug(this.formatMessage("debug", message, extra));
    }
  }

  /**
   * Log an info message
   */
  info(message: string, extra?: LogContext) {
    console.info(this.formatMessage("info", message, extra));
  }

  /**
   * Log a warning message
   */
  warn(message: string, extra?: LogContext) {
    console.warn(this.formatMessage("warn", message, extra));
    
    // Add breadcrumb to Sentry
    Sentry.addBreadcrumb({
      level: "warning",
      message,
      data: { ...this.context, ...extra },
    });
  }

  /**
   * Log an error message
   */
  error(message: string, error?: Error | unknown, extra?: LogContext) {
    const context = { ...this.context, ...extra };
    console.error(this.formatMessage("error", message, extra), error);
    
    // Capture exception in Sentry with context
    Sentry.withScope((scope) => {
      if (context.tenantId) {
        scope.setTag("tenantId", context.tenantId);
        scope.setContext("tenant", { id: context.tenantId });
      }
      if (context.userId) {
        scope.setUser({ id: context.userId });
      }
      if (extra) {
        scope.setContext("extra", extra);
      }
      
      if (error instanceof Error) {
        Sentry.captureException(error);
      } else {
        Sentry.captureMessage(message, "error");
      }
    });
  }

  /**
   * Log a fatal error and send to Sentry
   */
  fatal(message: string, error?: Error | unknown, extra?: LogContext) {
    const context = { ...this.context, ...extra };
    console.error(this.formatMessage("fatal", message, extra), error);
    
    // Always capture fatal errors in Sentry
    Sentry.withScope((scope) => {
      scope.setLevel("fatal");
      if (context.tenantId) {
        scope.setTag("tenantId", context.tenantId);
        scope.setContext("tenant", { id: context.tenantId });
      }
      if (context.userId) {
        scope.setUser({ id: context.userId });
      }
      if (extra) {
        scope.setContext("extra", extra);
      }
      
      if (error instanceof Error) {
        Sentry.captureException(error);
      } else {
        Sentry.captureMessage(message, "fatal");
      }
    });
  }

  /**
   * Create a child logger with additional context
   */
  child(additionalContext: LogContext): Logger {
    const childLogger = new Logger();
    childLogger.setContext({ ...this.context, ...additionalContext });
    return childLogger;
  }
}

// Export singleton instance
export const logger = new Logger();

// Export class for testing
export { Logger };

