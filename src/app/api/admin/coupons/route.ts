// API Route: Super Admin - Manage Coupons (Supabase REST)
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { getSupabaseClient } from '@/lib/supabase/server';
import { isPlatformSuperAdmin } from '@/lib/admin/require-super-admin';
import { nanoid } from 'nanoid';

export const dynamic = 'force-dynamic';

function mapCoupon(row: Record<string, unknown>) {
  return {
    id: row.id,
    code: row.code,
    type: row.type,
    value: row.value,
    targetPlans: row.target_plans,
    minAmount: row.min_amount,
    maxDiscount: row.max_discount,
    validFrom: row.valid_from,
    validUntil: row.valid_until,
    maxUses: row.max_uses,
    maxUsesPerUser: row.max_uses_per_user,
    isActive: row.is_active,
    description: row.description,
    createdBy: row.created_by,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId || !(await isPlatformSuperAdmin(userId))) {
      return NextResponse.json(
        { error: 'Unauthorized - Super admin access required' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const activeOnly = searchParams.get('activeOnly') === 'true';
    const supabase = getSupabaseClient();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let query = (supabase.from('coupons') as any)
      .select('*')
      .order('created_at', { ascending: false });

    if (activeOnly) {
      query = query.eq('is_active', true);
    }

    const { data: rows, error } = await query;
    if (error) {
      console.error('List coupons error:', error);
      return NextResponse.json({ error: 'Failed to list coupons' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      coupons: (rows || []).map(mapCoupon),
    });
  } catch (error) {
    console.error('List coupons unexpected:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId || !(await isPlatformSuperAdmin(userId))) {
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

    const supabase = getSupabaseClient();
    const normalizedCode = String(code).toUpperCase();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: existing } = await (supabase.from('coupons') as any)
      .select('id')
      .eq('code', normalizedCode)
      .maybeSingle();

    if (existing?.id) {
      return NextResponse.json({ error: 'Coupon code already exists' }, { status: 409 });
    }

    const now = new Date().toISOString();
    const couponRow = {
      id: nanoid(),
      code: normalizedCode,
      type,
      value: Math.round(Number(value)),
      target_plans: targetPlans as string[],
      min_amount: minAmount != null ? Math.round(Number(minAmount)) : null,
      max_discount: maxDiscount != null ? Math.round(Number(maxDiscount)) : null,
      valid_from: new Date(validFrom).toISOString(),
      valid_until: new Date(validUntil).toISOString(),
      max_uses: maxUses != null ? Math.round(Number(maxUses)) : null,
      max_uses_per_user: maxUsesPerUser != null ? Math.round(Number(maxUsesPerUser)) : null,
      is_active: true,
      description: description || null,
      created_by: userId,
      created_at: now,
      updated_at: now,
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error: insertError } = await (supabase.from('coupons') as any).insert(couponRow);
    if (insertError) {
      console.error('Create coupon error:', insertError);
      return NextResponse.json({ error: 'Failed to create coupon' }, { status: 500 });
    }

    return NextResponse.json({ success: true, coupon: mapCoupon(couponRow) });
  } catch (error) {
    console.error('Create coupon unexpected:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
