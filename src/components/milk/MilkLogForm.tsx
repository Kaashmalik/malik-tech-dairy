'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';
import { usePostHogAnalytics } from '@/hooks/usePostHog';
import { invalidateMilkQueries } from '@/lib/query/farm-cache';
import { EmptyAnimals } from '@/components/ui/empty-state';

interface MilkLogFormData {
  animalId: string;
  date: string;
  session: 'morning' | 'evening';
  quantity: number;
  quality?: number;
  notes?: string;
}

interface MilkLogFormProps {
  animalId?: string;
  onSuccess?: () => void;
}

export function MilkLogForm({ animalId, onSuccess }: MilkLogFormProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { trackMilkLog } = usePostHogAnalytics();

  const {
    data: animalsData,
    isLoading: animalsLoading,
    isError: animalsError,
    refetch: refetchAnimals,
  } = useQuery({
    queryKey: ['animals'],
    queryFn: async () => {
      const res = await fetch('/api/animals?limit=100');
      if (!res.ok) throw new Error('Failed to load animals');
      const response = await res.json();
      return response.data;
    },
  });

  const animals = animalsData?.animals || [];
  const dairyAnimals = animals.filter((a: { species?: string }) =>
    ['cow', 'cattle', 'buffalo', 'goat', 'sheep'].includes(a.species?.toLowerCase() || '')
  );

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<MilkLogFormData>({
    defaultValues: {
      date: format(new Date(), 'yyyy-MM-dd'),
      session: 'morning',
      animalId: animalId || '',
    },
  });

  const onSubmit = async (data: MilkLogFormData) => {
    setIsSubmitting(true);

    try {
      const response = await fetch('/api/milk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      const result = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(result.error || 'Failed to save milk log');
      }

      await invalidateMilkQueries(queryClient);
      toast.success('Milk log created successfully');

      trackMilkLog({
        animalId: data.animalId,
        quantity: data.quantity,
        session: data.session,
      });

      if (onSuccess) {
        onSuccess();
      } else {
        router.push('/milk');
        router.refresh();
      }
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'An error occurred';
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (animalsLoading) {
    return (
      <Card>
        <CardContent className='text-muted-foreground py-12 text-center text-sm'>
          Loading animals...
        </CardContent>
      </Card>
    );
  }

  if (animalsError) {
    return (
      <Card>
        <CardContent className='space-y-4 py-12 text-center'>
          <p className='text-muted-foreground text-sm'>Could not load animals for milk logging.</p>
          <Button variant='outline' onClick={() => refetchAnimals()}>
            Try again
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (dairyAnimals.length === 0) {
    return (
      <Card>
        <CardContent className='py-8'>
          <EmptyAnimals onAdd={() => router.push('/animals/new')} />
          <p className='text-muted-foreground mt-2 text-center text-sm'>
            Add a cow, buffalo, goat, or sheep before logging milk.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Log Milk Production</CardTitle>
        <CardDescription>Record milk production for an animal</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className='space-y-4'>
          <div>
            <label className='text-sm font-medium'>Animal *</label>
            <select
              {...register('animalId', { required: 'Animal is required' })}
              className='mt-1 w-full rounded-md border px-3 py-2'
              disabled={!!animalId}
            >
              <option value=''>Select animal</option>
              {dairyAnimals.map(
                (animal: { id: string; tag: string; name?: string; species: string }) => (
                  <option key={animal.id} value={animal.id}>
                    {animal.tag} {animal.name ? `- ${animal.name}` : ''} ({animal.species})
                  </option>
                )
              )}
            </select>
            {errors.animalId && (
              <p className='text-destructive mt-1 text-sm'>{errors.animalId.message}</p>
            )}
          </div>

          <div className='grid gap-4 md:grid-cols-2'>
            <div>
              <label className='text-sm font-medium'>Date *</label>
              <input
                type='date'
                {...register('date', { required: 'Date is required' })}
                className='mt-1 w-full rounded-md border px-3 py-2'
              />
              {errors.date && (
                <p className='text-destructive mt-1 text-sm'>{errors.date.message}</p>
              )}
            </div>

            <div>
              <label className='text-sm font-medium'>Session *</label>
              <select
                {...register('session', { required: 'Session is required' })}
                className='mt-1 w-full rounded-md border px-3 py-2'
              >
                <option value='morning'>Morning</option>
                <option value='evening'>Evening</option>
              </select>
              {errors.session && (
                <p className='text-destructive mt-1 text-sm'>{errors.session.message}</p>
              )}
            </div>

            <div>
              <label className='text-sm font-medium'>Quantity (L) *</label>
              <input
                type='number'
                step='0.1'
                min='0'
                {...register('quantity', {
                  required: 'Quantity is required',
                  valueAsNumber: true,
                  min: { value: 0.1, message: 'Must be greater than 0' },
                })}
                className='mt-1 w-full rounded-md border px-3 py-2'
              />
              {errors.quantity && (
                <p className='text-destructive mt-1 text-sm'>{errors.quantity.message}</p>
              )}
            </div>

            <div>
              <label className='text-sm font-medium'>Quality (1-10)</label>
              <input
                type='number'
                step='1'
                min='1'
                max='10'
                {...register('quality', { valueAsNumber: true })}
                className='mt-1 w-full rounded-md border px-3 py-2'
              />
            </div>
          </div>

          <div>
            <label className='text-sm font-medium'>Notes</label>
            <textarea
              {...register('notes')}
              rows={3}
              className='mt-1 w-full rounded-md border px-3 py-2'
              placeholder='Optional notes...'
            />
          </div>

          <Button type='submit' disabled={isSubmitting} className='w-full'>
            {isSubmitting ? 'Saving...' : 'Save Milk Log'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
