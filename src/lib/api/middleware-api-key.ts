// API Key Authentication Middleware
import { NextRequest, NextResponse } from 'next/server';
import { validateApiKey } from '@/lib/api-keys';

/**
 * Middleware to authenticate requests using API keys
 * Used for IoT device access
 */
export function withApiKeyAuth(
  handler: (
    req: NextRequest,
    context: {
      tenantId: string;
      permissions: string[];
    }
  ) => Promise<NextResponse>
) {
  return async (req: NextRequest): Promise<NextResponse> => {
    // Extract API key from header
    const apiKey =
      req.headers.get('x-api-key') || req.headers.get('authorization')?.replace('Bearer ', '');

    if (!apiKey) {
      return NextResponse.json(
        {
          error: 'API key required. Provide it in X-API-Key header or Authorization: Bearer <key>',
        },
        { status: 401 }
      );
    }

    // Validate API key
    const apiKeyData = await validateApiKey(apiKey);

    if (!apiKeyData || !apiKeyData.tenantId) {
      return NextResponse.json({ error: 'Invalid API key' }, { status: 401 });
    }

    return handler(req, {
      tenantId: apiKeyData.tenantId,
      permissions: (apiKeyData as any).scopes || [],
    });
  };
}

/**
 * Check if API key has required permission
 */
export function hasApiKeyPermission(
  permissions: string[],
  required: 'milk_logs' | 'health_records' | 'read_only'
): boolean {
  if (permissions.includes('read_only')) {
    return required === 'read_only';
  }
  return permissions.includes(required) || permissions.includes('read_only');
}
