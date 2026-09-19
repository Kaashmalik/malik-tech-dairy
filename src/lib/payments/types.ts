import type { SubscriptionPlan } from '@/types';

export type PaymentGatewayType = 'jazzcash' | 'easypaisa' | 'stripe' | 'xpay' | 'bank_transfer';

export type TransactionStatus =
  | 'pending'
  | 'processing'
  | 'completed'
  | 'failed'
  | 'cancelled'
  | 'manual_verification';

export interface PaymentTransaction {
  id: string;
  tenantId: string;
  userId: string;
  amount: number;
  currency: 'PKR' | 'USD';
  gateway: PaymentGatewayType;
  status: TransactionStatus;
  plan: SubscriptionPlan;
  transactionId?: string;
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

export interface PaymentCheckoutRequest {
  tenantId: string;
  userId: string;
  plan: SubscriptionPlan;
  amount: number;
  currency: 'PKR' | 'USD';
  description: string;
  returnUrl: string;
  customerEmail?: string;
  customerPhone?: string;
  metadata?: Record<string, any>;
}

export interface PaymentCheckoutResult {
  success: boolean;
  orderId: string;
  checkoutUrl: string;
  gateway: PaymentGatewayType;
  instructions?: string;
  pendingManualReview?: boolean;
}

export interface PaymentWebhookEvent {
  gateway: PaymentGatewayType;
  eventId: string;
  orderId: string;
  transactionId?: string;
  status: TransactionStatus;
  rawPayload: any;
  signature?: string;
}

export interface PaymentProvider {
  gateway: PaymentGatewayType;
  createCheckout(request: PaymentCheckoutRequest): Promise<PaymentCheckoutResult>;
  verifyWebhook(payload: any, headers: Record<string, string>): Promise<PaymentWebhookEvent>;
}
