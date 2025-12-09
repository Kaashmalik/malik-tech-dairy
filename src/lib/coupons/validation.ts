// Coupon Validation & Calculation
import { adminDb } from '@/lib/firebase/admin';
import type { Coupon, DiscountCalculation } from './types';
import type { SubscriptionPlan } from '@/types';

/**
 * Validate and calculate discount for a coupon
 */
export async function validateCoupon(
  code: string,
  plan: SubscriptionPlan,
  amount: number,
  tenantId: string,
  userId: string
): Promise<{ valid: boolean; calculation?: DiscountCalculation; error?: string }> {
  if (!adminDb) {
    return { valid: false, error: 'Database not available' };
  }

  try {
    // Find coupon by code
    const couponsSnapshot = await adminDb
      .collection('coupons')
      .where('code', '==', code.toUpperCase())
      .where('isActive', '==', true)
      .limit(1)
      .get();

    if (couponsSnapshot.empty) {
      return { valid: false, error: 'Invalid coupon code' };
    }

    const couponDoc = couponsSnapshot.docs[0];
    const coupon = { id: couponDoc.id, ...couponDoc.data() } as Coupon;

    // Check validity dates
    const now = new Date();
    const validFrom =
      coupon.validFrom instanceof Date
        ? coupon.validFrom
        : (coupon.validFrom as any)?.toDate?.() || new Date(coupon.validFrom);
    const validUntil =
      coupon.validUntil instanceof Date
        ? coupon.validUntil
        : (coupon.validUntil as any)?.toDate?.() || new Date(coupon.validUntil);

    if (now < validFrom || now > validUntil) {
      return { valid: false, error: 'Coupon has expired' };
    }

    // Check if coupon applies to this plan
    if (
      coupon.targetPlans.length > 0 &&
      !coupon.targetPlans.includes('all') &&
      !coupon.targetPlans.includes(plan)
    ) {
      return { valid: false, error: 'Coupon not valid for this plan' };
    }

    // Check minimum amount
    if (coupon.minAmount && amount < coupon.minAmount) {
      return {
        valid: false,
        error: `Minimum purchase amount is PKR ${coupon.minAmount}`,
      };
    }

    // Check max uses
    if (coupon.maxUses) {
      const usageCount = await adminDb
        .collection('coupon_usage')
        .where('couponId', '==', coupon.id)
        .count()
        .get();

      if (usageCount.data().count >= coupon.maxUses) {
        return { valid: false, error: 'Coupon has reached maximum uses' };
      }
    }

    // Check max uses per user
    if (coupon.maxUsesPerUser) {
      const userUsageCount = await adminDb
        .collection('coupon_usage')
        .where('couponId', '==', coupon.id)
        .where('userId', '==', userId)
        .count()
        .get();

      if (userUsageCount.data().count >= coupon.maxUsesPerUser) {
        return { valid: false, error: 'You have already used this coupon' };
      }
    }

    // Calculate discount
    let discountAmount = 0;

    if (coupon.type === 'percentage') {
      discountAmount = (amount * coupon.value) / 100;
      if (coupon.maxDiscount) {
        discountAmount = Math.min(discountAmount, coupon.maxDiscount);
      }
    } else if (coupon.type === 'fixed') {
      discountAmount = Math.min(coupon.value, amount);
    } else if (coupon.type === 'free_trial') {
      discountAmount = amount; // Full discount for free trial
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
    console.error('Error validating coupon:', error);
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
  if (!adminDb) {
    throw new Error('Database not available');
  }

  await adminDb.collection('coupon_usage').add({
    couponId,
    tenantId,
    userId,
    orderId,
    discountAmount,
    usedAt: new Date(),
  });
}
