// API Key Management - Individual Key Operations
import { NextRequest, NextResponse } from 'next/server';
import { withTenantContext } from '@/lib/api/middleware';
import { withMFAEnforcement } from '@/lib/middleware/mfaMiddleware';
import { deactivateApiKey } from '@/lib/api-keys';
import { getApiKeySchema } from '@/lib/validations/api-keys';
export const dynamic = 'force-dynamic';
// DELETE: Revoke API key
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withMFAEnforcement(async (req, { tenantId, userId }) => {
    try {
      const { id: keyId } = await params;
      const { id } = getApiKeySchema.parse({ id: keyId });
      await deactivateApiKey(id);
      return NextResponse.json({
        success: true,
        message: 'API key revoked successfully',
      });
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
