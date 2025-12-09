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
  const [selectedGateway, setSelectedGateway] = useState<PaymentGateway>('xpay');

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CheckoutFormData>({
    defaultValues: {
      gateway: 'xpay',
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

      const res = await fetch('/api/payments/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          plan,
          gateway: selectedGateway,
          couponCode: couponCode || undefined,
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
            <div className='mt-2 grid gap-4 md:grid-cols-3'>
              <button
                type='button'
                onClick={() => setSelectedGateway('xpay')}
                className={`rounded-lg border p-4 text-left transition-colors ${
                  selectedGateway === 'xpay' ? 'border-primary bg-primary/5' : 'hover:bg-accent'
                }`}
              >
                <div className='font-medium'>XPay (Bank Alfalah)</div>
                <div className='text-muted-foreground text-sm'>Recommended</div>
              </button>
              <button
                type='button'
                onClick={() => setSelectedGateway('jazzcash')}
                className={`rounded-lg border p-4 text-left transition-colors ${
                  selectedGateway === 'jazzcash' ? 'border-primary bg-primary/5' : 'hover:bg-accent'
                }`}
              >
                <div className='font-medium'>JazzCash</div>
                <div className='text-muted-foreground text-sm'>Mobile Wallet</div>
              </button>
              <button
                type='button'
                onClick={() => setSelectedGateway('easypaisa')}
                className={`rounded-lg border p-4 text-left transition-colors ${
                  selectedGateway === 'easypaisa'
                    ? 'border-primary bg-primary/5'
                    : 'hover:bg-accent'
                }`}
              >
                <div className='font-medium'>EasyPaisa</div>
                <div className='text-muted-foreground text-sm'>Mobile Wallet</div>
              </button>
            </div>
          </div>

          <div className='flex gap-4'>
            <Button type='submit' disabled={isSubmitting} className='flex-1'>
              {isSubmitting ? 'Processing...' : `Pay PKR ${finalAmount.toLocaleString()}`}
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
