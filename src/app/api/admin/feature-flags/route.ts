import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { z } from 'zod';
import {
  ENTERPRISE_FEATURE_FLAGS,
  EnterpriseFeatureFlag,
  DEFAULT_FEATURE_FLAGS,
  getRolloutStats,
  clearFeatureFlagCache,
} from '@/lib/feature-flags/service';
import { isPlatformSuperAdmin } from '@/lib/admin/require-super-admin';
// Validation schemas
const updateFeatureFlagSchema = z.object({
  featureKey: z.enum(Object.values(ENTERPRISE_FEATURE_FLAGS) as [EnterpriseFeatureFlag]),
  enabled: z.boolean(),
  rolloutPercentage: z.number().min(0).max(100).optional(),
  targetRoles: z.array(z.string()).optional(),
  targetTenants: z.array(z.string()).optional(),
  metadata: z.record(z.any()).optional(),
});
const bulkUpdateSchema = z.object({
  updates: z.array(updateFeatureFlagSchema),
});

async function requireAdmin(): Promise<boolean> {
  const { userId } = await auth();
  if (!userId) return false;
  return isPlatformSuperAdmin(userId);
}

// GET /api/admin/feature-flags - List all feature flags and their status
export async function GET(request: NextRequest) {
  try {
    const isAdmin = await requireAdmin();
    if (!isAdmin) {
      return NextResponse.json({ success: false, error: 'Admin access required' }, { status: 403 });
    }
    const { searchParams } = new URL(request.url);
    const phase = searchParams.get('phase') as 'phase_1' | 'phase_2' | 'phase_3' | null;
    const enabled = searchParams.get('enabled');
    let features = Object.entries(DEFAULT_FEATURE_FLAGS).map(([featureKey, config]) => ({
      ...config,
      // Check current environment overrides
      currentEnabled:
        process.env[`FEATURE_${featureKey.toUpperCase()}`] === 'true' || config.enabled,
    }));
    // Filter by phase if specified
    if (phase) {
      const { PHASE_ROLLOUT_ORDER } = require('@/lib/feature-flags/config');
      features = features.filter(f =>
        PHASE_ROLLOUT_ORDER[phase].includes(f.key as EnterpriseFeatureFlag)
      );
    }
    // Filter by enabled status if specified
    if (enabled === 'true') {
      features = features.filter(f => f.currentEnabled);
    } else if (enabled === 'false') {
      features = features.filter(f => !f.currentEnabled);
    }
    const stats = getRolloutStats();
    return NextResponse.json({
      success: true,
      data: {
        features,
        stats,
        environment: process.env.NODE_ENV,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
// PUT /api/admin/feature-flags - Update feature flag configuration
export async function PUT(request: NextRequest) {
  try {
    // Check if user is super admin
    const isAdmin = await requireAdmin();
    if (!isAdmin) {
      return NextResponse.json({ success: false, error: 'Admin access required' }, { status: 403 });
    }
    const body = await request.json();
    const validatedData = updateFeatureFlagSchema.parse(body);
    // In-memory / env-based flags for now; log for audit
    const auditLogId = `feature_flag_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    console.log('Feature flag update:', {
      id: auditLogId,
      featureKey: validatedData.featureKey,
      changes: validatedData,
      timestamp: new Date().toISOString(),
    });
    // Clear cache to ensure changes take effect
    clearFeatureFlagCache();
    return NextResponse.json({
      success: true,
      data: {
        featureKey: validatedData.featureKey,
        updated: true,
        changes: validatedData,
      },
      message: 'Feature flag updated successfully',
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'Validation failed', details: error.errors },
        { status: 400 }
      );
    }
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
// POST /api/admin/feature-flags/bulk - Bulk update multiple feature flags
export async function POST(request: NextRequest) {
  try {
    // Check if user is super admin
    const isAdmin = await requireAdmin();
    if (!isAdmin) {
      return NextResponse.json({ success: false, error: 'Admin access required' }, { status: 403 });
    }
    const body = await request.json();
    const validatedData = bulkUpdateSchema.parse(body);
    const results = [];
    for (const update of validatedData.updates) {
      try {
        // TODO: Implement proper database updates and audit logging
        console.log('Bulk feature flag update:', {
          featureKey: update.featureKey,
          changes: update,
          timestamp: new Date().toISOString(),
        });
        results.push({
          featureKey: update.featureKey,
          success: true,
        });
      } catch (error) {
        results.push({
          featureKey: update.featureKey,
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }
    // Clear cache to ensure changes take effect
    clearFeatureFlagCache();
    return NextResponse.json({
      success: true,
      data: {
        results,
        total: validatedData.updates.length,
        successful: results.filter(r => r.success).length,
        failed: results.filter(r => !r.success).length,
      },
      message: `Processed ${validatedData.updates.length} feature flag updates`,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'Validation failed', details: error.errors },
        { status: 400 }
      );
    }
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
// DELETE /api/admin/feature-flags - Reset feature flag to default
// Note: featureKey should be passed as query param since this route doesn't have [featureKey] segment
export async function DELETE(request: NextRequest) {
  try {
    // Check if user is super admin
    const isAdmin = await requireAdmin();
    if (!isAdmin) {
      return NextResponse.json({ success: false, error: 'Admin access required' }, { status: 403 });
    }
    const { searchParams } = new URL(request.url);
    const featureKey = searchParams.get('featureKey');
    if (!featureKey) {
      return NextResponse.json(
        { success: false, error: 'featureKey query param required' },
        { status: 400 }
      );
    }
    // Validate feature key
    if (!Object.values(ENTERPRISE_FEATURE_FLAGS).includes(featureKey as EnterpriseFeatureFlag)) {
      return NextResponse.json({ success: false, error: 'Invalid feature key' }, { status: 400 });
    }
    // TODO: Implement proper database reset and audit logging
    console.log('Feature flag reset:', {
      featureKey,
      resetToDefault: true,
      timestamp: new Date().toISOString(),
    });
    // Clear cache to ensure changes take effect
    clearFeatureFlagCache();
    return NextResponse.json({
      success: true,
      data: {
        featureKey,
        reset: true,
      },
      message: 'Feature flag reset to default successfully',
    });
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
