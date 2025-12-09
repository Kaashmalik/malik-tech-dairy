import crypto from 'crypto';
import {
  DEFAULT_FEATURE_FLAGS,
  EnterpriseFeatureFlag,
  ENTERPRISE_FEATURE_FLAGS,
  FeatureFlag,
} from './config';

// Environment variable feature flags (override defaults)
const ENV_FEATURE_FLAGS: Partial<Record<EnterpriseFeatureFlag, boolean>> = {
  // Read from environment variables - format: FEATURE_VETERINARY_DISEASE_MANAGEMENT=true
  [ENTERPRISE_FEATURE_FLAGS.VETERINARY_DISEASE_MANAGEMENT]:
    process.env.FEATURE_VETERINARY_DISEASE_MANAGEMENT === 'true',
  [ENTERPRISE_FEATURE_FLAGS.VETERINARY_TREATMENT_TRACKING]:
    process.env.FEATURE_VETERINARY_TREATMENT_TRACKING === 'true',
  [ENTERPRISE_FEATURE_FLAGS.VETERINARY_VACCINATION_SCHEDULES]:
    process.env.FEATURE_VETERINARY_VACCINATION_SCHEDULES === 'true',
  [ENTERPRISE_FEATURE_FLAGS.FEED_INVENTORY_TRACKING]:
    process.env.FEATURE_FEED_INVENTORY_TRACKING === 'true',
  [ENTERPRISE_FEATURE_FLAGS.FEED_SCHEDULE_AUTOMATION]:
    process.env.FEATURE_FEED_SCHEDULE_AUTOMATION === 'true',
  [ENTERPRISE_FEATURE_FLAGS.NUTRITION_TEMPLATES]:
    process.env.FEATURE_NUTRITION_TEMPLATES === 'true',
  [ENTERPRISE_FEATURE_FLAGS.STAFF_ATTENDANCE_TRACKING]:
    process.env.FEATURE_STAFF_ATTENDANCE_TRACKING === 'true',
  [ENTERPRISE_FEATURE_FLAGS.TASK_ASSIGNMENT_SYSTEM]:
    process.env.FEATURE_TASK_ASSIGNMENT_SYSTEM === 'true',
  [ENTERPRISE_FEATURE_FLAGS.PERFORMANCE_REVIEWS]:
    process.env.FEATURE_PERFORMANCE_REVIEWS === 'true',
  [ENTERPRISE_FEATURE_FLAGS.IOT_DEVICE_MANAGEMENT]:
    process.env.FEATURE_IOT_DEVICE_MANAGEMENT === 'true',
  [ENTERPRISE_FEATURE_FLAGS.SENSOR_DATA_INGESTION]:
    process.env.FEATURE_SENSOR_DATA_INGESTION === 'true',
  [ENTERPRISE_FEATURE_FLAGS.REAL_TIME_MONITORING]:
    process.env.FEATURE_REAL_TIME_MONITORING === 'true',
  [ENTERPRISE_FEATURE_FLAGS.MILK_QUALITY_TESTING]:
    process.env.FEATURE_MILK_QUALITY_TESTING === 'true',
  [ENTERPRISE_FEATURE_FLAGS.QUALITY_GRADING_SYSTEM]:
    process.env.FEATURE_QUALITY_GRADING_SYSTEM === 'true',
  [ENTERPRISE_FEATURE_FLAGS.ADULTERATION_DETECTION]:
    process.env.FEATURE_ADULTERATION_DETECTION === 'true',
  [ENTERPRISE_FEATURE_FLAGS.AI_PREDICTIVE_ANALYTICS]:
    process.env.FEATURE_AI_PREDICTIVE_ANALYTICS === 'true',
  [ENTERPRISE_FEATURE_FLAGS.PRODUCTION_FORECASTING]:
    process.env.FEATURE_PRODUCTION_FORECASTING === 'true',
  [ENTERPRISE_FEATURE_FLAGS.HEALTH_MONITORING_AI]:
    process.env.FEATURE_HEALTH_MONITORING_AI === 'true',
  [ENTERPRISE_FEATURE_FLAGS.DASHBOARD_REDESIGN]: process.env.FEATURE_DASHBOARD_REDESIGN === 'true',
  [ENTERPRISE_FEATURE_FLAGS.MOBILE_RESPONSIVE_UI]:
    process.env.FEATURE_MOBILE_RESPONSIVE_UI === 'true',
  [ENTERPRISE_FEATURE_FLAGS.DARK_MODE_SUPPORT]: process.env.FEATURE_DARK_MODE_SUPPORT === 'true',
  [ENTERPRISE_FEATURE_FLAGS.COMPLIANCE_REPORTING]:
    process.env.FEATURE_COMPLIANCE_REPORTING === 'true',
  [ENTERPRISE_FEATURE_FLAGS.AUDIT_LOG_ENHANCEMENT]:
    process.env.FEATURE_AUDIT_LOG_ENHANCEMENT === 'true',
  [ENTERPRISE_FEATURE_FLAGS.DATA_EXPORT_FEATURES]:
    process.env.FEATURE_DATA_EXPORT_FEATURES === 'true',
};

// Cache for feature flag evaluations (simple in-memory cache)
const featureFlagCache = new Map<string, boolean>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes
const cacheTimestamps = new Map<string, number>();

/**
 * Consistent hash function for percentage-based rollouts
 * Ensures the same user always gets the same result for a given feature
 */
function consistentHash(userId: string, featureKey: string): number {
  const hash = crypto.createHash('sha256');
  hash.update(`${userId}:${featureKey}`);
  const hex = hash.digest('hex');
  // Convert first 8 characters to a number between 0-99
  return parseInt(hex.substring(0, 8), 16) % 100;
}

/**
 * Check if a feature is enabled for a specific user/tenant
 */
export function isFeatureEnabled(
  featureKey: EnterpriseFeatureFlag,
  context: {
    userId?: string;
    tenantId?: string;
    userRole?: string;
  } = {}
): boolean {
  const cacheKey = `${featureKey}:${context.userId || 'anonymous'}:${context.tenantId || 'no-tenant'}:${context.userRole || 'no-role'}`;

  // Check cache first
  const cached = featureFlagCache.get(cacheKey);
  const cacheTime = cacheTimestamps.get(cacheKey);

  if (cached !== undefined && cacheTime && Date.now() - cacheTime < CACHE_TTL) {
    return cached;
  }

  // Get feature flag configuration
  const defaultConfig = DEFAULT_FEATURE_FLAGS[featureKey];
  const envOverride = ENV_FEATURE_FLAGS[featureKey];

  let featureConfig: FeatureFlag;

  if (envOverride !== undefined) {
    // Environment variable override
    featureConfig = {
      ...defaultConfig,
      enabled: envOverride,
    };
  } else {
    featureConfig = defaultConfig;
  }

  // Check if feature is globally enabled
  if (!featureConfig.enabled) {
    const result = false;
    featureFlagCache.set(cacheKey, result);
    cacheTimestamps.set(cacheKey, Date.now());
    return result;
  }

  // Check role-based targeting
  if (featureConfig.targetRoles && context.userRole) {
    if (!featureConfig.targetRoles.includes(context.userRole)) {
      const result = false;
      featureFlagCache.set(cacheKey, result);
      cacheTimestamps.set(cacheKey, Date.now());
      return result;
    }
  }

  // Check tenant-based targeting
  if (featureConfig.targetTenants && context.tenantId) {
    if (!featureConfig.targetTenants.includes(context.tenantId)) {
      const result = false;
      featureFlagCache.set(cacheKey, result);
      cacheTimestamps.set(cacheKey, Date.now());
      return result;
    }
  }

  // Check percentage-based rollout
  if (featureConfig.rolloutPercentage < 100 && context.userId) {
    const hashValue = consistentHash(context.userId, featureKey);
    if (hashValue >= featureConfig.rolloutPercentage) {
      const result = false;
      featureFlagCache.set(cacheKey, result);
      cacheTimestamps.set(cacheKey, Date.now());
      return result;
    }
  }

  // Feature is enabled
  const result = true;
  featureFlagCache.set(cacheKey, result);
  cacheTimestamps.set(cacheKey, Date.now());
  return result;
}

/**
 * Get all enabled features for a user context
 */
export function getEnabledFeatures(context: {
  userId?: string;
  tenantId?: string;
  userRole?: string;
}): EnterpriseFeatureFlag[] {
  return Object.values(ENTERPRISE_FEATURE_FLAGS).filter(featureKey =>
    isFeatureEnabled(featureKey, context)
  );
}

/**
 * Get feature flag configuration
 */
export function getFeatureConfig(featureKey: EnterpriseFeatureFlag): FeatureFlag {
  const envOverride = ENV_FEATURE_FLAGS[featureKey];
  const defaultConfig = DEFAULT_FEATURE_FLAGS[featureKey];

  if (envOverride !== undefined) {
    return {
      ...defaultConfig,
      enabled: envOverride,
    };
  }

  return defaultConfig;
}

/**
 * Check if any features in a phase are enabled
 */
export function isPhaseEnabled(
  phase: 'phase_1' | 'phase_2' | 'phase_3',
  context: {
    userId?: string;
    tenantId?: string;
    userRole?: string;
  } = {}
): boolean {
  const { PHASE_ROLLOUT_ORDER } = require('./config');
  const phaseFeatures = PHASE_ROLLOUT_ORDER[phase];

  return phaseFeatures.some(featureKey => isFeatureEnabled(featureKey, context));
}

/**
 * Clear feature flag cache (useful for testing or admin changes)
 */
export function clearFeatureFlagCache(): void {
  featureFlagCache.clear();
  cacheTimestamps.clear();
}

/**
 * Get rollout statistics for monitoring
 */
export function getRolloutStats(): {
  totalFeatures: number;
  enabledFeatures: number;
  phaseStats: Record<string, { total: number; enabled: number }>;
} {
  const totalFeatures = Object.values(ENTERPRISE_FEATURE_FLAGS).length;
  const enabledFeatures = Object.values(ENTERPRISE_FEATURE_FLAGS).filter(key => {
    const config = DEFAULT_FEATURE_FLAGS[key];
    const envOverride = ENV_FEATURE_FLAGS[key];
    return envOverride !== undefined ? envOverride : config.enabled;
  }).length;

  const { PHASE_ROLLOUT_ORDER } = require('./config');

  const phaseStats: Record<string, { total: number; enabled: number }> = {};

  Object.entries(PHASE_ROLLOUT_ORDER).forEach(([phase, features]) => {
    const phaseEnabled = features.filter(key => {
      const config = DEFAULT_FEATURE_FLAGS[key];
      const envOverride = ENV_FEATURE_FLAGS[key];
      return envOverride !== undefined ? envOverride : config.enabled;
    }).length;

    phaseStats[phase] = {
      total: features.length,
      enabled: phaseEnabled,
    };
  });

  return {
    totalFeatures,
    enabledFeatures,
    phaseStats,
  };
}

/**
 * Middleware helper to extract user context from request
 */
export function extractUserContext(request: Request): {
  userId?: string;
  tenantId?: string;
  userRole?: string;
} {
  // This would typically extract from Clerk session or JWT
  // For now, return empty context - will be implemented with proper auth integration
  return {};
}

/**
 * API route protection helper
 */
export function requireFeature(featureKey: EnterpriseFeatureFlag) {
  return (context: { userId?: string; tenantId?: string; userRole?: string }) => {
    if (!isFeatureEnabled(featureKey, context)) {
      throw new Error(`Feature ${featureKey} is not enabled`);
    }
  };
}

/**
 * Development helper to enable all features for testing
 */
export function enableAllFeaturesForDev(): void {
  if (process.env.NODE_ENV === 'development') {
    Object.values(ENTERPRISE_FEATURE_FLAGS).forEach(key => {
      ENV_FEATURE_FLAGS[key] = true;
    });
    clearFeatureFlagCache();
  }
}
