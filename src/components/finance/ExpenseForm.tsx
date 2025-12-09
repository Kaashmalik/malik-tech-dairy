'use client';

import { useForm } from 'react-hook-form';
import { useMutation } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import type { Expense } from '@/types';
import { format } from 'date-fns';

interface ExpenseFormProps {
  onClose: () => void;
  onSuccess: () => void;
}

export function ExpenseForm({ onClose, onSuccess }: ExpenseFormProps) {
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<Partial<Expense>>({
    defaultValues: {
      date: format(new Date(), 'yyyy-MM-dd'),
      category: 'feed',
      description: '',
      amount: '',
    },
  });

  const mutation = useMutation({
    mutationFn: async (data: Partial<Expense>) => {
      const res = await fetch('/api/expenses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Failed to save expense');
      }

      return res.json();
    },
    onSuccess: () => {
      onSuccess();
    },
  });

  const onSubmit = (data: Partial<Expense>) => {
    mutation.mutate(data);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Add Expense</CardTitle>
        <CardDescription>Record a farm expense</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className='space-y-4'>
          <div>
            <Label htmlFor='date'>Date *</Label>
            <Input id='date' type='date' {...register('date', { required: true })} />
          </div>

          <div>
            <Label htmlFor='category'>Category *</Label>
            <Select
              value={watch('category') || 'feed'}
              onValueChange={value => setValue('category', value as Expense['category'])}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value='feed'>Feed</SelectItem>
                <SelectItem value='medicine'>Medicine</SelectItem>
                <SelectItem value='labor'>Labor</SelectItem>
                <SelectItem value='equipment'>Equipment</SelectItem>
                <SelectItem value='utilities'>Utilities</SelectItem>
                <SelectItem value='other'>Other</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor='description'>Description *</Label>
            <Textarea
              id='description'
              {...register('description', { required: true })}
              placeholder='Describe the expense...'
              rows={3}
            />
          </div>

          <div>
            <Label htmlFor='amount'>Amount (PKR) *</Label>
            <Input
              id='amount'
              type='number'
              step='0.01'
              {...register('amount', { required: true, min: 0 })}
              placeholder='0.00'
            />
          </div>

          <div className='flex justify-end gap-2'>
            <Button type='button' variant='outline' onClick={onClose}>
              Cancel
            </Button>
            <Button type='submit' disabled={mutation.isPending}>
              {mutation.isPending ? 'Saving...' : 'Add Expense'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
