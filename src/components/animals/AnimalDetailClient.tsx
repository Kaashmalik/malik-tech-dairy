'use client';

import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Edit, Trash2, ArrowLeft, Heart, Droplets, Baby, Activity } from 'lucide-react';
import { AnimalForm } from './AnimalForm';
import { useState } from 'react';
import { toast } from 'sonner';
import type { Animal } from '@/types';

interface AnimalProfileResponse {
  success: boolean;
  animal: Animal;
  data?: {
    animal: Animal;
    recentMilk?: Array<{ date: string; quantity: number; session?: string }>;
    recentHealth?: Array<{ id: string; type: string; date: string; description?: string }>;
    recentBreeding?: Array<{ id: string; breedingDate: string; status: string }>;
    summary?: { totalMilkLogs: number; totalMilkedLiters: number };
  };
}

export function AnimalDetailClient({ animalId }: { animalId: string }) {
  const router = useRouter();
  const [isEditing, setIsEditing] = useState(false);

  const {
    data: profile,
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: ['animal', animalId],
    queryFn: async () => {
      const res = await fetch(`/api/animals/${animalId}`);
      if (!res.ok) throw new Error('Failed to fetch animal');
      return (await res.json()) as AnimalProfileResponse;
    },
  });

  const animal = profile?.animal ?? profile?.data?.animal;
  const recentHealth = profile?.data?.recentHealth || [];
  const recentMilk = profile?.data?.recentMilk || [];
  const recentBreeding = profile?.data?.recentBreeding || [];
  const summary = profile?.data?.summary;

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
      router.push('/animals');
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to delete animal';
      toast.error(message);
    }
  };

  if (isLoading) {
    return <div className='py-8 text-center'>Loading animal details...</div>;
  }

  if (isError || !animal) {
    return (
      <div className='py-8 text-center'>
        <p className='text-muted-foreground mb-4'>Animal not found</p>
        <Button onClick={() => router.push('/animals')}>Back to Animals</Button>
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
      <div className='flex flex-wrap items-center justify-between gap-3'>
        <Button variant='outline' onClick={() => router.push('/animals')}>
          <ArrowLeft className='mr-2 h-4 w-4' />
          Back to Animals
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

      {/* Sub-page navigation */}
      <div className='flex flex-wrap gap-2'>
        <Button variant='secondary' size='sm' asChild>
          <Link href={`/animals/${animalId}`}>
            <Activity className='mr-2 h-4 w-4' />
            Overview
          </Link>
        </Button>
        <Button variant='outline' size='sm' asChild>
          <Link href={`/animals/${animalId}/health`}>
            <Heart className='mr-2 h-4 w-4' />
            Health
          </Link>
        </Button>
        <Button variant='outline' size='sm' asChild>
          <Link href={`/milk?animalId=${animalId}`}>
            <Droplets className='mr-2 h-4 w-4' />
            Milk
          </Link>
        </Button>
        <Button variant='outline' size='sm' asChild>
          <Link href={`/breeding?animalId=${animalId}`}>
            <Baby className='mr-2 h-4 w-4' />
            Breeding
          </Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className='flex items-center justify-between gap-4'>
            <div>
              <CardTitle className='text-2xl'>{animal.tag}</CardTitle>
              {animal.name && <CardDescription className='text-lg'>{animal.name}</CardDescription>}
              <div className='mt-2 flex flex-wrap gap-2'>
                <Badge variant='outline' className='capitalize'>
                  {animal.species}
                </Badge>
                <Badge variant='outline' className='capitalize'>
                  {animal.gender}
                </Badge>
                <Badge className='capitalize'>{animal.status}</Badge>
              </div>
            </div>
            {animal.photoUrl && (
              <Image
                src={animal.photoUrl}
                alt={animal.name || animal.tag}
                width={96}
                height={96}
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
            {summary && (
              <div>
                <label className='text-muted-foreground text-sm font-medium'>Milk (all time)</label>
                <p className='text-lg'>
                  {summary.totalMilkedLiters} L ({summary.totalMilkLogs} logs)
                </p>
              </div>
            )}
            {animal.purchaseDate && (
              <div>
                <label className='text-muted-foreground text-sm font-medium'>Purchase Date</label>
                <p className='text-lg'>{new Date(animal.purchaseDate).toLocaleDateString()}</p>
              </div>
            )}
            {animal.purchasePrice != null && (
              <div>
                <label className='text-muted-foreground text-sm font-medium'>Purchase Price</label>
                <p className='text-lg'>PKR {Number(animal.purchasePrice).toLocaleString()}</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <div className='grid gap-4 md:grid-cols-3'>
        <Card>
          <CardHeader className='pb-2'>
            <CardTitle className='flex items-center text-base'>
              <Heart className='mr-2 h-4 w-4' />
              Recent Health
            </CardTitle>
          </CardHeader>
          <CardContent className='space-y-2 text-sm'>
            {recentHealth.length === 0 ? (
              <p className='text-muted-foreground'>No health records yet.</p>
            ) : (
              recentHealth.slice(0, 5).map(record => (
                <div
                  key={record.id}
                  className='flex justify-between gap-2 border-b py-1 last:border-0'
                >
                  <span className='capitalize'>{record.type || 'record'}</span>
                  <span className='text-muted-foreground'>
                    {record.date ? new Date(record.date).toLocaleDateString() : ''}
                  </span>
                </div>
              ))
            )}
            <Button variant='link' className='h-auto px-0' asChild>
              <Link href={`/animals/${animalId}/health`}>View all health records</Link>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className='pb-2'>
            <CardTitle className='flex items-center text-base'>
              <Droplets className='mr-2 h-4 w-4' />
              Recent Milk
            </CardTitle>
          </CardHeader>
          <CardContent className='space-y-2 text-sm'>
            {recentMilk.length === 0 ? (
              <p className='text-muted-foreground'>No milk logs yet.</p>
            ) : (
              recentMilk.slice(0, 5).map((log, idx) => (
                <div key={idx} className='flex justify-between gap-2 border-b py-1 last:border-0'>
                  <span>
                    {log.quantity} L {log.session ? `(${log.session})` : ''}
                  </span>
                  <span className='text-muted-foreground'>
                    {log.date ? new Date(log.date).toLocaleDateString() : ''}
                  </span>
                </div>
              ))
            )}
            <Button variant='link' className='h-auto px-0' asChild>
              <Link href={`/milk?animalId=${animalId}`}>View milk logs</Link>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className='pb-2'>
            <CardTitle className='flex items-center text-base'>
              <Baby className='mr-2 h-4 w-4' />
              Recent Breeding
            </CardTitle>
          </CardHeader>
          <CardContent className='space-y-2 text-sm'>
            {recentBreeding.length === 0 ? (
              <p className='text-muted-foreground'>No breeding records yet.</p>
            ) : (
              recentBreeding.slice(0, 5).map(record => (
                <div
                  key={record.id}
                  className='flex justify-between gap-2 border-b py-1 last:border-0'
                >
                  <span className='capitalize'>{record.status}</span>
                  <span className='text-muted-foreground'>
                    {record.breedingDate ? new Date(record.breedingDate).toLocaleDateString() : ''}
                  </span>
                </div>
              ))
            )}
            <Button variant='link' className='h-auto px-0' asChild>
              <Link href={`/breeding?animalId=${animalId}`}>View breeding</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
