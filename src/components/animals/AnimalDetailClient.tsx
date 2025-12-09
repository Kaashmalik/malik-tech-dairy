'use client';

import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Edit, Trash2, ArrowLeft } from 'lucide-react';
import { AnimalForm } from './AnimalForm';
import { useState } from 'react';
import { toast } from 'sonner';
import type { Animal } from '@/types';

export function AnimalDetailClient({ animalId }: { animalId: string }) {
  const router = useRouter();
  const [isEditing, setIsEditing] = useState(false);

  const {
    data: animal,
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ['animal', animalId],
    queryFn: async () => {
      const res = await fetch(`/api/animals/${animalId}`);
      if (!res.ok) throw new Error('Failed to fetch animal');
      const data = await res.json();
      return data.animal as Animal;
    },
  });

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this animal?')) {
      return;
    }

    try {
      const res = await fetch(`/api/animals/${animalId}`, {
        method: 'DELETE',
      });

      if (!res.ok) throw new Error('Failed to delete animal');

      toast.success('Animal deleted successfully');
      router.push('/dashboard/animals');
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete animal');
    }
  };

  if (isLoading) {
    return <div className='py-8 text-center'>Loading animal details...</div>;
  }

  if (!animal) {
    return (
      <div className='py-8 text-center'>
        <p className='text-muted-foreground mb-4'>Animal not found</p>
        <Button onClick={() => router.push('/dashboard/animals')}>Back to Animals</Button>
      </div>
    );
  }

  if (isEditing) {
    return (
      <div className='container max-w-4xl'>
        <AnimalForm
          animalId={animalId}
          initialData={{
            tag: animal.tag,
            name: animal.name,
            species: animal.species,
            breed: animal.breed,
            dateOfBirth: animal.dateOfBirth
              ? new Date(animal.dateOfBirth).toISOString().split('T')[0]
              : '',
            gender: animal.gender,
            photoUrl: animal.photoUrl,
            purchaseDate: animal.purchaseDate
              ? new Date(animal.purchaseDate).toISOString().split('T')[0]
              : undefined,
            purchasePrice: animal.purchasePrice,
          }}
          onSuccess={() => {
            setIsEditing(false);
            refetch();
          }}
        />
      </div>
    );
  }

  return (
    <div className='space-y-6'>
      <div className='flex items-center justify-between'>
        <Button variant='outline' onClick={() => router.back()}>
          <ArrowLeft className='mr-2 h-4 w-4' />
          Back
        </Button>
        <div className='flex gap-2'>
          <Button variant='outline' onClick={() => setIsEditing(true)}>
            <Edit className='mr-2 h-4 w-4' />
            Edit
          </Button>
          <Button variant='destructive' onClick={handleDelete}>
            <Trash2 className='mr-2 h-4 w-4' />
            Delete
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className='flex items-center justify-between'>
            <div>
              <CardTitle className='text-2xl'>{animal.tag}</CardTitle>
              {animal.name && <CardDescription className='text-lg'>{animal.name}</CardDescription>}
            </div>
            {animal.photoUrl && (
              <img
                src={animal.photoUrl}
                alt={animal.name || animal.tag}
                className='h-24 w-24 rounded-lg object-cover'
              />
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className='grid gap-4 md:grid-cols-2'>
            <div>
              <label className='text-muted-foreground text-sm font-medium'>Species</label>
              <p className='text-lg capitalize'>{animal.species}</p>
            </div>
            <div>
              <label className='text-muted-foreground text-sm font-medium'>Breed</label>
              <p className='text-lg'>{animal.breed || 'N/A'}</p>
            </div>
            <div>
              <label className='text-muted-foreground text-sm font-medium'>Gender</label>
              <p className='text-lg capitalize'>{animal.gender}</p>
            </div>
            <div>
              <label className='text-muted-foreground text-sm font-medium'>Status</label>
              <p className='text-lg capitalize'>{animal.status}</p>
            </div>
            <div>
              <label className='text-muted-foreground text-sm font-medium'>Date of Birth</label>
              <p className='text-lg'>
                {animal.dateOfBirth ? new Date(animal.dateOfBirth).toLocaleDateString() : 'N/A'}
              </p>
            </div>
            {animal.purchaseDate && (
              <div>
                <label className='text-muted-foreground text-sm font-medium'>Purchase Date</label>
                <p className='text-lg'>{new Date(animal.purchaseDate).toLocaleDateString()}</p>
              </div>
            )}
            {animal.purchasePrice && (
              <div>
                <label className='text-muted-foreground text-sm font-medium'>Purchase Price</label>
                <p className='text-lg'>PKR {animal.purchasePrice.toLocaleString()}</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
