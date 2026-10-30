// Admin API - list, create and manage farms (super admin only)
import { NextRequest, NextResponse } from 'next/server';
import { auth, clerkClient } from '@clerk/nextjs/server';
import { z } from 'zod';
import { isPlatformSuperAdmin } from '@/lib/admin/require-super-admin';
import { db, fetchAllRows, unwrap } from '@/lib/supabase/tenant-db';
import { ensurePlatformUser } from '@/lib/auth/platform-user';
import { provisionFarm, ProvisioningError } from '@/lib/tenant/provision';
import { updateTenantSubscription } from '@/lib/subscriptions/management';
import { logAuditEvent } from '@/lib/audit';
import { logger } from '@/lib/logger';

export const dynamic = 'force-dynamic';

const PLANS = ['free', 'professional', 'farm', 'enterprise'] as const;
const PAID_PERIOD_MS = 30 * 24 * 60 * 60 * 1000;

async function requireSuperAdmin(): Promise<string | NextResponse> {
  const { userId } = await auth();
  if (!userId || !(await isPlatformSuperAdmin(userId))) {
    return NextResponse.json(
      { success: false, error: 'Forbidden - Super Admin access required' },
      { status: 403 }
    );
  }
  return userId;
}

const countBy = (rows: Array<{ tenant_id: string }>) => {
  const counts = new Map<string, number>();
  for (const r of rows) counts.set(r.tenant_id, (counts.get(r.tenant_id) || 0) + 1);
  return counts;
};

// GET - all farms with plan, status and usage (fixed number of queries, not per farm)
export async function GET() {
  try {
    const admin = await requireSuperAdmin();
    if (admin instanceof NextResponse) return admin;

    const [farms, subs, members, animals] = await Promise.all([
      fetchAllRows<Record<string, any>>( // eslint-disable-line @typescript-eslint/no-explicit-any
        () =>
          db()
            .from('tenants')
            .select('*')
            .is('deleted_at', null)
            .order('created_at', { ascending: false })
            .order('id'),
        'List farms'
      ),
      fetchAllRows<{ tenant_id: string; plan: string; status: string; renew_date: string }>(
        () => db().from('subscriptions').select('tenant_id, plan, status, renew_date').order('id'),
        'List subscriptions'
      ),
      fetchAllRows<{ tenant_id: string }>(
        () => db().from('tenant_members').select('tenant_id').eq('status', 'active').order('id'),
        'Count members'
      ),
      fetchAllRows<{ tenant_id: string }>(
        () => db().from('animals').select('tenant_id').eq('status', 'active').order('id'),
        'Count animals',
        200_000
      ),
    ]);

    const subByTenant = new Map(subs.map(s => [s.tenant_id, s]));
    const memberCounts = countBy(members);
    const animalCounts = countBy(animals);

    return NextResponse.json({
      success: true,
      data: farms.map(farm => {
        const sub = subByTenant.get(farm.id);
        return {
          id: farm.id,
          farmName: farm.farm_name,
          slug: farm.slug,
          plan: sub?.plan || 'free',
          subscriptionStatus: sub?.status || 'active',
          renewDate: sub?.plan && sub.plan !== 'free' ? sub.renew_date : null,
          status: farm.suspended_at ? 'suspended' : 'active',
          suspendedReason: farm.suspended_reason || null,
          city: farm.farm_location?.city,
          animalCount: animalCounts.get(farm.id) || 0,
          userCount: memberCounts.get(farm.id) || 0,
          createdAt: farm.created_at,
        };
      }),
    });
  } catch (error) {
    logger.error('Admin farms GET failed', error);
    return NextResponse.json({ success: false, error: 'Server error' }, { status: 500 });
  }
}

const createFarmSchema = z.object({
  farmName: z.string().trim().min(2).max(255),
  email: z.string().trim().email(),
  plan: z.enum(PLANS).default('free'),
});

// POST - create a farm for an existing user (looked up by email)
export async function POST(request: NextRequest) {
  try {
    const admin = await requireSuperAdmin();
    if (admin instanceof NextResponse) return admin;

    const { farmName, email, plan } = createFarmSchema.parse(await request.json());

    // The owner must have an account so the farm's Clerk org is theirs (not the admin's)
    const clerk = await clerkClient();
    const { data: users } = await clerk.users.getUserList({ emailAddress: [email.toLowerCase()] });
    const owner = users[0];
    if (!owner) {
      return NextResponse.json(
        {
          success: false,
          error: `No account found for ${email}. Ask the owner to sign up first, then create the farm.`,
        },
        { status: 404 }
      );
    }

    await ensurePlatformUser(owner.id);
    const farm = await provisionFarm({ ownerId: owner.id, farmName, plan });

    await logAuditEvent({
      tenantId: farm.tenantId,
      userId: admin,
      action: 'create',
      resource: 'organization',
      resourceId: farm.tenantId,
      details: { createdBy: 'super_admin', ownerId: owner.id, plan },
    });

    return NextResponse.json({
      success: true,
      data: { id: farm.tenantId, farmName, slug: farm.slug },
      message: 'Farm created successfully',
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: error.errors[0]?.message || 'Invalid input' },
        { status: 400 }
      );
    }
    if (error instanceof ProvisioningError) {
      return NextResponse.json({ success: false, error: error.message }, { status: 502 });
    }
    logger.error('Admin farms POST failed', error);
    return NextResponse.json({ success: false, error: 'Server error' }, { status: 500 });
  }
}

const manageFarmSchema = z.discriminatedUnion('action', [
  z.object({ action: z.literal('change_plan'), farmId: z.string().min(1), plan: z.enum(PLANS) }),
  z.object({
    action: z.literal('suspend'),
    farmId: z.string().min(1),
    reason: z.string().trim().max(500).optional(),
  }),
  z.object({ action: z.literal('reactivate'), farmId: z.string().min(1) }),
]);

// PATCH - change plan, suspend or reactivate a farm
export async function PATCH(request: NextRequest) {
  try {
    const admin = await requireSuperAdmin();
    if (admin instanceof NextResponse) return admin;

    const input = manageFarmSchema.parse(await request.json());
    const farm = unwrap(
      await db().from('tenants').select('id').eq('id', input.farmId).maybeSingle(),
      'Load farm'
    );
    if (!farm) {
      return NextResponse.json({ success: false, error: 'Farm not found' }, { status: 404 });
    }

    if (input.action === 'change_plan') {
      await updateTenantSubscription(input.farmId, {
        plan: input.plan,
        status: 'active',
        gateway: 'bank_transfer',
        renewDate: new Date(
          Date.now() + (input.plan === 'free' ? 100 * 365 * 86_400_000 : PAID_PERIOD_MS)
        ),
        amount: 0,
        currency: 'PKR',
      });
    } else {
      const suspend = input.action === 'suspend';
      const { error } = await db()
        .from('tenants')
        .update({
          suspended_at: suspend ? new Date().toISOString() : null,
          suspended_reason: suspend ? input.reason || null : null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', input.farmId);
      if (error) {
        // Most likely migration 012 has not been applied yet
        throw new Error(`Suspend farm failed (is migration 012 applied?): ${error.message}`);
      }
    }

    await logAuditEvent({
      tenantId: input.farmId,
      userId: admin,
      action: 'update',
      resource: 'organization',
      resourceId: input.farmId,
      details: { ...input },
    });

    return NextResponse.json({ success: true, message: 'Farm updated' });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: error.errors[0]?.message || 'Invalid input' },
        { status: 400 }
      );
    }
    logger.error('Admin farms PATCH failed', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Server error' },
      { status: 500 }
    );
  }
}
