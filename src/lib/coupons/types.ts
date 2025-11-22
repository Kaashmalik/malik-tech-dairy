// Coupon & Discount Types

export type CouponType = "percentage" | "fixed" | "free_trial";

export type DiscountTarget = "all" | "free" | "starter" | "professional" | "enterprise";

export interface Coupon {
  id: string;
  code: string;
  type: CouponType;
  value: number; // Percentage (0-100) or fixed amount in PKR
  targetPlans: DiscountTarget[]; // Which plans this applies to
  minAmount?: number; // Minimum purchase amount
  maxDiscount?: number; // Maximum discount amount (for percentage)
  validFrom: Date;
  validUntil: Date;
  maxUses?: number; // Total uses allowed
  maxUsesPerUser?: number; // Uses per user
  isActive: boolean;
  description?: string;
  createdBy: string; // Super admin user ID
  createdAt: Date;
  updatedAt: Date;
}

export interface CouponUsage {
  id: string;
  couponId: string;
  tenantId: string;
  userId: string;
  orderId: string;
  discountAmount: number;
  usedAt: Date;
}

export interface DiscountCalculation {
  originalAmount: number;
  discountAmount: number;
  finalAmount: number;
  coupon?: Coupon;
}

