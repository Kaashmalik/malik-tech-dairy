// API Route: Super Admin - Update/Delete Coupon (Postgres)
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { getDrizzle, getSupabaseClient } from '@/lib/supabase/server';
import { coupons } from '@/db/schema';
import { eq } from 'drizzle-orm';

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

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { userId } = await auth();
    const { id } = await params;
    if (!userId || !(await isSuperAdmin(userId))) {
      return NextResponse.json(
        { error: 'Unauthorized - Super admin access required' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const updates: Partial<typeof coupons.$inferInsert> = {
      updatedAt: new Date(),
    };

    if (body.type !== undefined) updates.type = body.type;
    if (body.value !== undefined) updates.value = Math.round(Number(body.value));
    if (body.targetPlans !== undefined) updates.targetPlans = body.targetPlans;
    if (body.minAmount !== undefined) {
      updates.minAmount = body.minAmount == null ? null : Math.round(Number(body.minAmount));
    }
    if (body.maxDiscount !== undefined) {
      updates.maxDiscount = body.maxDiscount == null ? null : Math.round(Number(body.maxDiscount));
    }
    if (body.validFrom !== undefined) updates.validFrom = new Date(body.validFrom);
    if (body.validUntil !== undefined) updates.validUntil = new Date(body.validUntil);
    if (body.maxUses !== undefined) {
      updates.maxUses = body.maxUses == null ? null : Math.round(Number(body.maxUses));
    }
    if (body.maxUsesPerUser !== undefined) {
      updates.maxUsesPerUser =
        body.maxUsesPerUser == null ? null : Math.round(Number(body.maxUsesPerUser));
    }
    if (body.isActive !== undefined) updates.isActive = Boolean(body.isActive);
    if (body.description !== undefined) updates.description = body.description;

    const db = getDrizzle();
    await db.update(coupons).set(updates).where(eq(coupons.id, id));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Update coupon error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth();
    const { id } = await params;
    if (!userId || !(await isSuperAdmin(userId))) {
      return NextResponse.json(
        { error: 'Unauthorized - Super admin access required' },
        { status: 403 }
      );
    }

    const db = getDrizzle();
    await db
      .update(coupons)
      .set({ isActive: false, updatedAt: new Date() })
      .where(eq(coupons.id, id));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete coupon error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
