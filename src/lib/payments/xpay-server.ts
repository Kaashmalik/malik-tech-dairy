// XPay (Bank Alfalah) Payment Gateway - Server-Side Implementation
import crypto from 'crypto';

export interface XPayConfig {
  merchantId: string;
  merchantKey: string;
  returnUrl: string;
  isSandbox?: boolean;
}

export interface XPayPaymentRequest {
  amount: number; // in PKR
  orderId: string;
  description: string;
  customerEmail?: string;
  customerPhone?: string;
}

export interface XPayCheckoutResponse {
  checkoutUrl: string;
  transactionId: string;
}

/**
 * Generate signature for XPay
 */
function generateSignature(data: string, key: string): string {
  return crypto.createHmac('sha256', key).update(data).digest('hex');
}

/**
 * Create XPay checkout URL
 */
export function createXPayCheckout(
  config: XPayConfig,
  request: XPayPaymentRequest
): XPayCheckoutResponse {
  const baseUrl = config.isSandbox
    ? 'https://sandbox.bankalfalah.com/HS/api/Checkout'
    : 'https://xpay.bankalfalah.com/HS/api/Checkout';

  // XPay signature format
  const signatureData = `${config.merchantId}|${request.orderId}|${request.amount}|${config.returnUrl}`;
  const signature = generateSignature(signatureData, config.merchantKey);

  const params = new URLSearchParams({
    merchantId: config.merchantId,
    orderId: request.orderId,
    amount: request.amount.toString(),
    description: request.description,
    returnUrl: config.returnUrl,
    signature: signature,
  });

  return {
    checkoutUrl: `${baseUrl}?${params.toString()}`,
    transactionId: request.orderId,
  };
}

/**
 * Verify XPay payment response
 */
export function verifyXPayResponse(
  config: XPayConfig,
  response: Record<string, string>
): { valid: boolean; transactionId?: string; amount?: number; status?: string } {
  const { orderId, amount, status, signature } = response;

  // Reconstruct signature
  const signatureData = `${config.merchantId}|${orderId}|${amount}|${config.returnUrl}`;
  const calculatedSignature = generateSignature(signatureData, config.merchantKey);

  const valid = calculatedSignature.toLowerCase() === signature?.toLowerCase();

  return {
    valid,
    transactionId: orderId,
    amount: parseFloat(amount || '0'),
    status: status === 'Success' ? 'success' : 'failed',
  };
}
