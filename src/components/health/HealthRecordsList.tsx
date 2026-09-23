'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { Plus, Calendar, DollarSign, User, AlertCircle } from 'lucide-react';
import Link from 'next/link';
import { HealthRecordForm } from './HealthRecordForm';
import { useState } from 'react';
import type { HealthRecord, Animal } from '@/types';
import { EmptyHealthRecords, EmptyAnimals, EmptyError } from '@/components/ui/empty-state';
import { invalidateHealthQueries } from '@/lib/query/farm-cache';

interface HealthRecordsListProps {
  animalId?: string;
}

export function HealthRecordsList({ animalId }: HealthRecordsListProps) {
  const router = useRouter();
  const [showForm, setShowForm] = useState(false);
  const [editingRecord, setEditingRecord] = useState<HealthRecord | null>(null);
  const queryClient = useQueryClient();

  const { data, isLoading, isError, refetch } = useQuery<{ records: HealthRecord[] }>({
    queryKey: ['health-records', animalId],
    queryFn: async () => {
      const url = animalId ? `/api/health/records?animalId=${animalId}` : '/api/health/records';
      const res = await fetch(url);
      if (!res.ok) throw new Error('Failed to fetch records');
      return res.json();
    },
  });

  const { data: animalsData } = useQuery<{ animals: Animal[] }>({
    queryKey: ['animals', 'health-lookup'],
    queryFn: async () => {
      const res = await fetch('/api/animals?limit=100&page=1');
      if (!res.ok) throw new Error('Failed to fetch animals');
      const response = await res.json();
      return response.data;
    },
    enabled: !animalId,
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/health/records/${id}`, {
        method: 'DELETE',
      });
      if (!res.ok) throw new Error('Failed to delete record');
    },
    onSuccess: () => {
      void invalidateHealthQueries(queryClient);
    },
  });

  const getTypeColor = (type: HealthRecord['type']) => {
    switch (type) {
      case 'vaccination':
        return 'bg-green-100 text-green-800';
      case 'treatment':
        return 'bg-blue-100 text-blue-800';
      case 'checkup':
        return 'bg-purple-100 text-purple-800';
      case 'disease':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const animalList = animalsData?.animals || [];

  const getAnimalName = (id: string) => {
    const animal = animalList.find(a => a.id === id);
    return animal ? `${animal.name || 'Unnamed'} (${animal.tag})` : id;
  };

  if (isLoading) {
    return (
      <div className='text-muted-foreground py-8 text-center text-sm'>
        Loading health records...
      </div>
    );
  }

  if (isError) {
    return (
      <Card>
        <CardContent className='py-8'>
          <EmptyError onRetry={() => refetch()} />
        </CardContent>
      </Card>
    );
  }

  const records = data?.records || [];
  const hasAnimals = Boolean(animalId) || animalList.length > 0;

  return (
    <div className='space-y-4'>
      <div className='flex items-center justify-between'>
        <div>
          <h2 className='text-2xl font-bold'>Health Records</h2>
          <p className='text-muted-foreground'>
            Track vaccinations, treatments, checkups, and diseases
          </p>
        </div>
        <Button onClick={() => setShowForm(true)} disabled={!hasAnimals}>
          <Plus className='mr-2 h-4 w-4' />
          Add Record
        </Button>
      </div>

      {showForm && (
        <HealthRecordForm
          animalId={animalId}
          record={editingRecord}
          onClose={() => {
            setShowForm(false);
            setEditingRecord(null);
          }}
          onSuccess={() => {
            setShowForm(false);
            setEditingRecord(null);
            void invalidateHealthQueries(queryClient);
          }}
        />
      )}

      {!hasAnimals ? (
        <Card>
          <CardContent className='py-8'>
            <EmptyAnimals onAdd={() => router.push('/animals/new')} />
            <p className='text-muted-foreground mt-2 text-center text-sm'>
              Add an animal before recording vaccinations or treatments.
            </p>
          </CardContent>
        </Card>
      ) : records.length === 0 ? (
        <Card>
          <CardContent className='py-8'>
            <EmptyHealthRecords onAdd={() => setShowForm(true)} />
          </CardContent>
        </Card>
      ) : (
        <div className='grid gap-4'>
          {records.map(record => (
            <Card key={record.id}>
              <CardHeader>
                <div className='flex items-start justify-between'>
                  <div className='flex-1'>
                    <div className='mb-2 flex items-center gap-2'>
                      <CardTitle className='text-lg'>
                        {!animalId && (
                          <Link href={`/animals/${record.animalId}`} className='hover:underline'>
                            {getAnimalName(record.animalId)}
                          </Link>
                        )}
                        {animalId && 'Health Record'}
                      </CardTitle>
                      <Badge className={getTypeColor(record.type)}>{record.type}</Badge>
                    </div>
                    <CardDescription>{record.description}</CardDescription>
                  </div>
                  <div className='flex gap-2'>
                    <Button
                      variant='outline'
                      size='sm'
                      onClick={() => {
                        setEditingRecord(record);
                        setShowForm(true);
                      }}
                    >
                      Edit
                    </Button>
                    <Button
                      variant='destructive'
                      size='sm'
                      onClick={() => {
                        if (confirm('Are you sure you want to delete this record?')) {
                          deleteMutation.mutate(record.id);
                        }
                      }}
                    >
                      Delete
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className='grid gap-2 text-sm md:grid-cols-2'>
                  <div className='flex items-center gap-2'>
                    <Calendar className='text-muted-foreground h-4 w-4' />
                    <span className='text-muted-foreground'>Date:</span>
                    <span>
                      {(() => {
                        try {
                          const d = new Date(record.date);
                          if (isNaN(d.getTime())) return 'N/A';
                          return format(d, 'MMM d, yyyy');
                        } catch {
                          return 'N/A';
                        }
                      })()}
                    </span>
                  </div>
                  {record.veterinarian && (
                    <div className='flex items-center gap-2'>
                      <User className='text-muted-foreground h-4 w-4' />
                      <span className='text-muted-foreground'>Vet:</span>
                      <span>{record.veterinarian}</span>
                    </div>
                  )}
                  {record.cost && (
                    <div className='flex items-center gap-2'>
                      <DollarSign className='text-muted-foreground h-4 w-4' />
                      <span className='text-muted-foreground'>Cost:</span>
                      <span>PKR {record.cost.toLocaleString()}</span>
                    </div>
                  )}
                  {record.nextDueDate && (
                    <div className='flex items-center gap-2'>
                      <AlertCircle className='h-4 w-4 text-yellow-500' />
                      <span className='text-muted-foreground'>Next Due:</span>
                      <span className='font-semibold'>
                        {(() => {
                          try {
                            const d = new Date(record.nextDueDate!);
                            if (isNaN(d.getTime())) return 'N/A';
                            return format(d, 'MMM d, yyyy');
                          } catch {
                            return 'N/A';
                          }
                        })()}
                      </span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
