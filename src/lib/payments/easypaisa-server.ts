// EasyPaisa Payment Gateway - Server-Side Implementation
import crypto from "crypto";

export interface EasyPaisaConfig {
  storeId: string;
  hashKey: string;
  returnUrl: string;
  isSandbox?: boolean;
}

export interface EasyPaisaPaymentRequest {
  amount: number; // in PKR
  orderId: string;
  description: string;
  customerEmail?: string;
  customerPhone?: string;
}

export interface EasyPaisaCheckoutResponse {
  checkoutUrl: string;
  transactionId: string;
}

/**
 * Generate hash for EasyPaisa
 */
function generateHash(data: string): string {
  return crypto.createHash("sha256").update(data).digest("hex");
}

/**
 * Create EasyPaisa checkout URL
 */
export function createEasyPaisaCheckout(
  config: EasyPaisaConfig,
  request: EasyPaisaPaymentRequest
): EasyPaisaCheckoutResponse {
  const baseUrl = config.isSandbox
    ? "https://easypay.easypaisa.com.pk/easypay/Index.jsf"
    : "https://easypay.easypaisa.com.pk/easypay/Index.jsf";

  // EasyPaisa hash format
  const hashString = `${config.storeId}|${request.orderId}|${request.amount}|${config.returnUrl}|${config.hashKey}`;
  const hash = generateHash(hashString);

  const params = new URLSearchParams({
    storeId: config.storeId,
    orderId: request.orderId,
    transactionAmount: request.amount.toString(),
    transactionType: "MA",
    merchantHashedReq: hash,
    postBackURL: config.returnUrl,
  });

  return {
    checkoutUrl: `${baseUrl}?${params.toString()}`,
    transactionId: request.orderId,
  };
}

/**
 * Verify EasyPaisa payment response
 */
export function verifyEasyPaisaResponse(
  config: EasyPaisaConfig,
  response: Record<string, string>
): { valid: boolean; transactionId?: string; amount?: number; status?: string } {
  const { orderId, amount, status, hash } = response;

  // Reconstruct hash
  const hashString = `${config.storeId}|${orderId}|${amount}|${config.returnUrl}|${config.hashKey}`;
  const calculatedHash = generateHash(hashString);

  const valid = calculatedHash.toLowerCase() === hash?.toLowerCase();

  return {
    valid,
    transactionId: orderId,
    amount: parseFloat(amount || "0"),
    status: status === "Success" ? "success" : "failed",
  };
}

