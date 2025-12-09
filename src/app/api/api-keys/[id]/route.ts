// API Key Management - Individual Key Operations
import { NextRequest, NextResponse } from 'next/server';
import { withTenantContext } from '@/lib/api/middleware';
import { withMFAEnforcement } from '@/lib/middleware/mfaMiddleware';
import { revokeApiKey } from '@/lib/api-keys';
import { getApiKeySchema, updateApiKeySchema } from '@/lib/validations/api-keys';
import { adminDb } from '@/lib/firebase/admin';

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

      await revokeApiKey(tenantId, id);

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
      console.error('Error revoking API key:', error);
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
  })(request);
}

// PATCH: Update API key
export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  return withMFAEnforcement(async (req, { tenantId, userId }) => {
    try {
      if (!adminDb) {
        return NextResponse.json({ error: 'Database not available' }, { status: 500 });
      }

      const { id: keyId } = await params;
      const { id } = getApiKeySchema.parse({ id: keyId });
      const body = await req.json();
      const validated = updateApiKeySchema.parse(body);

      const updateData: any = {};
      if (validated.name !== undefined) updateData.name = validated.name;
      if (validated.description !== undefined) updateData.description = validated.description;
      if (validated.permissions !== undefined) updateData.permissions = validated.permissions;
      if (validated.isActive !== undefined) updateData.isActive = validated.isActive;
      if (validated.expiresAt !== undefined) {
        updateData.expiresAt = validated.expiresAt ? new Date(validated.expiresAt) : null;
      }

      await adminDb
        .collection('tenants')
        .doc(tenantId)
        .collection('api_keys')
        .doc(id)
        .update(updateData);

      return NextResponse.json({
        success: true,
        message: 'API key updated successfully',
      });
    } catch (error: any) {
      if (error.name === 'ZodError') {
        return NextResponse.json(
          { error: 'Invalid request data', details: error.errors },
          { status: 400 }
        );
      }
      console.error('Error updating API key:', error);
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
  })(request);
}
