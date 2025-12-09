// JazzCash Payment Gateway - Server-Side Implementation
import crypto from 'crypto';

export interface JazzCashConfig {
  merchantId: string;
  password: string;
  integritySalt: string;
  returnUrl: string;
  isSandbox?: boolean;
}

export interface JazzCashPaymentRequest {
  amount: number; // in PKR
  orderId: string;
  description: string;
  customerEmail?: string;
  customerPhone?: string;
}

export interface JazzCashCheckoutResponse {
  checkoutUrl: string;
  transactionId: string;
}

/**
 * Generate SHA256 hash for JazzCash
 */
function generateHash(data: string): string {
  return crypto.createHash('sha256').update(data).digest('hex');
}

/**
 * Create JazzCash checkout URL
 */
export function createJazzCashCheckout(
  config: JazzCashConfig,
  request: JazzCashPaymentRequest
): JazzCashCheckoutResponse {
  const baseUrl = config.isSandbox
    ? 'https://sandbox.jazzcash.com.pk/CustomerPortal/transactionmanagement/merchantform/PostTransaction'
    : 'https://jazzcash.com.pk/CustomerPortal/transactionmanagement/merchantform/PostTransaction';

  // JazzCash hash string format
  const hashString = `${config.merchantId}|${request.orderId}|${request.amount}|${config.returnUrl}|${config.integritySalt}`;
  const hash = generateHash(hashString);

  const params = new URLSearchParams({
    pp_Amount: request.amount.toString(),
    pp_BillReference: request.orderId,
    pp_Description: request.description,
    pp_MerchantID: config.merchantId,
    pp_Password: config.password,
    pp_ReturnURL: config.returnUrl,
    pp_TxnRefNo: request.orderId,
    pp_TxnType: 'MPAY',
    ppmpf_1: request.customerEmail || '',
    ppmpf_2: request.customerPhone || '',
    pp_SecureHash: hash,
  });

  return {
    checkoutUrl: `${baseUrl}?${params.toString()}`,
    transactionId: request.orderId,
  };
}

/**
 * Verify JazzCash payment response
 */
export function verifyJazzCashResponse(
  config: JazzCashConfig,
  response: Record<string, string>
): { valid: boolean; transactionId?: string; amount?: number; status?: string } {
  const {
    pp_Amount,
    pp_BillReference,
    pp_ResponseCode,
    pp_ResponseMessage,
    pp_TxnRefNo,
    pp_SecureHash,
  } = response;

  // Reconstruct hash
  const hashString = `${config.merchantId}|${pp_TxnRefNo}|${pp_Amount}|${config.returnUrl}|${config.integritySalt}`;
  const calculatedHash = generateHash(hashString);

  const valid = calculatedHash.toLowerCase() === pp_SecureHash?.toLowerCase();

  return {
    valid,
    transactionId: pp_TxnRefNo,
    amount: parseFloat(pp_Amount || '0'),
    status: pp_ResponseCode === '000' ? 'success' : 'failed',
  };
}
