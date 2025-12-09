'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ANIMAL_BREEDS } from '@/lib/constants';
import type { AnimalSpecies, CustomField } from '@/types';
import { useTenantLimits } from '@/hooks/useTenantLimits';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { usePostHogAnalytics } from '@/hooks/usePostHog';
import { CustomFieldsRenderer } from '@/components/custom-fields/CustomFieldsRenderer';

interface AnimalFormData {
  tag: string;
  name: string;
  species: AnimalSpecies;
  breed: string;
  dateOfBirth: string;
  gender: 'male' | 'female';
  photoUrl?: string;
  purchaseDate?: string;
  purchasePrice?: number;
  customFields?: Record<string, string | number | Date>;
}

interface AnimalFormProps {
  animalId?: string;
  initialData?: Partial<AnimalFormData>;
  onSuccess?: () => void;
}

export function AnimalForm({ animalId, initialData, onSuccess }: AnimalFormProps) {
  const router = useRouter();
  const { canAddAnimal } = useTenantLimits();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { trackAnimalCreation } = usePostHogAnalytics();
  const [selectedSpecies, setSelectedSpecies] = useState<AnimalSpecies>(
    initialData?.species || 'cow'
  );
  const [customFieldValues, setCustomFieldValues] = useState<
    Record<string, string | number | Date>
  >(initialData?.customFields || {});

  // Fetch custom fields
  const { data: customFieldsData } = useQuery<{ fields: CustomField[] }>({
    queryKey: ['custom-fields'],
    queryFn: async () => {
      const res = await fetch('/api/tenants/custom-fields');
      if (!res.ok) return { fields: [] };
      return res.json();
    },
  });

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<AnimalFormData>({
    defaultValues: initialData,
  });

  const onSubmit = async (data: AnimalFormData) => {
    if (!canAddAnimal && !animalId) {
      toast.error('Animal limit reached. Please upgrade your plan.');
      return;
    }

    setIsSubmitting(true);

    try {
      const url = animalId ? `/api/animals/${animalId}` : '/api/animals';
      const method = animalId ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...data,
          customFields: Object.keys(customFieldValues).length > 0 ? customFieldValues : undefined,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to save animal');
      }

      toast.success(animalId ? 'Animal updated successfully' : 'Animal created successfully');

      // Track event only on creation
      if (!animalId) {
        trackAnimalCreation({
          species: data.species,
          breed: data.breed,
        });
      }

      if (onSuccess) {
        onSuccess();
      } else {
        router.push('/dashboard/animals');
      }
    } catch (error: any) {
      toast.error(error.message || 'An error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  const breeds = ANIMAL_BREEDS[selectedSpecies] || [];

  return (
    <Card>
      <CardHeader>
        <CardTitle>{animalId ? 'Edit Animal' : 'Add New Animal'}</CardTitle>
        <CardDescription>
          {animalId ? 'Update animal information' : 'Add a new animal to your farm'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className='space-y-4'>
          <div className='grid gap-4 md:grid-cols-2'>
            <div>
              <label className='text-sm font-medium'>Tag Number *</label>
              <input
                {...register('tag', { required: 'Tag number is required' })}
                className='mt-1 w-full rounded-md border px-3 py-2'
                placeholder='e.g., COW-001'
              />
              {errors.tag && <p className='text-destructive mt-1 text-sm'>{errors.tag.message}</p>}
            </div>

            <div>
              <label className='text-sm font-medium'>Name</label>
              <input
                {...register('name')}
                className='mt-1 w-full rounded-md border px-3 py-2'
                placeholder='e.g., Bella'
              />
            </div>

            <div>
              <label className='text-sm font-medium'>Species *</label>
              <select
                {...register('species', { required: 'Species is required' })}
                className='mt-1 w-full rounded-md border px-3 py-2'
                onChange={e => setSelectedSpecies(e.target.value as AnimalSpecies)}
              >
                <option value='cow'>Cow</option>
                <option value='buffalo'>Buffalo</option>
                <option value='chicken'>Chicken (Poultry)</option>
                <option value='goat'>Goat</option>
                <option value='sheep'>Sheep</option>
                <option value='horse'>Horse</option>
              </select>
              {errors.species && (
                <p className='text-destructive mt-1 text-sm'>{errors.species.message}</p>
              )}
            </div>

            <div>
              <label className='text-sm font-medium'>Breed</label>
              <select {...register('breed')} className='mt-1 w-full rounded-md border px-3 py-2'>
                <option value=''>Select breed</option>
                {breeds.map(breed => (
                  <option key={breed} value={breed}>
                    {breed}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className='text-sm font-medium'>Date of Birth *</label>
              <input
                type='date'
                {...register('dateOfBirth', { required: 'Date of birth is required' })}
                className='mt-1 w-full rounded-md border px-3 py-2'
              />
              {errors.dateOfBirth && (
                <p className='text-destructive mt-1 text-sm'>{errors.dateOfBirth.message}</p>
              )}
            </div>

            <div>
              <label className='text-sm font-medium'>Gender *</label>
              <select
                {...register('gender', { required: 'Gender is required' })}
                className='mt-1 w-full rounded-md border px-3 py-2'
              >
                <option value=''>Select gender</option>
                <option value='male'>Male</option>
                <option value='female'>Female</option>
              </select>
              {errors.gender && (
                <p className='text-destructive mt-1 text-sm'>{errors.gender.message}</p>
              )}
            </div>

            <div>
              <label className='text-sm font-medium'>Purchase Date</label>
              <input
                type='date'
                {...register('purchaseDate')}
                className='mt-1 w-full rounded-md border px-3 py-2'
              />
            </div>

            <div>
              <label className='text-sm font-medium'>Purchase Price (PKR)</label>
              <input
                type='number'
                {...register('purchasePrice', { valueAsNumber: true })}
                className='mt-1 w-full rounded-md border px-3 py-2'
                placeholder='0'
              />
            </div>
          </div>

          {/* Custom Fields */}
          {customFieldsData?.fields && customFieldsData.fields.length > 0 && (
            <div className='mt-6'>
              <CustomFieldsRenderer
                fields={customFieldsData.fields}
                values={customFieldValues}
                onChange={(fieldId, value) => {
                  setCustomFieldValues(prev => ({ ...prev, [fieldId]: value }));
                }}
              />
            </div>
          )}

          <div className='flex gap-4'>
            <Button type='submit' disabled={isSubmitting}>
              {isSubmitting ? 'Saving...' : animalId ? 'Update Animal' : 'Add Animal'}
            </Button>
            <Button type='button' variant='outline' onClick={() => router.back()}>
              Cancel
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
