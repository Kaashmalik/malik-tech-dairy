// GET /api/tenant/export - owner downloads all farm data as a ZIP of JSON files
import { NextResponse } from 'next/server';
import { getTenantContext, TenantAccessError } from '@/lib/tenant/context';
import { exportTenantData } from '@/lib/tenant/data-rights';
import { logAuditEvent } from '@/lib/audit';
import { logger } from '@/lib/logger';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

const ALLOWED_ROLES = ['farm_owner', 'super_admin'];

export async function GET() {
  try {
    const ctx = await getTenantContext();
    if (!ALLOWED_ROLES.includes(ctx.userRole)) {
      return NextResponse.json(
        { success: false, error: 'Only the farm owner can export farm data' },
        { status: 403 }
      );
    }

    const { zip, counts } = await exportTenantData(ctx.tenantId);
    await logAuditEvent({
      tenantId: ctx.tenantId,
      userId: ctx.userId,
      action: 'export',
      resource: 'organization',
      resourceId: ctx.tenantId,
      details: { counts },
    });

    const date = new Date().toISOString().split('T')[0];
    return new NextResponse(new Uint8Array(zip), {
      headers: {
        'Content-Type': 'application/zip',
        'Content-Disposition': `attachment; filename="farm-export-${date}.zip"`,
        'Cache-Control': 'no-store',
      },
    });
  } catch (error) {
    if (error instanceof TenantAccessError) {
      return NextResponse.json({ success: false, error: error.message }, { status: error.status });
    }
    logger.error('Farm export failed', error);
    return NextResponse.json({ success: false, error: 'Export failed' }, { status: 500 });
  }
}
