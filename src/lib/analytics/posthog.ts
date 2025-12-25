// PostHog Analytics Utilities for MTK Dairy
// Enhanced event tracking for subscription funnels, IoT usage, and user behavior
import posthog from 'posthog-js';
// ============================================================================
// Event Names (Consistent naming convention)
// ============================================================================
export const ANALYTICS_EVENTS = {
  // Authentication & Onboarding
  USER_SIGNED_UP: 'user_signed_up',
  USER_SIGNED_IN: 'user_signed_in',
  USER_SIGNED_OUT: 'user_signed_out',
  FARM_APPLICATION_STARTED: 'farm_application_started',
  FARM_APPLICATION_SUBMITTED: 'farm_application_submitted',
  FARM_APPLICATION_APPROVED: 'farm_application_approved',
  FARM_APPLICATION_REJECTED: 'farm_application_rejected',
  FARM_SELECTED: 'farm_selected',
  // Subscription & Billing
  SUBSCRIPTION_VIEWED: 'subscription_viewed',
  PLAN_SELECTED: 'plan_selected',
  PAYMENT_STARTED: 'payment_started',
  PAYMENT_COMPLETED: 'payment_completed',
  PAYMENT_FAILED: 'payment_failed',
  SUBSCRIPTION_UPGRADED: 'subscription_upgraded',
  SUBSCRIPTION_DOWNGRADED: 'subscription_downgraded',
  SUBSCRIPTION_CANCELLED: 'subscription_cancelled',
  // Animal Management
  ANIMAL_CREATED: 'animal_created',
  ANIMAL_UPDATED: 'animal_updated',
  ANIMAL_DELETED: 'animal_deleted',
  ANIMAL_PHOTO_UPLOADED: 'animal_photo_uploaded',
  ANIMAL_BULK_IMPORTED: 'animal_bulk_imported',
  // Milk Logging
  MILK_LOG_CREATED: 'milk_log_created',
  MILK_LOG_BULK_CREATED: 'milk_log_bulk_created',
  MILK_PREDICTION_VIEWED: 'milk_prediction_viewed',
  // Health & Breeding
  HEALTH_RECORD_CREATED: 'health_record_created',
  VACCINATION_SCHEDULED: 'vaccination_scheduled',
  BREEDING_RECORD_CREATED: 'breeding_record_created',
  HEAT_ALERT_RECEIVED: 'heat_alert_received',
  // Financial
  EXPENSE_RECORDED: 'expense_recorded',
  SALE_RECORDED: 'sale_recorded',
  REPORT_GENERATED: 'report_generated',
  REPORT_EXPORTED: 'report_exported',
  // IoT Integration
  IOT_DEVICE_CONNECTED: 'iot_device_connected',
  IOT_DEVICE_DISCONNECTED: 'iot_device_disconnected',
  IOT_DATA_RECEIVED: 'iot_data_received',
  IOT_ALERT_TRIGGERED: 'iot_alert_triggered',
  // Feature Usage
  FEATURE_USED: 'feature_used',
  SEARCH_PERFORMED: 'search_performed',
  FILTER_APPLIED: 'filter_applied',
  DASHBOARD_VIEWED: 'dashboard_viewed',
  SETTINGS_CHANGED: 'settings_changed',
  LANGUAGE_CHANGED: 'language_changed',
  // Errors
  ERROR_OCCURRED: 'error_occurred',
  API_ERROR: 'api_error',
} as const;
export type AnalyticsEvent = (typeof ANALYTICS_EVENTS)[keyof typeof ANALYTICS_EVENTS];
// ============================================================================
// Property Types
// ============================================================================
interface BaseEventProperties {
  timestamp?: string;
  source?: 'web' | 'api' | 'iot' | 'cron';
}
interface AnimalEventProperties extends BaseEventProperties {
  animalId?: string;
  species?: string;
  count?: number;
}
interface SubscriptionEventProperties extends BaseEventProperties {
  plan?: string;
  previousPlan?: string;
  amount?: number;
  currency?: string;
  gateway?: string;
}
interface IoTEventProperties extends BaseEventProperties {
  deviceId?: string;
  deviceType?: string;
  dataType?: string;
}
interface ErrorEventProperties extends BaseEventProperties {
  errorCode?: string;
  errorMessage?: string;
  endpoint?: string;
  statusCode?: number;
}
type EventProperties =
  | AnimalEventProperties
  | SubscriptionEventProperties
  | IoTEventProperties
  | ErrorEventProperties
  | BaseEventProperties
  | Record<string, unknown>;
// ============================================================================
// Analytics Functions
// ============================================================================
/**
 * Track a custom event
 */
export function trackEvent(eventName: AnalyticsEvent | string, properties?: EventProperties): void {
  try {
    if (typeof window !== 'undefined' && posthog) {
      posthog.capture(eventName, {
        ...properties,
        timestamp: properties?.timestamp || new Date().toISOString(),
      });
    }
  } catch (error) {
  }
}
/**
 * Identify a user
 */
export function identifyUser(
  userId: string,
  traits?: {
    email?: string;
    name?: string;
    tenantId?: string;
    role?: string;
    plan?: string;
  }
): void {
  try {
    if (typeof window !== 'undefined' && posthog) {
      posthog.identify(userId, traits);
    }
  } catch (error) {
  }
}
/**
 * Set user group (tenant/organization)
 */
export function setUserGroup(
  groupType: 'tenant' | 'organization',
  groupId: string,
  traits?: {
    name?: string;
    plan?: string;
    animalCount?: number;
    userCount?: number;
  }
): void {
  try {
    if (typeof window !== 'undefined' && posthog) {
      posthog.group(groupType, groupId, traits);
    }
  } catch (error) {
  }
}
/**
 * Reset analytics (on logout)
 */
export function resetAnalytics(): void {
  try {
    if (typeof window !== 'undefined' && posthog) {
      posthog.reset();
    }
  } catch (error) {
  }
}
/**
 * Track page view
 */
export function trackPageView(pageName?: string, properties?: Record<string, unknown>): void {
  try {
    if (typeof window !== 'undefined' && posthog) {
      posthog.capture('$pageview', {
        page_name: pageName,
        ...properties,
      });
    }
  } catch (error) {
  }
}
/**
 * Track subscription funnel step
 */
export function trackSubscriptionFunnel(
  step: 'viewed' | 'selected' | 'payment_started' | 'completed' | 'failed',
  properties: SubscriptionEventProperties
): void {
  const eventMap = {
    viewed: ANALYTICS_EVENTS.SUBSCRIPTION_VIEWED,
    selected: ANALYTICS_EVENTS.PLAN_SELECTED,
    payment_started: ANALYTICS_EVENTS.PAYMENT_STARTED,
    completed: ANALYTICS_EVENTS.PAYMENT_COMPLETED,
    failed: ANALYTICS_EVENTS.PAYMENT_FAILED,
  };
  trackEvent(eventMap[step], {
    ...properties,
    funnel_step: step,
  });
}
/**
 * Track feature usage
 */
export function trackFeatureUsage(featureName: string, properties?: Record<string, unknown>): void {
  trackEvent(ANALYTICS_EVENTS.FEATURE_USED, {
    feature_name: featureName,
    ...properties,
  });
}
/**
 * Track API error for monitoring
 */
export function trackApiError(endpoint: string, statusCode: number, errorMessage: string): void {
  trackEvent(ANALYTICS_EVENTS.API_ERROR, {
    endpoint,
    statusCode,
    errorMessage,
    source: 'api',
  });
}