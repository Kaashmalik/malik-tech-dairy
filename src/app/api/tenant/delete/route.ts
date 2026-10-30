// POST /api/tenant/delete - owner closes the farm (must type the farm name to confirm)
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getTenantContext, getTenantInfo, TenantAccessError } from '@/lib/tenant/context';
import { deleteTenant } from '@/lib/tenant/data-rights';
import { logAuditEvent } from '@/lib/audit';
import { logger } from '@/lib/logger';

export const dynamic = 'force-dynamic';

const schema = z.object({ confirmFarmName: z.string().trim().min(1) });

export async function POST(request: NextRequest) {
  try {
    const ctx = await getTenantContext();
    if (ctx.userRole !== 'farm_owner' && ctx.userRole !== 'super_admin') {
      return NextResponse.json(
        { success: false, error: 'Only the farm owner can delete the farm' },
        { status: 403 }
      );
    }

    const { confirmFarmName } = schema.parse(await request.json());
    const farm = await getTenantInfo(ctx.tenantId);
    if (!farm) {
      return NextResponse.json({ success: false, error: 'Farm not found' }, { status: 404 });
    }
    if (confirmFarmName.toLowerCase() !== String(farm.farmName).trim().toLowerCase()) {
      return NextResponse.json(
        { success: false, error: 'Farm name does not match. Nothing was deleted.' },
        { status: 400 }
      );
    }

    // Audit first: once deleted, the farm no longer resolves for this session
    await logAuditEvent({
      tenantId: ctx.tenantId,
      userId: ctx.userId,
      action: 'delete',
      resource: 'organization',
      resourceId: ctx.tenantId,
      details: { farmName: farm.farmName, requestedBy: ctx.userRole },
    });
    await deleteTenant(ctx.tenantId);

    return NextResponse.json({ success: true, message: 'Farm deleted' });
  } catch (error) {
    if (error instanceof TenantAccessError) {
      return NextResponse.json({ success: false, error: error.message }, { status: error.status });
    }
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'Type the farm name to confirm' },
        { status: 400 }
      );
    }
    logger.error('Farm delete failed', error);
    return NextResponse.json({ success: false, error: 'Delete failed' }, { status: 500 });
  }
}
