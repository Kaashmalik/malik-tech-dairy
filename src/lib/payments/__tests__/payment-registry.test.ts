import { PaymentRegistry } from '../provider-registry';
import { PaymentCheckoutRequest } from '../types';

describe('PaymentProvider & PaymentRegistry Unit Tests', () => {
  const baseCheckoutRequest: PaymentCheckoutRequest = {
    tenantId: 'tenant_test_123',
    userId: 'user_test_456',
    plan: 'professional',
    amount: 5000,
    currency: 'PKR',
    description: 'MTK Dairy Professional Plan',
    returnUrl: 'https://dairy.mtkcodex.site/payments/callback',
  };

  describe('Provider Registry Discovery', () => {
    it('should register and retrieve all core payment providers', () => {
      const providers = PaymentRegistry.getAllProviders();
      const gatewayNames = providers.map(p => p.gateway);

      expect(gatewayNames).toContain('jazzcash');
      expect(gatewayNames).toContain('easypaisa');
      expect(gatewayNames).toContain('stripe');
      expect(gatewayNames).toContain('bank_transfer');
    });

    it('should throw error when requesting unregistered provider', () => {
      expect(() => PaymentRegistry.getProvider('bitcoin' as any)).toThrow('UNSUPPORTED_GATEWAY');
    });
  });

  describe('JazzCash Provider', () => {
    it('should generate valid checkout result with order id and params', async () => {
      const provider = PaymentRegistry.getProvider('jazzcash');
      const result = await provider.createCheckout(baseCheckoutRequest);

      expect(result.orderId).toBeDefined();
      expect(result.orderId).toContain('JC-');
      expect(result.checkoutUrl).toBeDefined();
      expect(result.gateway).toBe('jazzcash');
      expect(result.pendingManualReview).toBe(true);
    });

    it('should verify webhook payload and extract status', async () => {
      const provider = PaymentRegistry.getProvider('jazzcash');
      const event = await provider.verifyWebhook(
        {
          pp_ResponseCode: '000',
          pp_TxnRefNo: 'JC-TEST-123',
          pp_Amount: '500000',
        },
        {}
      );

      expect(event.gateway).toBe('jazzcash');
      expect(event.status).toBe('completed');
      expect(event.orderId).toBe('JC-TEST-123');
    });
  });

  describe('EasyPaisa Provider', () => {
    it('should generate checkout result with EP prefix and checkout URL', async () => {
      const provider = PaymentRegistry.getProvider('easypaisa');
      const result = await provider.createCheckout(baseCheckoutRequest);

      expect(result.orderId).toContain('EP-');
      expect(result.checkoutUrl).toContain('gateway=easypaisa');
      expect(result.gateway).toBe('easypaisa');
      expect(result.pendingManualReview).toBe(true);
    });
  });

  describe('Bank Transfer Provider', () => {
    it('should generate manual instructions and return manual verification status', async () => {
      const provider = PaymentRegistry.getProvider('bank_transfer');
      const result = await provider.createCheckout(baseCheckoutRequest);

      expect(result.orderId).toContain('BT-');
      expect(result.checkoutUrl).toContain('/subscription?payment_pending=true');
      expect(result.instructions).toBeDefined();
      expect(result.instructions).toContain('Habib Bank Limited');
      expect(result.pendingManualReview).toBe(true);
    });
  });

  describe('Webhook Idempotency Tracking', () => {
    it('should track processed webhook events and prevent duplicate processing', () => {
      const eventId = `evt_${Date.now()}_test`;
      expect(PaymentRegistry.isEventProcessed(eventId)).toBe(false);

      PaymentRegistry.markEventProcessed(eventId);
      expect(PaymentRegistry.isEventProcessed(eventId)).toBe(true);
    });
  });
});
