'use server';

import { auth } from '@clerk/nextjs/server';
import { 
  isFeatureEnabled, 
  getEnabledFeatures, 
  getFeatureConfig,
  EnterpriseFeatureFlag,
  ENTERPRISE_FEATURE_FLAGS 
} from '@/lib/feature-flags/service';

/**
 * Server-side hook to check if a feature is enabled
 * Use in Server Components and Route Handlers
 */
export async function checkFeature(featureKey: EnterpriseFeatureFlag): Promise<boolean> {
  try {
    const { userId } = auth();
    const { orgId } = auth();
    
    // Get user role from session or database
    // TODO: Implement proper role extraction
    const userRole = 'farm_owner'; // Placeholder
    
    const context = {
      userId: userId || undefined,
      tenantId: orgId || undefined,
      userRole,
    };
    
    return isFeatureEnabled(featureKey, context);
  } catch (error) {
    console.error(`Error checking feature ${featureKey}:`, error);
    return false; // Fail-safe: default to disabled
  }
}

/**
 * Server-side hook to get all enabled features
 */
export async function getServerEnabledFeatures(): Promise<EnterpriseFeatureFlag[]> {
  try {
    const { userId } = auth();
    const { orgId } = auth();
    
    const userRole = 'farm_owner'; // Placeholder
    
    const context = {
      userId: userId || undefined,
      tenantId: orgId || undefined,
      userRole,
    };
    
    return getEnabledFeatures(context);
  } catch (error) {
    console.error('Error getting enabled features:', error);
    return [];
  }
}

/**
 * Server-side hook to get feature configuration
 */
export async function getServerFeatureConfig(featureKey: EnterpriseFeatureFlag) {
  try {
    return getFeatureConfig(featureKey);
  } catch (error) {
    console.error(`Error getting feature config ${featureKey}:`, error);
    return null;
  }
}

/**
 * Check if any features in a phase are enabled
 */
export async function checkPhaseEnabled(phase: 'phase_1' | 'phase_2' | 'phase_3'): Promise<boolean> {
  try {
    const { userId } = auth();
    const { orgId } = auth();
    
    const userRole = 'farm_owner'; // Placeholder
    
    const context = {
      userId: userId || undefined,
      tenantId: orgId || undefined,
      userRole,
    };
    
    const { isPhaseEnabled } = require('@/lib/feature-flags/service');
    return isPhaseEnabled(phase, context);
  } catch (error) {
    console.error(`Error checking phase ${phase}:`, error);
    return false;
  }
}

/**
 * Component wrapper for conditional rendering based on feature flags
 * Use in Server Components
 */
export async function FeatureFlagWrapper({
  featureKey,
  children,
  fallback = null,
}: {
  featureKey: EnterpriseFeatureFlag;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}) {
  const isEnabled = await checkFeature(featureKey);
  
  if (isEnabled) {
    return <>{children}</>;
  }
  
  return <>{fallback}</>;
}

/**
 * Phase-based component wrapper
 */
export async function PhaseWrapper({
  phase,
  children,
  fallback = null,
}: {
  phase: 'phase_1' | 'phase_2' | 'phase_3';
  children: React.ReactNode;
  fallback?: React.ReactNode;
}) {
  const isEnabled = await checkPhaseEnabled(phase);
  
  if (isEnabled) {
    return <>{children}</>;
  }
  
  return <>{fallback}</>;
}

/**
 * Multiple feature wrapper (requires any of the specified features)
 */
export async function AnyFeatureWrapper({
  featureKeys,
  children,
  fallback = null,
}: {
  featureKeys: EnterpriseFeatureFlag[];
  children: React.ReactNode;
  fallback?: React.ReactNode;
}) {
  const enabledFeatures = await getServerEnabledFeatures();
  const hasAnyFeature = featureKeys.some(key => enabledFeatures.includes(key));
  
  if (hasAnyFeature) {
    return <>{children}</>;
  }
  
  return <>{fallback}</>;
}

/**
 * Multiple feature wrapper (requires all specified features)
 */
export async function AllFeaturesWrapper({
  featureKeys,
  children,
  fallback = null,
}: {
  featureKeys: EnterpriseFeatureFlag[];
  children: React.ReactNode;
  fallback?: React.ReactNode;
}) {
  const enabledFeatures = await getServerEnabledFeatures();
  const hasAllFeatures = featureKeys.every(key => enabledFeatures.includes(key));
  
  if (hasAllFeatures) {
    return <>{children}</>;
  }
  
  return <>{fallback}</>;
}

/**
 * Hook for feature flag analytics and monitoring
 */
export async function getFeatureAnalytics() {
  try {
    const enabledFeatures = await getServerEnabledFeatures();
    const { getRolloutStats } = require('@/lib/feature-flags/service');
    const rolloutStats = getRolloutStats();
    
    return {
      userEnabledFeatures: enabledFeatures,
      totalUserFeatures: enabledFeatures.length,
      rolloutStats,
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    console.error('Error getting feature analytics:', error);
    return null;
  }
}

/**
 * Server-side navigation guard for feature-based routes
 */
export async function requireServerFeature(featureKey: EnterpriseFeatureFlag) {
  const isEnabled = await checkFeature(featureKey);
  
  if (!isEnabled) {
    throw new Error(`Feature ${featureKey} is not enabled`);
  }
  
  return true;
}

/**
 * Feature flag data fetching helper
 * Fetches data only if feature is enabled
 */
export async function fetchWithFeature<T>(
  featureKey: EnterpriseFeatureFlag,
  fetcher: () => Promise<T>,
  fallbackValue?: T
): Promise<T | undefined> {
  try {
    const isEnabled = await checkFeature(featureKey);
    
    if (!isEnabled) {
      return fallbackValue;
    }
    
    return await fetcher();
  } catch (error) {
    console.error(`Error in fetchWithFeature for ${featureKey}:`, error);
    return fallbackValue;
  }
}

/**
 * Feature-aware API client helper
 */
export async function featureAwareFetch<T>(
  featureKey: EnterpriseFeatureFlag,
  url: string,
  options?: RequestInit,
  fallbackValue?: T
): Promise<T | undefined> {
  return fetchWithFeature(featureKey, async () => {
    const response = await fetch(url, options);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    return response.json();
  }, fallbackValue);
}

/**
 * Export all feature flag constants for easy import in components
 */
export {
  ENTERPRISE_FEATURE_FLAGS,
  EnterpriseFeatureFlag,
} from '@/lib/feature-flags/service';
