// API Key Management Routes
import { NextRequest, NextResponse } from 'next/server';
import { withTenantContext } from '@/lib/api/middleware';
import { TenantRole, PlatformRole } from '@/types/roles';
import { createApiKey, getTenantApiKeys, deactivateApiKey } from '@/lib/api-keys';
import { createApiKeySchema, listApiKeysSchema } from '@/lib/validations/api-keys';
import { withMFAEnforcement } from '@/lib/middleware/mfaMiddleware';
export const dynamic = 'force-dynamic';
// GET: List API keys
export async function GET(request: NextRequest) {
  return withMFAEnforcement(async (req, { tenantId, userId }) => {
    try {
      const { searchParams } = new URL(req.url);
      const query = listApiKeysSchema.parse({
        isActive: searchParams.get('isActive'),
      });
      const keys = await getTenantApiKeys(tenantId);
      // Filter based on query
      const filteredKeys = query.isActive === false ? keys : keys.filter(k => k.isActive);
      // Remove sensitive data (keyHash) from response
      const safeKeys = filteredKeys.map(({ keyHash, ...rest }) => ({
        ...rest,
        key: undefined, // Never return the actual key
      }));
      return NextResponse.json({ keys: safeKeys });
    } catch (error: any) {
      if (error.name === 'ZodError') {
        return NextResponse.json(
          { error: 'Invalid request parameters', details: error.errors },
          { status: 400 }
        );
      }
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
  })(request);
}
// POST: Create new API key
export async function POST(request: NextRequest) {
  return withMFAEnforcement(async (req, { tenantId, userId }) => {
    try {
      const body = await req.json();
      const validated = createApiKeySchema.parse(body);
      const result = (await createApiKey({
        tenantId,
        userId,
        name: validated.name,
        scopes: validated.permissions || [],
        expiresInDays: validated.expiresAt
          ? Math.ceil(
              (new Date(validated.expiresAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
            )
          : undefined,
      })) as { apiKey: string; prefix: string };

      // Return API key only once (client must save it)
      return NextResponse.json({
        success: true,
        apiKey: {
          keyPrefix: result.prefix,
        },
        key: result.apiKey, // Only returned once!
        warning: 'Save this key securely. It will not be shown again.',
      });
    } catch (error: any) {
      if (error.name === 'ZodError') {
        return NextResponse.json(
          { error: 'Invalid request data', details: error.errors },
          { status: 400 }
        );
      }
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
  })(request);
}
