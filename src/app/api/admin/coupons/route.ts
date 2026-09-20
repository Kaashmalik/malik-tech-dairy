// API Route: Super Admin - Manage Coupons (Postgres)
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { getDrizzle, getSupabaseClient } from '@/lib/supabase/server';
import { coupons } from '@/db/schema';
import { desc, eq } from 'drizzle-orm';
import { nanoid } from 'nanoid';

export const dynamic = 'force-dynamic';

async function isSuperAdmin(userId: string): Promise<boolean> {
  const supabase = getSupabaseClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: user } = await (supabase.from('platform_users') as any)
    .select('platform_role')
    .eq('id', userId)
    .single();
  return user?.platform_role === 'super_admin';
}

export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId || !(await isSuperAdmin(userId))) {
      return NextResponse.json(
        { error: 'Unauthorized - Super admin access required' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const activeOnly = searchParams.get('activeOnly') === 'true';
    const db = getDrizzle();

    const rows = activeOnly
      ? await db
          .select()
          .from(coupons)
          .where(eq(coupons.isActive, true))
          .orderBy(desc(coupons.createdAt))
      : await db.select().from(coupons).orderBy(desc(coupons.createdAt));

    return NextResponse.json({
      success: true,
      coupons: rows.map(row => ({
        id: row.id,
        code: row.code,
        type: row.type,
        value: row.value,
        targetPlans: row.targetPlans,
        minAmount: row.minAmount,
        maxDiscount: row.maxDiscount,
        validFrom: row.validFrom,
        validUntil: row.validUntil,
        maxUses: row.maxUses,
        maxUsesPerUser: row.maxUsesPerUser,
        isActive: row.isActive,
        description: row.description,
        createdBy: row.createdBy,
        createdAt: row.createdAt,
        updatedAt: row.updatedAt,
      })),
    });
  } catch (error) {
    console.error('List coupons error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId || !(await isSuperAdmin(userId))) {
      return NextResponse.json(
        { error: 'Unauthorized - Super admin access required' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const {
      code,
      type,
      value,
      targetPlans,
      minAmount,
      maxDiscount,
      validFrom,
      validUntil,
      maxUses,
      maxUsesPerUser,
      description,
    } = body;

    if (!code || !type || value === undefined || !targetPlans || !validFrom || !validUntil) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const db = getDrizzle();
    const normalizedCode = String(code).toUpperCase();
    const [existing] = await db
      .select({ id: coupons.id })
      .from(coupons)
      .where(eq(coupons.code, normalizedCode))
      .limit(1);

    if (existing) {
      return NextResponse.json({ error: 'Coupon code already exists' }, { status: 409 });
    }

    const now = new Date();
    const coupon = {
      id: nanoid(),
      code: normalizedCode,
      type,
      value: Math.round(Number(value)),
      targetPlans: targetPlans as string[],
      minAmount: minAmount != null ? Math.round(Number(minAmount)) : null,
      maxDiscount: maxDiscount != null ? Math.round(Number(maxDiscount)) : null,
      validFrom: new Date(validFrom),
      validUntil: new Date(validUntil),
      maxUses: maxUses != null ? Math.round(Number(maxUses)) : null,
      maxUsesPerUser: maxUsesPerUser != null ? Math.round(Number(maxUsesPerUser)) : null,
      isActive: true,
      description: description || null,
      createdBy: userId,
      createdAt: now,
      updatedAt: now,
    };

    await db.insert(coupons).values(coupon);

    return NextResponse.json({ success: true, coupon });
  } catch (error) {
    console.error('Create coupon error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
