/**
 * Enterprise Structured Logging Utility for MTK Dairy
 * 
 * Features:
 * - Structured JSON logging for production
 * - Tenant and user context tracking
 * - Automatic Sentry integration
 * - Request ID correlation
 * - Performance timing
 * - Log level filtering
 */

import * as Sentry from '@sentry/nextjs';

export type LogLevel = 'debug' | 'info' | 'warn' | 'error' | 'fatal';

const LOG_LEVELS: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
  fatal: 4,
};

interface LogContext {
  tenantId?: string;
  userId?: string;
  requestId?: string;
  route?: string;
  method?: string;
  duration?: number;
  [key: string]: unknown;
}

interface StructuredLog {
  timestamp: string;
  level: LogLevel;
  message: string;
  context?: LogContext;
  error?: {
    name: string;
    message: string;
    stack?: string;
  };
}

class Logger {
  private context: LogContext = {};
  private minLevel: LogLevel;

  constructor() {
    // In production, only log warn and above by default
    this.minLevel = (process.env.LOG_LEVEL as LogLevel) || 
      (process.env.NODE_ENV === 'production' ? 'info' : 'debug');
  }

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
   * Check if a log level should be logged
   */
  private shouldLog(level: LogLevel): boolean {
    return LOG_LEVELS[level] >= LOG_LEVELS[this.minLevel];
  }

  /**
   * Format log as structured JSON for production
   */
  private formatStructuredLog(
    level: LogLevel, 
    message: string, 
    extra?: LogContext,
    error?: Error | unknown
  ): StructuredLog {
    const log: StructuredLog = {
      timestamp: new Date().toISOString(),
      level,
      message,
    };

    const context = { ...this.context, ...extra };
    if (Object.keys(context).length > 0) {
      log.context = context;
    }

    if (error instanceof Error) {
      log.error = {
        name: error.name,
        message: error.message,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      };
    }

    return log;
  }

  /**
   * Output log to console
   */
  private output(level: LogLevel, log: StructuredLog) {
    if (!this.shouldLog(level)) return;

    // In production, output structured JSON
    if (process.env.NODE_ENV === 'production') {
      const output = JSON.stringify(log);
      switch (level) {
        case 'debug':
        case 'info':
          process.stdout.write(output + '\n');
          break;
        case 'warn':
        case 'error':
        case 'fatal':
          process.stderr.write(output + '\n');
          break;
      }
    } else {
      // In development, use colored console output
      const prefix = `[${log.timestamp}] [${level.toUpperCase()}]`;
      const contextStr = log.context ? ` ${JSON.stringify(log.context)}` : '';
      
      switch (level) {
        case 'debug':
          console.debug(`\x1b[90m${prefix}\x1b[0m ${log.message}${contextStr}`);
          break;
        case 'info':
          console.info(`\x1b[36m${prefix}\x1b[0m ${log.message}${contextStr}`);
          break;
        case 'warn':
          console.warn(`\x1b[33m${prefix}\x1b[0m ${log.message}${contextStr}`);
          break;
        case 'error':
        case 'fatal':
          console.error(`\x1b[31m${prefix}\x1b[0m ${log.message}${contextStr}`, log.error || '');
          break;
      }
    }
  }

  /**
   * Log a debug message (development only by default)
   */
  debug(message: string, extra?: LogContext) {
    const log = this.formatStructuredLog('debug', message, extra);
    this.output('debug', log);
  }

  /**
   * Log an info message
   */
  info(message: string, extra?: LogContext) {
    const log = this.formatStructuredLog('info', message, extra);
    this.output('info', log);
  }

  /**
   * Log a warning message
   */
  warn(message: string, extra?: LogContext) {
    const log = this.formatStructuredLog('warn', message, extra);
    this.output('warn', log);

    // Add breadcrumb to Sentry
    Sentry.addBreadcrumb({
      level: 'warning',
      message,
      data: { ...this.context, ...extra },
    });
  }

  /**
   * Log an error message
   */
  error(message: string, error?: Error | unknown, extra?: LogContext) {
    const context = { ...this.context, ...extra };
    const log = this.formatStructuredLog('error', message, extra, error);
    this.output('error', log);

    // Capture exception in Sentry with context
    Sentry.withScope(scope => {
      if (context.tenantId) {
        scope.setTag('tenantId', context.tenantId);
        scope.setContext('tenant', { id: context.tenantId });
      }
      if (context.userId) {
        scope.setUser({ id: context.userId });
      }
      if (context.requestId) {
        scope.setTag('requestId', context.requestId);
      }
      if (extra) {
        scope.setContext('extra', extra);
      }

      if (error instanceof Error) {
        Sentry.captureException(error);
      } else {
        Sentry.captureMessage(message, 'error');
      }
    });
  }

  /**
   * Log a fatal error and send to Sentry
   */
  fatal(message: string, error?: Error | unknown, extra?: LogContext) {
    const context = { ...this.context, ...extra };
    const log = this.formatStructuredLog('fatal', message, extra, error);
    this.output('fatal', log);

    // Always capture fatal errors in Sentry
    Sentry.withScope(scope => {
      scope.setLevel('fatal');
      if (context.tenantId) {
        scope.setTag('tenantId', context.tenantId);
        scope.setContext('tenant', { id: context.tenantId });
      }
      if (context.userId) {
        scope.setUser({ id: context.userId });
      }
      if (context.requestId) {
        scope.setTag('requestId', context.requestId);
      }
      if (extra) {
        scope.setContext('extra', extra);
      }

      if (error instanceof Error) {
        Sentry.captureException(error);
      } else {
        Sentry.captureMessage(message, 'fatal');
      }
    });
  }

  /**
   * Log API request/response for debugging
   */
  api(method: string, route: string, status: number, duration: number, extra?: LogContext) {
    const level: LogLevel = status >= 500 ? 'error' : status >= 400 ? 'warn' : 'info';
    const message = `${method} ${route} ${status} ${duration}ms`;
    const log = this.formatStructuredLog(level, message, { 
      ...extra, 
      method, 
      route, 
      status, 
      duration 
    });
    this.output(level, log);
  }

  /**
   * Create a child logger with additional context
   */
  child(additionalContext: LogContext): Logger {
    const childLogger = new Logger();
    childLogger.setContext({ ...this.context, ...additionalContext });
    return childLogger;
  }

  /**
   * Time an async operation
   */
  async time<T>(label: string, fn: () => Promise<T>, extra?: LogContext): Promise<T> {
    const start = performance.now();
    try {
      const result = await fn();
      const duration = Math.round(performance.now() - start);
      this.debug(`${label} completed`, { ...extra, duration });
      return result;
    } catch (error) {
      const duration = Math.round(performance.now() - start);
      this.error(`${label} failed`, error, { ...extra, duration });
      throw error;
    }
  }
}

// Export singleton instance
export const logger = new Logger();

// Export class for testing
export { Logger };

// Export a function to create request-scoped loggers
export function createRequestLogger(requestId: string, extra?: LogContext): Logger {
  const requestLogger = new Logger();
  requestLogger.setContext({ requestId, ...extra });
  return requestLogger;
}
