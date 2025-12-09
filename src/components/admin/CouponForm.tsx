'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import type { Coupon } from '@/lib/coupons/types';

interface CouponFormProps {
  coupon?: Coupon;
  onSuccess: () => void;
  onCancel: () => void;
}

export function CouponForm({ coupon, onSuccess, onCancel }: CouponFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm<any>({
    defaultValues: coupon
      ? {
          ...coupon,
          validFrom: coupon.validFrom ? new Date(coupon.validFrom).toISOString().split('T')[0] : '',
          validUntil: coupon.validUntil
            ? new Date(coupon.validUntil).toISOString().split('T')[0]
            : '',
        }
      : {
          code: '',
          type: 'percentage',
          value: 0,
          targetPlans: ['all'],
          minAmount: 0,
          maxDiscount: 0,
          validFrom: '',
          validUntil: '',
          maxUses: 0,
          maxUsesPerUser: 1,
          description: '',
          isActive: true,
        },
  });

  const couponType = watch('type');

  const onSubmit = async (data: any) => {
    setIsSubmitting(true);

    try {
      const url = coupon ? `/api/admin/coupons/${coupon.id}` : '/api/admin/coupons';
      const method = coupon ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Failed to save coupon');
      }

      toast.success(coupon ? 'Coupon updated successfully' : 'Coupon created successfully');
      onSuccess();
    } catch (error: any) {
      toast.error(error.message || 'An error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{coupon ? 'Edit Coupon' : 'Create New Coupon'}</CardTitle>
        <CardDescription>
          {coupon ? 'Update coupon details' : 'Create a discount coupon for customers'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className='space-y-4'>
          <div className='grid gap-4 md:grid-cols-2'>
            <div>
              <Label>Coupon Code *</Label>
              <Input
                {...register('code', { required: 'Code is required' })}
                placeholder='SUMMER2024'
                disabled={!!coupon}
                className='uppercase'
              />
              {errors.code && (
                <p className='text-destructive mt-1 text-sm'>{errors.code.message as string}</p>
              )}
            </div>

            <div>
              <Label>Type *</Label>
              <Select value={watch('type')} onValueChange={value => setValue('type', value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='percentage'>Percentage</SelectItem>
                  <SelectItem value='fixed'>Fixed Amount</SelectItem>
                  <SelectItem value='free_trial'>Free Trial</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>
                Value * ({couponType === 'percentage' ? 'Percentage (0-100)' : 'Amount in PKR'})
              </Label>
              <Input
                type='number'
                {...register('value', {
                  required: 'Value is required',
                  min: 0,
                  max: couponType === 'percentage' ? 100 : undefined,
                  valueAsNumber: true,
                })}
                placeholder={couponType === 'percentage' ? '10' : '1000'}
              />
            </div>

            <div>
              <Label>Target Plans *</Label>
              <Select
                value={watch('targetPlans')?.[0] || 'all'}
                onValueChange={value =>
                  setValue('targetPlans', value === 'all' ? ['all'] : [value])
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='all'>All Plans</SelectItem>
                  <SelectItem value='starter'>Starter Only</SelectItem>
                  <SelectItem value='professional'>Professional Only</SelectItem>
                  <SelectItem value='enterprise'>Enterprise Only</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {couponType === 'percentage' && (
              <div>
                <Label>Max Discount (PKR)</Label>
                <Input
                  type='number'
                  {...register('maxDiscount', { valueAsNumber: true })}
                  placeholder='Optional'
                />
              </div>
            )}

            <div>
              <Label>Min Purchase Amount (PKR)</Label>
              <Input
                type='number'
                {...register('minAmount', { valueAsNumber: true })}
                placeholder='Optional'
              />
            </div>

            <div>
              <Label>Valid From *</Label>
              <Input
                type='date'
                {...register('validFrom', { required: 'Valid from date is required' })}
              />
            </div>

            <div>
              <Label>Valid Until *</Label>
              <Input
                type='date'
                {...register('validUntil', { required: 'Valid until date is required' })}
              />
            </div>

            <div>
              <Label>Max Uses (Total)</Label>
              <Input
                type='number'
                {...register('maxUses', { valueAsNumber: true })}
                placeholder='Unlimited if empty'
              />
            </div>

            <div>
              <Label>Max Uses Per User</Label>
              <Input
                type='number'
                {...register('maxUsesPerUser', { valueAsNumber: true })}
                defaultValue={1}
              />
            </div>
          </div>

          <div>
            <Label>Description</Label>
            <Textarea {...register('description')} placeholder='Optional description' rows={3} />
          </div>

          <div className='flex gap-4'>
            <Button type='submit' disabled={isSubmitting}>
              {isSubmitting ? 'Saving...' : coupon ? 'Update Coupon' : 'Create Coupon'}
            </Button>
            <Button type='button' variant='outline' onClick={onCancel}>
              Cancel
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
