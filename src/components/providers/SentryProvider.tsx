'use client';

/**
 * Simple Sentry provider - context setting is now done elsewhere
 */
export function SentryProvider({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
