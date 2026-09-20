// Coupon Validation & Calculation (Supabase REST)
import { getSupabaseClient } from '@/lib/supabase/server';
import { nanoid } from 'nanoid';
import type { Coupon, DiscountCalculation, DiscountTarget } from './types';
import type { SubscriptionPlan } from '@/types';

function toCoupon(row: Record<string, any>): Coupon {
  return {
    id: row.id,
    code: row.code,
    type: row.type as Coupon['type'],
    value: row.value,
    targetPlans: (row.target_plans || []) as DiscountTarget[],
    minAmount: row.min_amount ?? undefined,
    maxDiscount: row.max_discount ?? undefined,
    validFrom: new Date(row.valid_from),
    validUntil: new Date(row.valid_until),
    maxUses: row.max_uses ?? undefined,
    maxUsesPerUser: row.max_uses_per_user ?? undefined,
    isActive: row.is_active,
    description: row.description ?? undefined,
    createdBy: row.created_by,
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
  };
}

/**
 * Validate and calculate discount for a coupon
 */
export async function validateCoupon(
  code: string,
  plan: SubscriptionPlan,
  amount: number,
  _tenantId: string,
  userId: string
): Promise<{ valid: boolean; calculation?: DiscountCalculation; error?: string }> {
  try {
    const supabase = getSupabaseClient();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const sb = supabase as any;

    const { data: row } = await sb
      .from('coupons')
      .select('*')
      .eq('code', code.toUpperCase())
      .eq('is_active', true)
      .maybeSingle();

    if (!row) {
      return { valid: false, error: 'Invalid coupon code' };
    }

    const coupon = toCoupon(row);
    const now = new Date();
    if (now < coupon.validFrom || now > coupon.validUntil) {
      return { valid: false, error: 'Coupon has expired' };
    }

    if (
      coupon.targetPlans.length > 0 &&
      !coupon.targetPlans.includes('all') &&
      !coupon.targetPlans.includes(plan as DiscountTarget)
    ) {
      return { valid: false, error: 'Coupon not valid for this plan' };
    }

    if (coupon.minAmount && amount < coupon.minAmount) {
      return {
        valid: false,
        error: `Minimum purchase amount is PKR ${coupon.minAmount}`,
      };
    }

    if (coupon.maxUses) {
      const { count } = await sb
        .from('coupon_usage')
        .select('*', { count: 'exact', head: true })
        .eq('coupon_id', coupon.id);
      if (Number(count || 0) >= coupon.maxUses) {
        return { valid: false, error: 'Coupon has reached maximum uses' };
      }
    }

    if (coupon.maxUsesPerUser) {
      const { count } = await sb
        .from('coupon_usage')
        .select('*', { count: 'exact', head: true })
        .eq('coupon_id', coupon.id)
        .eq('user_id', userId);
      if (Number(count || 0) >= coupon.maxUsesPerUser) {
        return { valid: false, error: 'You have already used this coupon' };
      }
    }

    let discountAmount = 0;
    if (coupon.type === 'percentage') {
      discountAmount = (amount * coupon.value) / 100;
      if (coupon.maxDiscount) {
        discountAmount = Math.min(discountAmount, coupon.maxDiscount);
      }
    } else if (coupon.type === 'fixed') {
      discountAmount = Math.min(coupon.value, amount);
    } else if (coupon.type === 'free_trial') {
      discountAmount = amount;
    }

    const finalAmount = Math.max(0, amount - discountAmount);
    return {
      valid: true,
      calculation: {
        originalAmount: amount,
        discountAmount,
        finalAmount,
        coupon,
      },
    };
  } catch (error) {
    console.error('Coupon validation error:', error);
    return { valid: false, error: 'Error validating coupon' };
  }
}

/**
 * Record coupon usage
 */
export async function recordCouponUsage(
  couponId: string,
  tenantId: string,
  userId: string,
  orderId: string,
  discountAmount: number
): Promise<void> {
  const supabase = getSupabaseClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase.from('coupon_usage') as any).insert({
    id: nanoid(),
    coupon_id: couponId,
    tenant_id: tenantId,
    user_id: userId,
    order_id: orderId,
    discount_amount: Math.round(discountAmount),
    used_at: new Date().toISOString(),
  });

  if (error) {
    throw new Error(`Failed to record coupon usage: ${error.message}`);
  }
}
