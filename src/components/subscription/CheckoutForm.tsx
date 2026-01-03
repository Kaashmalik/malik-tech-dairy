'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { SUBSCRIPTION_PLANS } from '@/lib/constants';
import { toast } from 'sonner';
import { useRouter, useSearchParams } from 'next/navigation';
import type { PaymentGateway, SubscriptionPlan } from '@/types';
import { Check, X } from 'lucide-react';
import { usePostHogAnalytics } from '@/hooks/usePostHog';

interface CheckoutFormData {
  gateway: PaymentGateway;
  couponCode?: string;
}

export function CheckoutForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const plan = (searchParams.get('plan') || 'starter') as SubscriptionPlan;
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { trackSubscriptionUpgrade } = usePostHogAnalytics();
  const [couponCode, setCouponCode] = useState('');
  const [couponValidating, setCouponValidating] = useState(false);
  const [couponResult, setCouponResult] = useState<{
    valid: boolean;
    discountAmount?: number;
    finalAmount?: number;
    error?: string;
  } | null>(null);

  const planDetails = SUBSCRIPTION_PLANS[plan];
  const [selectedGateway, setSelectedGateway] = useState<PaymentGateway>('bank_transfer');
  const [receiptFile, setReceiptFile] = useState<File | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CheckoutFormData>({
    defaultValues: {
      gateway: 'bank_transfer',
    },
  });

  const validateCoupon = async () => {
    if (!couponCode.trim()) {
      setCouponResult(null);
      return;
    }

    setCouponValidating(true);
    try {
      const res = await fetch('/api/coupons/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: couponCode,
          plan,
          amount: planDetails.price,
          tenantId: '', // Will be set by middleware
          userId: '', // Will be set by middleware
        }),
      });

      const data = await res.json();

      if (data.valid) {
        setCouponResult({
          valid: true,
          discountAmount: data.calculation.discountAmount,
          finalAmount: data.calculation.finalAmount,
        });
        toast.success('Coupon applied successfully!');
      } else {
        setCouponResult({
          valid: false,
          error: data.error || 'Invalid coupon',
        });
        toast.error(data.error || 'Invalid coupon');
      }
    } catch (error) {
      setCouponResult({
        valid: false,
        error: 'Error validating coupon',
      });
    } finally {
      setCouponValidating(false);
    }
  };

  const onSubmit = async (data: CheckoutFormData) => {
    setIsSubmitting(true);

    try {
      const finalAmount = couponResult?.finalAmount || planDetails.price;
      let proofUrl = undefined;

      // Upload receipt if manual payment
      if (['bank_transfer', 'jazzcash', 'easypaisa'].includes(selectedGateway) && receiptFile) {
        const formData = new FormData();
        formData.append('file', receiptFile);
        formData.append('type', 'payment-slip');

        const uploadRes = await fetch('/api/upload', {
          method: 'POST',
          body: formData,
        });

        if (!uploadRes.ok) {
          throw new Error('Failed to upload receipt');
        }

        const uploadData = await uploadRes.json();
        proofUrl = uploadData.url;
      }

      const res = await fetch('/api/payments/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          plan,
          gateway: selectedGateway,
          couponCode: couponCode || undefined,
          proofUrl, // Send proof URL
        }),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Failed to create checkout');
      }

      const result = await res.json();

      // Store previous plan for tracking
      const currentPlan = await fetch('/api/subscription')
        .then(r => r.json())
        .then(s => s?.plan || 'free')
        .catch(() => 'free');
      localStorage.setItem('previous_plan', currentPlan);

      // Redirect to payment gateway
      window.location.href = result.checkoutUrl;
    } catch (error: any) {
      toast.error(error.message || 'An error occurred');
      setIsSubmitting(false);
    }
  };

  const finalAmount = couponResult?.finalAmount || planDetails.price;
  const discountAmount = couponResult?.discountAmount || 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Checkout - {planDetails.name} Plan</CardTitle>
        <CardDescription>Complete your subscription payment</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className='space-y-6'>
          {/* Plan Summary */}
          <div className='space-y-2 rounded-lg border p-4'>
            <div className='flex justify-between'>
              <span>Plan:</span>
              <span className='font-medium'>{planDetails.name}</span>
            </div>
            <div className='flex justify-between'>
              <span>Price:</span>
              <span>PKR {planDetails.price.toLocaleString()}</span>
            </div>
            {couponResult?.valid && (
              <>
                <div className='flex justify-between text-green-600'>
                  <span>Discount:</span>
                  <span>-PKR {discountAmount.toLocaleString()}</span>
                </div>
                <div className='flex justify-between border-t pt-2 text-lg font-bold'>
                  <span>Total:</span>
                  <span>PKR {finalAmount.toLocaleString()}</span>
                </div>
              </>
            )}
          </div>

          {/* Coupon Code */}
          <div>
            <Label>Coupon Code (Optional)</Label>
            <div className='mt-1 flex gap-2'>
              <Input
                value={couponCode}
                onChange={e => setCouponCode(e.target.value.toUpperCase())}
                placeholder='Enter coupon code'
                disabled={couponValidating || isSubmitting}
              />
              <Button
                type='button'
                variant='outline'
                onClick={validateCoupon}
                disabled={couponValidating || isSubmitting || !couponCode.trim()}
              >
                {couponValidating ? 'Validating...' : 'Apply'}
              </Button>
            </div>
            {couponResult && (
              <div className='mt-2 flex items-center gap-2'>
                {couponResult.valid ? (
                  <>
                    <Check className='h-4 w-4 text-green-600' />
                    <span className='text-sm text-green-600'>
                      Coupon applied! Save PKR {discountAmount.toLocaleString()}
                    </span>
                  </>
                ) : (
                  <>
                    <X className='text-destructive h-4 w-4' />
                    <span className='text-destructive text-sm'>{couponResult.error}</span>
                  </>
                )}
              </div>
            )}
          </div>

          {/* Payment Gateway Selection */}
          <div>
            <Label>Payment Method *</Label>
            <div className='mt-2 grid gap-4 md:grid-cols-2'>
              <button
                type='button'
                onClick={() => setSelectedGateway('bank_transfer')}
                className={`rounded-lg border p-4 text-left transition-colors ${
                  selectedGateway === 'bank_transfer'
                    ? 'border-primary bg-primary/5'
                    : 'hover:bg-accent'
                }`}
              >
                <div className='font-medium'>Bank Transfer (Meezan)</div>
                <div className='text-muted-foreground text-sm'>Manual Transfer</div>
              </button>
              <button
                type='button'
                onClick={() => setSelectedGateway('jazzcash')}
                className={`rounded-lg border p-4 text-left transition-colors ${
                  selectedGateway === 'jazzcash' ? 'border-primary bg-primary/5' : 'hover:bg-accent'
                }`}
              >
                <div className='font-medium'>JazzCash / EasyPaisa / Raast</div>
                <div className='text-muted-foreground text-sm'>Mobile Wallets</div>
              </button>
            </div>

            {/* Bank Details Display */}
            <div className='bg-muted/50 mt-4 rounded-lg p-4 text-sm'>
              {selectedGateway === 'bank_transfer' && (
                <div className='space-y-2'>
                  <p className='text-primary font-semibold'>Meezan Bank Details:</p>
                  <div className='grid grid-cols-[100px_1fr] gap-1'>
                    <span className='text-muted-foreground'>Title:</span>
                    <span className='font-medium'>MUHAMMAD KASHIF</span>
                    <span className='text-muted-foreground'>Account:</span>
                    <span className='font-medium'>11330109676650</span>
                    <span className='text-muted-foreground'>IBAN:</span>
                    <span className='font-mono font-medium'>PK26MEZN0011330109676650</span>
                    <span className='text-muted-foreground'>Branch:</span>
                    <span>BHUBTIAN BRANCH LHR</span>
                  </div>
                  <p className='text-muted-foreground mt-2 text-xs'>
                    Please send the screenshot of your payment to support or upload here (Coming
                    Soon).
                  </p>
                </div>
              )}

              {selectedGateway === 'jazzcash' && (
                <div className='space-y-4'>
                  <div>
                    <p className='text-primary mb-1 font-semibold'>JazzCash / EasyPaisa:</p>
                    <div className='grid grid-cols-[100px_1fr] gap-1'>
                      <span className='text-muted-foreground'>Title:</span>
                      <span className='font-medium'>Muhammad Kashif</span>
                      <span className='text-muted-foreground'>Number:</span>
                      <span className='font-mono font-medium'>0302 0718182</span>
                    </div>
                  </div>

                  <div className='border-t pt-2'>
                    <p className='text-primary mb-1 font-semibold'>Raast ID:</p>
                    <p className='font-mono font-medium'>03020718182</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Receipt Upload for Manual Payments */}
          {['bank_transfer', 'jazzcash', 'easypaisa'].includes(selectedGateway) && (
            <div className='space-y-2'>
              <Label>Payment Receipt (Screenshot)</Label>
              <Input
                type='file'
                accept='image/*,application/pdf'
                onChange={e => {
                  const file = e.target.files?.[0];
                  if (file) setReceiptFile(file);
                }}
              />
              <p className='text-muted-foreground text-xs'>
                Please upload a screenshot of your payment transaction.
              </p>
            </div>
          )}

          <div className='flex gap-4'>
            <Button type='submit' disabled={isSubmitting} className='flex-1'>
              {isSubmitting
                ? 'Processing...'
                : ['bank_transfer', 'jazzcash', 'easypaisa'].includes(selectedGateway)
                  ? 'Confirm Payment'
                  : `Pay PKR ${finalAmount.toLocaleString()}`}
            </Button>
            <Button
              type='button'
              variant='outline'
              onClick={() => router.back()}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
