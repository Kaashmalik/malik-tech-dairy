import { NextRequest, NextResponse } from 'next/server';
import { extractUserContext, isFeatureEnabled, EnterpriseFeatureFlag } from '@/lib/feature-flags/service';

// Extend NextRequest to include feature flag context
declare global {
  interface Request {
    featureContext?: {
      userId?: string;
      tenantId?: string;
      userRole?: string;
      enabledFeatures: EnterpriseFeatureFlag[];
    };
  }
}

/**
 * Middleware to add feature flag context to requests
 * Does NOT block requests - just adds context for route handlers to use
 */
export async function featureFlagMiddleware(request: NextRequest) {
  try {
    // Extract user context from auth headers or session
    const userContext = extractUserContext(request);
    
    // Add feature context to request
    (request as any).featureContext = {
      ...userContext,
      enabledFeatures: [], // Will be populated on demand
    };

    return NextResponse.next();
  } catch (error) {
    // On any error, continue without feature context (fail-safe)
    console.error('Feature flag middleware error:', error);
    return NextResponse.next();
  }
}

/**
 * Helper to get feature context from request
 */
export function getFeatureContext(request: NextRequest) {
  return (request as any).featureContext || {};
}

/**
 * Check if a feature is enabled for the current request
 */
export function isRequestFeatureEnabled(
  request: NextRequest,
  featureKey: EnterpriseFeatureFlag
): boolean {
  const context = getFeatureContext(request);
  return isFeatureEnabled(featureKey, context);
}

/**
 * Get all enabled features for the current request
 */
export function getRequestEnabledFeatures(request: NextRequest): EnterpriseFeatureFlag[] {
  const context = getFeatureContext(request);
  const { getEnabledFeatures } = require('@/lib/feature-flags/service');
  return getEnabledFeatures(context);
}

/**
 * API route wrapper that adds feature flag checking
 * Usage: export const GET = withFeatureFlag('veterinary_disease_management', async (req, ctx) => { ... });
 */
export function withFeatureFlag<T extends any[]>(
  featureKey: EnterpriseFeatureFlag,
  handler: (request: NextRequest, context: any, ...args: T) => Promise<NextResponse>
) {
  return async (request: NextRequest, ...args: T): Promise<NextResponse> => {
    try {
      // Check if feature is enabled
      const context = getFeatureContext(request);
      if (!isFeatureEnabled(featureKey, context)) {
        return NextResponse.json(
          { 
            success: false, 
            error: 'Feature not available',
            featureKey,
            message: `Feature ${featureKey} is not enabled for your account`
          },
          { status: 403 }
        );
      }

      // Call the original handler with enhanced context
      return await handler(request, { ...context, featureKey }, ...args);
    } catch (error) {
      console.error(`Feature flag error for ${featureKey}:`, error);
      
      // Fail-safe: return feature not available on errors
      return NextResponse.json(
        { 
          success: false, 
          error: 'Feature temporarily unavailable',
          featureKey
        },
        { status: 503 }
      );
    }
  };
}

/**
 * Multiple feature flag checker
 * Usage: withAnyFeature(['feature1', 'feature2'], handler) - requires at least one
 * Usage: withAllFeatures(['feature1', 'feature2'], handler) - requires all
 */
export function withAnyFeature<T extends any[]>(
  featureKeys: EnterpriseFeatureFlag[],
  handler: (request: NextRequest, context: any, ...args: T) => Promise<NextResponse>
) {
  return async (request: NextRequest, ...args: T): Promise<NextResponse> => {
    try {
      const context = getFeatureContext(request);
      const enabledFeatures = featureKeys.filter(key => isFeatureEnabled(key, context));
      
      if (enabledFeatures.length === 0) {
        return NextResponse.json(
          { 
            success: false, 
            error: 'No required features available',
            requiredFeatures: featureKeys,
            message: 'None of the required features are enabled for your account'
          },
          { status: 403 }
        );
      }

      return await handler(request, { 
        ...context, 
        enabledFeatures,
        requiredFeatures: featureKeys 
      }, ...args);
    } catch (error) {
      console.error('Multiple feature flag error:', error);
      return NextResponse.json(
        { 
          success: false, 
          error: 'Features temporarily unavailable',
          requiredFeatures: featureKeys
        },
        { status: 503 }
      );
    }
  };
}

export function withAllFeatures<T extends any[]>(
  featureKeys: EnterpriseFeatureFlag[],
  handler: (request: NextRequest, context: any, ...args: T) => Promise<NextResponse>
) {
  return async (request: NextRequest, ...args: T): Promise<NextResponse> => {
    try {
      const context = getFeatureContext(request);
      const disabledFeatures = featureKeys.filter(key => !isFeatureEnabled(key, context));
      
      if (disabledFeatures.length > 0) {
        return NextResponse.json(
          { 
            success: false, 
            error: 'Some required features not available',
            disabledFeatures,
            message: `${disabledFeatures.length} feature(s) are not enabled for your account`
          },
          { status: 403 }
        );
      }

      return await handler(request, { 
        ...context, 
        enabledFeatures: featureKeys,
        requiredFeatures: featureKeys 
      }, ...args);
    } catch (error) {
      console.error('Multiple feature flag error:', error);
      return NextResponse.json(
        { 
          success: false, 
          error: 'Features temporarily unavailable',
          requiredFeatures: featureKeys
        },
        { status: 503 }
      );
    }
  };
}

/**
 * Tenant-aware feature flag checker
 * Ensures tenant isolation is maintained
 */
export function withTenantFeature<T extends any[]>(
  featureKey: EnterpriseFeatureFlag,
  handler: (request: NextRequest, context: any, ...args: T) => Promise<NextResponse>
) {
  return async (request: NextRequest, ...args: T): Promise<NextResponse> => {
    try {
      const context = getFeatureContext(request);
      
      // Ensure tenant context exists
      if (!context.tenantId) {
        return NextResponse.json(
          { 
            success: false, 
            error: 'Tenant context required',
            message: 'This feature requires tenant authentication'
          },
          { status: 401 }
        );
      }

      // Check feature flag
      if (!isFeatureEnabled(featureKey, context)) {
        return NextResponse.json(
          { 
            success: false, 
            error: 'Feature not available',
            featureKey,
            tenantId: context.tenantId,
            message: `Feature ${featureKey} is not enabled for your tenant`
          },
          { status: 403 }
        );
      }

      return await handler(request, context, ...args);
    } catch (error) {
      console.error(`Tenant feature flag error for ${featureKey}:`, error);
      return NextResponse.json(
        { 
          success: false, 
          error: 'Feature temporarily unavailable',
          featureKey
        },
        { status: 503 }
      );
    }
  };
}
