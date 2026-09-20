// Coupon Validation & Calculation (Postgres / Drizzle)
import { getDrizzle } from '@/lib/supabase/server';
import { coupons, couponUsage } from '@/db/schema';
import { and, count, eq } from 'drizzle-orm';
import { nanoid } from 'nanoid';
import type { Coupon, DiscountCalculation, DiscountTarget } from './types';
import type { SubscriptionPlan } from '@/types';

function toCoupon(row: typeof coupons.$inferSelect): Coupon {
  return {
    id: row.id,
    code: row.code,
    type: row.type as Coupon['type'],
    value: row.value,
    targetPlans: (row.targetPlans || []) as DiscountTarget[],
    minAmount: row.minAmount ?? undefined,
    maxDiscount: row.maxDiscount ?? undefined,
    validFrom: row.validFrom,
    validUntil: row.validUntil,
    maxUses: row.maxUses ?? undefined,
    maxUsesPerUser: row.maxUsesPerUser ?? undefined,
    isActive: row.isActive,
    description: row.description ?? undefined,
    createdBy: row.createdBy,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
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
    const db = getDrizzle();
    const [row] = await db
      .select()
      .from(coupons)
      .where(and(eq(coupons.code, code.toUpperCase()), eq(coupons.isActive, true)))
      .limit(1);

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
      const [usage] = await db
        .select({ count: count() })
        .from(couponUsage)
        .where(eq(couponUsage.couponId, coupon.id));
      if (Number(usage?.count || 0) >= coupon.maxUses) {
        return { valid: false, error: 'Coupon has reached maximum uses' };
      }
    }

    if (coupon.maxUsesPerUser) {
      const [userUsage] = await db
        .select({ count: count() })
        .from(couponUsage)
        .where(and(eq(couponUsage.couponId, coupon.id), eq(couponUsage.userId, userId)));
      if (Number(userUsage?.count || 0) >= coupon.maxUsesPerUser) {
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
  const db = getDrizzle();
  await db.insert(couponUsage).values({
    id: nanoid(),
    couponId,
    tenantId,
    userId,
    orderId,
    discountAmount: Math.round(discountAmount),
    usedAt: new Date(),
  });
}
