// Feature Flag System for Gradual API Migration
// Allows safe rollout of v2 Supabase APIs with easy rollback

import { getSupabaseClient } from '@/lib/supabase';
import { auth } from '@clerk/nextjs/server';
import { useState, useEffect } from 'react';

interface FeatureFlag {
  key: string;
  enabled: boolean;
  rolloutPercentage: number;
  description: string;
  targetUsers?: string[]; // Specific user IDs
  targetTenants?: string[]; // Specific tenant IDs
}

interface FeatureFlags {
  useSupabaseAPIs: boolean;
  enableDualWrite: boolean;
  readFromSupabase: boolean;
  writeToFirebase: boolean;
  enableV2Endpoints: boolean;
}

export class FeatureFlagManager {
  private static instance: FeatureFlagManager;
  private supabase = getSupabaseClient();
  private cache = new Map<string, FeatureFlag>();
  private cacheExpiry = new Map<string, number>();
  private readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutes

  private constructor() {}

  static getInstance(): FeatureFlagManager {
    if (!FeatureFlagManager.instance) {
      FeatureFlagManager.instance = new FeatureFlagManager();
    }
    return FeatureFlagManager.instance;
  }

  async getFeatureFlags(userId?: string, tenantId?: string): Promise<FeatureFlags> {
    const flags = await Promise.all([
      this.getFlag('use_supabase_apis', userId, tenantId),
      this.getFlag('enable_dual_write', userId, tenantId),
      this.getFlag('read_from_supabase', userId, tenantId),
      this.getFlag('write_to_firebase', userId, tenantId),
      this.getFlag('enable_v2_endpoints', userId, tenantId),
    ]);

    return {
      useSupabaseAPIs: flags[0].enabled,
      enableDualWrite: flags[1].enabled,
      readFromSupabase: flags[2].enabled,
      writeToFirebase: flags[3].enabled,
      enableV2Endpoints: flags[4].enabled,
    };
  }

  private async getFlag(
    key: string, 
    userId?: string, 
    tenantId?: string
  ): Promise<FeatureFlag> {
    // Check cache first
    const cacheKey = `${key}:${userId || 'global'}:${tenantId || 'global'}`;
    const cached = this.cache.get(cacheKey);
    
    if (cached && Date.now() < (this.cacheExpiry.get(cacheKey) || 0)) {
      return cached;
    }

    try {
      // Get flag from database
      const { data: flag, error } = await this.supabase
        .from('feature_flags')
        .select('*')
        .eq('key', key)
        .single();

      if (error || !flag) {
        // Return default flag if not found
        const defaultFlag = this.getDefaultFlag(key);
        this.cache.set(cacheKey, defaultFlag);
        this.cacheExpiry.set(cacheKey, Date.now() + this.CACHE_TTL);
        return defaultFlag;
      }

      // Check if user/tenant is specifically targeted
      let enabled = flag.enabled;
      
      if (flag.target_users && userId) {
        enabled = flag.target_users.includes(userId);
      } else if (flag.target_tenants && tenantId) {
        enabled = flag.target_tenants.includes(tenantId);
      } else if (flag.rollout_percentage < 100) {
        // Use percentage-based rollout
        const hash = this.hashUser(userId || tenantId || 'anonymous');
        enabled = hash < flag.rollout_percentage;
      }

      const featureFlag: FeatureFlag = {
        key: flag.key,
        enabled,
        rolloutPercentage: flag.rollout_percentage,
        description: flag.description,
        targetUsers: flag.target_users,
        targetTenants: flag.target_tenants,
      };

      // Cache the result
      this.cache.set(cacheKey, featureFlag);
      this.cacheExpiry.set(cacheKey, Date.now() + this.CACHE_TTL);

      return featureFlag;
    } catch (error) {
      console.error('Error fetching feature flag:', error);
      return this.getDefaultFlag(key);
    }
  }

  private getDefaultFlag(key: string): FeatureFlag {
    const defaults: Record<string, FeatureFlag> = {
      'use_supabase_apis': {
        key: 'use_supabase_apis',
        enabled: false,
        rolloutPercentage: 0,
        description: 'Use Supabase APIs instead of Firebase',
      },
      'enable_dual_write': {
        key: 'enable_dual_write',
        enabled: false,
        rolloutPercentage: 0,
        description: 'Write to both Firebase and Supabase',
      },
      'read_from_supabase': {
        key: 'read_from_supabase',
        enabled: false,
        rolloutPercentage: 0,
        description: 'Read data from Supabase instead of Firebase',
      },
      'write_to_firebase': {
        key: 'write_to_firebase',
        enabled: true,
        rolloutPercentage: 100,
        description: 'Continue writing to Firebase during migration',
      },
      'enable_v2_endpoints': {
        key: 'enable_v2_endpoints',
        enabled: false,
        rolloutPercentage: 0,
        description: 'Enable v2 API endpoints',
      },
    };

    return defaults[key] || {
      key,
      enabled: false,
      rolloutPercentage: 0,
      description: 'Unknown feature flag',
    };
  }

  private hashUser(identifier: string): number {
    // Simple hash function for consistent percentage-based rollout
    let hash = 0;
    for (let i = 0; i < identifier.length; i++) {
      const char = identifier.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash) % 100;
  }

  async updateFlag(
    key: string, 
    updates: Partial<FeatureFlag>
  ): Promise<void> {
    try {
      await this.supabase
        .from('feature_flags')
        .upsert({
          key,
          ...updates,
          updated_at: new Date().toISOString(),
        });
      
      // Clear cache for this flag
      this.clearCacheForFlag(key);
    } catch (error) {
      console.error('Error updating feature flag:', error);
      throw error;
    }
  }

  async rolloutPercentage(
    key: string, 
    percentage: number
  ): Promise<void> {
    await this.updateFlag(key, { rolloutPercentage: percentage });
  }

  async enableForUsers(
    key: string, 
    userIds: string[]
  ): Promise<void> {
    await this.updateFlag(key, { 
      enabled: true, 
      targetUsers: userIds,
      rolloutPercentage: 100 
    });
  }

  async enableForTenants(
    key: string, 
    tenantIds: string[]
  ): Promise<void> {
    await this.updateFlag(key, { 
      enabled: true, 
      targetTenants: tenantIds,
      rolloutPercentage: 100 
    });
  }

  private clearCacheForFlag(key: string): void {
    for (const cacheKey of this.cache.keys()) {
      if (cacheKey.startsWith(`${key}:`)) {
        this.cache.delete(cacheKey);
        this.cacheExpiry.delete(cacheKey);
      }
    }
  }

  clearCache(): void {
    this.cache.clear();
    this.cacheExpiry.clear();
  }
}

// React hook for feature flags
export function useFeatureFlags(userId?: string, tenantId?: string) {
  const [flags, setFlags] = useState<FeatureFlags | null>(null);
  const [loading, setLoading] = useState(true);
  const manager = FeatureFlagManager.getInstance();

  useEffect(() => {
    async function loadFlags() {
      try {
        const featureFlags = await manager.getFeatureFlags(userId, tenantId);
        setFlags(featureFlags);
      } catch (error) {
        console.error('Error loading feature flags:', error);
      } finally {
        setLoading(false);
      }
    }

    loadFlags();
  }, [userId, tenantId]);

  return { flags, loading };
}

// Server-side helper for API routes
export async function getFeatureFlagsForRequest(
  request: Request
): Promise<FeatureFlags> {
  const manager = FeatureFlagManager.getInstance();
  
  try {
    const { userId } = auth();
    const tenantId = request.headers.get('x-tenant-id') || undefined;
    
    return await manager.getFeatureFlags(userId, tenantId);
  } catch (error) {
    console.error('Error getting feature flags for request:', error);
    // Return default flags if auth fails
    return manager.getFeatureFlags();
  }
}

// Migration phases configuration
export const MIGRATION_PHASES = {
  PHASE_1_DUAL_WRITE: {
    enableDualWrite: true,
    writeToFirebase: true,
    readFromSupabase: false,
    useSupabaseAPIs: false,
    enableV2Endpoints: false,
  },
  PHASE_2_READ_MIGRATION: {
    enableDualWrite: true,
    writeToFirebase: true,
    readFromSupabase: true,
    useSupabaseAPIs: false,
    enableV2Endpoints: false,
  },
  PHASE_3_WRITE_MIGRATION: {
    enableDualWrite: true,
    writeToFirebase: false,
    readFromSupabase: true,
    useSupabaseAPIs: true,
    enableV2Endpoints: true,
  },
  PHASE_4_CLEANUP: {
    enableDualWrite: false,
    writeToFirebase: false,
    readFromSupabase: true,
    useSupabaseAPIs: true,
    enableV2Endpoints: true,
  },
} as const;
