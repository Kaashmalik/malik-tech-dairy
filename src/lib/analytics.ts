/**
 * PostHog Analytics Integration
 * Product analytics and user behavior tracking
 */

import posthog from 'posthog-js';

// Check if PostHog is configured
const isPostHogConfigured = !!(
  process.env.NEXT_PUBLIC_POSTHOG_KEY && process.env.NEXT_PUBLIC_POSTHOG_HOST
);

/**
 * Initialize PostHog client-side
 */
export function initPostHog() {
  if (!isPostHogConfigured) {
    console.warn('PostHog not configured, analytics disabled');
    return;
  }

  if (typeof window !== 'undefined') {
    posthog.init(process.env.NEXT_PUBLIC_POSTHOG_KEY!, {
      api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST,
      capture_pageview: true,
      capture_pageleave: true,
      persistence: 'localStorage',
      autocapture: false, // Disable autocapture for privacy
      disable_session_recording: process.env.NODE_ENV !== 'production',
    });

    console.log('PostHog initialized');
  }
}

/**
 * Track custom event
 */
export function trackEvent(eventName: string, properties?: Record<string, unknown>) {
  if (!isPostHogConfigured) return;

  posthog.capture(eventName, properties);
}

/**
 * Identify user
 */
export function identifyUser(userId: string, properties?: Record<string, unknown>) {
  if (!isPostHogConfigured) return;

  posthog.identify(userId, properties);
}

/**
 * Reset user session
 */
export function resetUser() {
  if (!isPostHogConfigured) return;

  posthog.reset();
}

/**
 * Set user properties
 */
export function setUserProperties(properties: Record<string, unknown>) {
  if (!isPostHogConfigured) return;

  posthog.people.set(properties);
}

/**
 * Track page view
 */
export function trackPageView(properties?: Record<string, unknown>) {
  if (!isPostHogConfigured) return;

  posthog.capture('$pageview', properties);
}

/**
 * Common event types
 */
export const Events = {
  // Authentication
  USER_SIGNED_UP: 'user_signed_up',
  USER_LOGGED_IN: 'user_logged_in',
  USER_LOGGED_OUT: 'user_logged_out',

  // Tenant
  TENANT_CREATED: 'tenant_created',
  TENANT_DELETED: 'tenant_deleted',
  TENANT_INVITED_USER: 'tenant_invited_user',

  // Animals
  ANIMAL_CREATED: 'animal_created',
  ANIMAL_UPDATED: 'animal_updated',
  ANIMAL_DELETED: 'animal_deleted',
  ANIMAL_VIEWED: 'animal_viewed',

  // Milk
  MILK_LOGGED: 'milk_logged',
  MILK_EXPORTED: 'milk_exported',

  // Health
  HEALTH_RECORD_CREATED: 'health_record_created',
  HEALTH_RECORD_UPDATED: 'health_record_updated',

  // Breeding
  BREEDING_RECORD_CREATED: 'breeding_record_created',
  BREEDING_RECORD_UPDATED: 'breeding_record_updated',

  // Financial
  EXPENSE_CREATED: 'expense_created',
  SALE_CREATED: 'sale_created',
  REPORT_GENERATED: 'report_generated',

  // Subscription
  SUBSCRIPTION_UPGRADED: 'subscription_upgraded',
  SUBSCRIPTION_DOWNGRADED: 'subscription_downgraded',
  SUBSCRIPTION_CANCELLED: 'subscription_cancelled',

  // Features
  FEATURE_USED: 'feature_used',
  EXPORT_DOWNLOADED: 'export_downloaded',
  IMPORT_UPLOADED: 'import_uploaded',

  // Errors
  ERROR_OCCURRED: 'error_occurred',
  API_ERROR: 'api_error',
};

/**
 * Analytics helper functions
 */
export const analytics = {
  /**
   * Track animal-related events
   */
  trackAnimalEvent: (
    event: 'created' | 'updated' | 'deleted' | 'viewed',
    animalId: string,
    species: string,
    tenantId: string
  ) => {
    trackEvent(`animal_${event}`, {
      animal_id: animalId,
      species,
      tenant_id: tenantId,
    });
  },

  /**
   * Track milk logging
   */
  trackMilkLogging: (animalId: string, quantity: number, session: string, tenantId: string) => {
    trackEvent(Events.MILK_LOGGED, {
      animal_id: animalId,
      quantity,
      session,
      tenant_id: tenantId,
    });
  },

  /**
   * Track financial events
   */
  trackFinancialEvent: (
    type: 'expense' | 'sale',
    amount: number,
    category?: string,
    tenantId?: string
  ) => {
    trackEvent(`${type}_created`, {
      amount,
      category,
      tenant_id: tenantId,
    });
  },

  /**
   * Track subscription events
   */
  trackSubscriptionEvent: (
    event: 'upgraded' | 'downgraded' | 'cancelled',
    fromPlan: string,
    toPlan?: string,
    tenantId?: string
  ) => {
    trackEvent(`subscription_${event}`, {
      from_plan: fromPlan,
      to_plan: toPlan,
      tenant_id: tenantId,
    });
  },

  /**
   * Track feature usage
   */
  trackFeatureUsage: (
    featureName: string,
    tenantId?: string,
    metadata?: Record<string, unknown>
  ) => {
    trackEvent(Events.FEATURE_USED, {
      feature_name: featureName,
      tenant_id: tenantId,
      ...metadata,
    });
  },

  /**
   * Track errors
   */
  trackError: (errorType: string, errorMessage: string, context?: Record<string, unknown>) => {
    trackEvent(Events.ERROR_OCCURRED, {
      error_type: errorType,
      error_message: errorMessage,
      ...context,
    });
  },
};

/**
 * Server-side analytics (using PostHog API)
 */
export async function trackServerEvent(
  eventName: string,
  properties: Record<string, unknown>,
  distinctId?: string
) {
  if (!isPostHogConfigured) return;

  try {
    await fetch(`${process.env.NEXT_PUBLIC_POSTHOG_HOST}/capture/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        api_key: process.env.NEXT_PUBLIC_POSTHOG_KEY,
        event: eventName,
        properties: {
          ...properties,
          $lib: 'server',
        },
        distinct_id: distinctId || 'server',
      }),
    });
  } catch (error) {
    console.error('Failed to track server event:', error);
  }
}

/**
 * Get PostHog configuration status
 */
export function getPostHogStatus() {
  return {
    configured: isPostHogConfigured,
    key: process.env.NEXT_PUBLIC_POSTHOG_KEY,
    host: process.env.NEXT_PUBLIC_POSTHOG_HOST,
  };
}
