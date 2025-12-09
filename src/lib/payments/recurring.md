# Recurring Subscriptions - Implementation Guide

## Overview

JazzCash and EasyPaisa support recurring subscriptions through tokenization. This document outlines the implementation approach.

## Current Status

✅ **One-time payments**: Fully implemented  
⏳ **Recurring subscriptions**: Structure ready, requires gateway-specific tokenization

## Implementation Steps

### 1. Token Storage

After first successful payment, store the payment token:

```typescript
// In payment callback handler
if (verification.status === 'success') {
  // Store token for recurring billing
  await updateTenantSubscription(tenantId, {
    plan,
    status: 'active',
    gateway: gateway as PaymentGateway,
    token: responseData.token, // Gateway-specific token
    renewDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
  });
}
```

### 2. Recurring Payment Processor

Create a cron job or webhook handler to process renewals:

**File**: `src/lib/workers/processors/payment-renewal.ts`

```typescript
export async function processPaymentRenewal(job: Job<RenewalJobData>) {
  const { tenantId, plan, amount, gateway, token } = job.data;

  // Call gateway API to charge using token
  if (gateway === 'jazzcash') {
    // JazzCash recurring payment API call
  } else if (gateway === 'easypaisa') {
    // EasyPaisa recurring payment API call
  }

  // Update subscription on success
  // Downgrade to free on failure
}
```

### 3. Cron Job Setup

**Option A: Vercel Cron Jobs**

```typescript
// app/api/cron/renew-subscriptions/route.ts
export async function GET(request: NextRequest) {
  // Verify cron secret
  if (request.headers.get('authorization') !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Get all subscriptions due for renewal
  // Queue renewal jobs
}
```

**Option B: External Cron Service**

- Use services like cron-job.org or EasyCron
- Call webhook endpoint daily
- Process subscriptions due for renewal

### 4. Failure Handling

On payment failure:

1. Retry payment (3 attempts)
2. Send email/SMS notification
3. Downgrade to free tier after final failure
4. Log failure for manual review

### 5. Gateway-Specific Implementation

#### JazzCash Recurring Payments

- Requires tokenization API access
- Store `pp_Token` from initial payment
- Use token for subsequent charges
- API endpoint: `https://sandbox.jazzcash.com.pk/CustomerPortal/transactionmanagement/merchantform/PostTransaction`

#### EasyPaisa Recurring Payments

- Requires subscription API access
- Store subscription ID from initial payment
- Use subscription ID for renewals
- API endpoint: `https://easypay.easypaisa.com.pk/easypay/RecurringPayment`

## Testing

1. **Sandbox Testing**
   - Test token generation
   - Test recurring charge
   - Test failure scenarios

2. **Production Rollout**
   - Enable for new subscriptions first
   - Monitor success rates
   - Gradually migrate existing subscriptions

## Monitoring

Track:

- Renewal success rate
- Payment failure reasons
- Downgrade rate
- Customer churn

## Notes

- Both gateways require merchant account approval for recurring payments
- Tokenization may require additional security compliance (PCI-DSS)
- Consider implementing payment retry logic with exponential backoff
- Store payment tokens encrypted in database
