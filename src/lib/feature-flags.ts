/**
 * Feature Flags System
 * Enables/disables features dynamically without code deployment
 */

import { getSupabaseClient } from '@/lib/supabase/server';

export interface FeatureFlag {
  key: string;
  name: string;
  description: string;
  enabled: boolean;
  type: 'boolean' | 'percentage' | 'user_list' | 'tenant_list';
  value?: string | number | boolean;
  conditions?: FeatureFlagCondition[];
  createdAt: string;
  updatedAt: string;
}

export interface FeatureFlagCondition {
  type: 'user_id' | 'tenant_id' | 'email_domain' | 'subscription_plan';
  operator: 'equals' | 'not_equals' | 'in' | 'not_in';
  value: string | string[];
}

/**
 * Default feature flags
 */
export const defaultFeatureFlags: Record<string, Omit<FeatureFlag, 'createdAt' | 'updatedAt'>> = {
  // Analytics features
  advanced_analytics: {
    key: 'advanced_analytics',
    name: 'Advanced Analytics',
    description: 'Enable advanced analytics dashboard with charts and insights',
    enabled: false,
    type: 'tenant_list',
    conditions: [
      {
        type: 'subscription_plan',
        operator: 'in',
        value: ['farm', 'enterprise'],
      },
    ],
  },

  // AI features
  ai_insights: {
    key: 'ai_insights',
    name: 'AI-Powered Insights',
    description: 'Enable AI-powered insights and recommendations',
    enabled: false,
    type: 'tenant_list',
    conditions: [
      {
        type: 'subscription_plan',
        operator: 'in',
        value: ['enterprise'],
      },
    ],
  },

  // Collaboration features
  real_time_collaboration: {
    key: 'real_time_collaboration',
    name: 'Real-Time Collaboration',
    description: 'Enable real-time collaboration features',
    enabled: false,
    type: 'tenant_list',
    conditions: [
      {
        type: 'subscription_plan',
        operator: 'in',
        value: ['farm', 'enterprise'],
      },
    ],
  },

  // IoT features
  iot_integration: {
    key: 'iot_integration',
    name: 'IoT Device Integration',
    description: 'Enable IoT device integration and monitoring',
    enabled: false,
    type: 'tenant_list',
    conditions: [
      {
        type: 'subscription_plan',
        operator: 'in',
        value: ['farm', 'enterprise'],
      },
    ],
  },

  // Export features
  bulk_export: {
    key: 'bulk_export',
    name: 'Bulk Data Export',
    description: 'Enable bulk data export functionality',
    enabled: true,
    type: 'boolean',
  },

  // Import features
  bulk_import: {
    key: 'bulk_import',
    name: 'Bulk Data Import',
    description: 'Enable bulk data import functionality',
    enabled: true,
    type: 'boolean',
  },

  // Reporting features
  custom_reports: {
    key: 'custom_reports',
    name: 'Custom Reports',
    description: 'Enable custom report generation',
    enabled: false,
    type: 'tenant_list',
    conditions: [
      {
        type: 'subscription_plan',
        operator: 'in',
        value: ['professional', 'farm', 'enterprise'],
      },
    ],
  },

  // Notification features
  push_notifications: {
    key: 'push_notifications',
    name: 'Push Notifications',
    description: 'Enable push notifications',
    enabled: false,
    type: 'percentage',
    value: 10, // 10% of users
  },

  // API features
  public_api: {
    key: 'public_api',
    name: 'Public API Access',
    description: 'Enable public API access for integrations',
    enabled: false,
    type: 'tenant_list',
    conditions: [
      {
        type: 'subscription_plan',
        operator: 'in',
        value: ['enterprise'],
      },
    ],
  },

  // UI features
  dark_mode: {
    key: 'dark_mode',
    name: 'Dark Mode',
    description: 'Enable dark mode UI theme',
    enabled: true,
    type: 'boolean',
  },

  // Language features
  urdu_language: {
    key: 'urdu_language',
    name: 'Urdu Language Support',
    description: 'Enable Urdu language support',
    enabled: false,
    type: 'percentage',
    value: 50, // 50% of users
  },
};

/**
 * Check if a feature flag is enabled for a given context
 */
export async function isFeatureEnabled(
  flagKey: string,
  context?: {
    userId?: string;
    tenantId?: string;
    userEmail?: string;
    subscriptionPlan?: string;
  }
): Promise<boolean> {
  try {
    const supabase = getSupabaseClient();

    // Get feature flag from database
    const { data: flag } = await supabase
      .from('feature_flags')
      .select('*')
      .eq('key', flagKey)
      .single();

    if (!flag) {
      // Fall back to default flags
      const defaultFlag = defaultFeatureFlags[flagKey];
      if (!defaultFlag) return false;

      return evaluateFlagConditions(defaultFlag, context);
    }

    // Evaluate flag conditions
    return evaluateFlagConditions(flag, context);
  } catch (error) {
    console.error('Error checking feature flag:', error);
    return false;
  }
}

/**
 * Evaluate feature flag conditions
 */
function evaluateFlagConditions(
  flag: FeatureFlag | Omit<FeatureFlag, 'createdAt' | 'updatedAt'>,
  context?: {
    userId?: string;
    tenantId?: string;
    userEmail?: string;
    subscriptionPlan?: string;
  }
): boolean {
  // If flag is disabled, return false
  if (!flag.enabled) return false;

  // If no conditions, return enabled status
  if (!flag.conditions || flag.conditions.length === 0) {
    return flag.enabled;
  }

  // If no context provided, return false
  if (!context) return false;

  // Evaluate each condition
  for (const condition of flag.conditions) {
    const conditionMet = evaluateCondition(condition, context);

    // If any condition is met, return true
    if (conditionMet) return true;
  }

  return false;
}

/**
 * Evaluate a single condition
 */
function evaluateCondition(
  condition: FeatureFlagCondition,
  context: {
    userId?: string;
    tenantId?: string;
    userEmail?: string;
    subscriptionPlan?: string;
  }
): boolean {
  let actualValue: string | string[] | undefined;

  switch (condition.type) {
    case 'user_id':
      actualValue = context.userId;
      break;
    case 'tenant_id':
      actualValue = context.tenantId;
      break;
    case 'email_domain':
      actualValue = context.userEmail?.split('@')[1];
      break;
    case 'subscription_plan':
      actualValue = context.subscriptionPlan;
      break;
    default:
      return false;
  }

  if (!actualValue) return false;

  const expectedValue = condition.value;

  switch (condition.operator) {
    case 'equals':
      return actualValue === expectedValue;
    case 'not_equals':
      return actualValue !== expectedValue;
    case 'in':
      return Array.isArray(expectedValue) && expectedValue.includes(actualValue as string);
    case 'not_in':
      return Array.isArray(expectedValue) && !expectedValue.includes(actualValue as string);
    default:
      return false;
  }
}

/**
 * Get all feature flags for a tenant
 */
export async function getTenantFeatureFlags(tenantId: string): Promise<Record<string, boolean>> {
  try {
    const supabase = getSupabaseClient();

    // Get tenant subscription plan
    const { data: tenant } = await supabase
      .from('tenants')
      .select('subscription_plan')
      .eq('id', tenantId)
      .single();

    const subscriptionPlan = tenant?.subscription_plan || 'free';

    // Get all feature flags
    const { data: flags } = await supabase.from('feature_flags').select('*');

    const result: Record<string, boolean> = {};

    // Evaluate each flag
    for (const flag of flags || []) {
      result[flag.key] = await isFeatureEnabled(flag.key, {
        tenantId,
        subscriptionPlan,
      });
    }

    // Add default flags that aren't in database
    for (const [key, defaultFlag] of Object.entries(defaultFeatureFlags)) {
      if (!(key in result)) {
        result[key] = await isFeatureEnabled(key, {
          tenantId,
          subscriptionPlan,
        });
      }
    }

    return result;
  } catch (error) {
    console.error('Error getting tenant feature flags:', error);
    return {};
  }
}

/**
 * Create or update a feature flag
 */
export async function upsertFeatureFlag(
  flag: Omit<FeatureFlag, 'createdAt' | 'updatedAt'>
): Promise<void> {
  try {
    const supabase = getSupabaseClient();

    const { error } = await supabase
      .from('feature_flags')
      .upsert({
        ...flag,
        updated_at: new Date().toISOString(),
      })
      .eq('key', flag.key);

    if (error) {
      throw new Error('Failed to upsert feature flag');
    }
  } catch (error) {
    console.error('Error upserting feature flag:', error);
    throw error;
  }
}

/**
 * Delete a feature flag
 */
export async function deleteFeatureFlag(flagKey: string): Promise<void> {
  try {
    const supabase = getSupabaseClient();

    const { error } = await supabase.from('feature_flags').delete().eq('key', flagKey);

    if (error) {
      throw new Error('Failed to delete feature flag');
    }
  } catch (error) {
    console.error('Error deleting feature flag:', error);
    throw error;
  }
}

/**
 * Initialize default feature flags in database
 */
export async function initializeFeatureFlags(): Promise<void> {
  try {
    const supabase = getSupabaseClient();

    for (const flag of Object.values(defaultFeatureFlags)) {
      const { createdAt, updatedAt, ...flagData } = flag as any;
      await upsertFeatureFlag(flagData);
    }

    console.log('Feature flags initialized');
  } catch (error) {
    console.error('Error initializing feature flags:', error);
  }
}

/**
 * Feature flag hook for client-side
 */
export function useFeatureFlag(flagKey: string) {
  // This would be a React hook for client-side usage
  // For now, return a placeholder
  return {
    enabled: false,
    loading: false,
  };
}

/**
 * Feature flag utility for server components
 */
export async function withFeatureFlag<T>(
  flagKey: string,
  enabledFn: () => Promise<T>,
  disabledFn?: () => Promise<T>
): Promise<T> {
  const isEnabled = await isFeatureEnabled(flagKey);

  if (isEnabled) {
    return enabledFn();
  }

  if (disabledFn) {
    return disabledFn();
  }

  throw new Error(`Feature ${flagKey} is not enabled`);
}
