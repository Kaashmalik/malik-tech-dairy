// Super Admin - platform audit log (newest first, filterable)
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { z } from 'zod';
import { isPlatformSuperAdmin } from '@/lib/admin/require-super-admin';
import { db } from '@/lib/supabase/tenant-db';
import { logger } from '@/lib/logger';

export const dynamic = 'force-dynamic';

const querySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(50),
  tenantId: z.string().max(100).optional(),
  action: z.enum(['create', 'update', 'delete', 'read', 'login', 'logout']).optional(),
  resource: z.string().max(100).optional(),
});

export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId || !(await isPlatformSuperAdmin(userId))) {
      return NextResponse.json(
        { success: false, error: 'Forbidden - Super Admin access required' },
        { status: 403 }
      );
    }

    const q = querySchema.parse(Object.fromEntries(new URL(request.url).searchParams));
    const from = (q.page - 1) * q.limit;

    let query = db()
      .from('audit_logs')
      .select(
        'id, tenant_id, user_id, action, resource, resource_id, details, ip_address, created_at',
        {
          count: 'exact',
        }
      )
      .order('created_at', { ascending: false })
      .range(from, from + q.limit - 1);
    if (q.tenantId) query = query.eq('tenant_id', q.tenantId);
    if (q.action) query = query.eq('action', q.action);
    if (q.resource) query = query.eq('resource', q.resource);

    const { data, error, count } = await query;
    if (error) throw new Error(`Load audit logs: ${error.message}`);

    // Resolve actor names in one query
    const rows = (data || []) as Array<Record<string, any>>; // eslint-disable-line @typescript-eslint/no-explicit-any
    const userIds = [...new Set(rows.map(r => r.user_id).filter(Boolean))];
    const { data: users } = userIds.length
      ? await db().from('platform_users').select('id, name, email').in('id', userIds)
      : { data: [] };
    const userById = new Map(
      ((users || []) as Array<{ id: string; name: string | null; email: string }>).map(u => [
        u.id,
        u,
      ])
    );

    return NextResponse.json({
      success: true,
      data: rows.map(r => ({
        id: r.id,
        tenantId: r.tenant_id,
        userId: r.user_id,
        user: userById.get(r.user_id)?.name || userById.get(r.user_id)?.email || r.user_id,
        action: r.action,
        resource: r.resource,
        resourceId: r.resource_id,
        details: r.details,
        ip: r.ip_address,
        createdAt: r.created_at,
      })),
      pagination: {
        page: q.page,
        limit: q.limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / q.limit),
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ success: false, error: 'Invalid query' }, { status: 400 });
    }
    logger.error('Admin audit logs failed', error);
    return NextResponse.json({ success: false, error: 'Server error' }, { status: 500 });
  }
}
