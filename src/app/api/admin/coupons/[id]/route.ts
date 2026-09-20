// API Route: Super Admin - Update/Delete Coupon (Supabase REST)
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { getSupabaseClient } from '@/lib/supabase/server';
import { isPlatformSuperAdmin } from '@/lib/admin/require-super-admin';

export const dynamic = 'force-dynamic';

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { userId } = await auth();
    const { id } = await params;
    if (!userId || !(await isPlatformSuperAdmin(userId))) {
      return NextResponse.json(
        { error: 'Unauthorized - Super admin access required' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const updates: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };

    if (body.type !== undefined) updates.type = body.type;
    if (body.value !== undefined) updates.value = Math.round(Number(body.value));
    if (body.targetPlans !== undefined) updates.target_plans = body.targetPlans;
    if (body.minAmount !== undefined) {
      updates.min_amount = body.minAmount == null ? null : Math.round(Number(body.minAmount));
    }
    if (body.maxDiscount !== undefined) {
      updates.max_discount = body.maxDiscount == null ? null : Math.round(Number(body.maxDiscount));
    }
    if (body.validFrom !== undefined) updates.valid_from = new Date(body.validFrom).toISOString();
    if (body.validUntil !== undefined) {
      updates.valid_until = new Date(body.validUntil).toISOString();
    }
    if (body.maxUses !== undefined) {
      updates.max_uses = body.maxUses == null ? null : Math.round(Number(body.maxUses));
    }
    if (body.maxUsesPerUser !== undefined) {
      updates.max_uses_per_user =
        body.maxUsesPerUser == null ? null : Math.round(Number(body.maxUsesPerUser));
    }
    if (body.isActive !== undefined) updates.is_active = Boolean(body.isActive);
    if (body.description !== undefined) updates.description = body.description;

    const supabase = getSupabaseClient();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase.from('coupons') as any).update(updates).eq('id', id);

    if (error) {
      console.error('Update coupon error:', error);
      return NextResponse.json({ error: 'Failed to update coupon' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Update coupon unexpected:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth();
    const { id } = await params;
    if (!userId || !(await isPlatformSuperAdmin(userId))) {
      return NextResponse.json(
        { error: 'Unauthorized - Super admin access required' },
        { status: 403 }
      );
    }

    const supabase = getSupabaseClient();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase.from('coupons') as any)
      .update({ is_active: false, updated_at: new Date().toISOString() })
      .eq('id', id);

    if (error) {
      console.error('Delete coupon error:', error);
      return NextResponse.json({ error: 'Failed to delete coupon' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete coupon unexpected:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
