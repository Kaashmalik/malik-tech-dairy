'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { format, differenceInDays } from 'date-fns';
import { Plus, Calendar, AlertCircle, CheckCircle2, Clock } from 'lucide-react';
import Link from 'next/link';
import { BreedingForm } from './BreedingForm';
import { useState } from 'react';
import type { BreedingRecord, Animal } from '@/types';

export function BreedingList() {
  const [showForm, setShowForm] = useState(false);
  const [editingRecord, setEditingRecord] = useState<BreedingRecord | null>(null);
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery<{ records: BreedingRecord[] }>({
    queryKey: ['breeding-records'],
    queryFn: async () => {
      const res = await fetch('/api/breeding');
      if (!res.ok) throw new Error('Failed to fetch records');
      return res.json();
    },
  });

  const { data: heatAlerts } = useQuery<{ alerts: any[] }>({
    queryKey: ['heat-alerts'],
    queryFn: async () => {
      const res = await fetch('/api/breeding/heat-alerts');
      if (!res.ok) throw new Error('Failed to fetch heat alerts');
      return res.json();
    },
  });

  const { data: animals } = useQuery<{ animals: Animal[] }>({
    queryKey: ['animals'],
    queryFn: async () => {
      const res = await fetch('/api/animals');
      if (!res.ok) throw new Error('Failed to fetch animals');
      return res.json();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/breeding/${id}`, {
        method: 'DELETE',
      });
      if (!res.ok) throw new Error('Failed to delete record');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['breeding-records'] });
    },
  });

  const getAnimalName = (id: string) => {
    if (!animals) return id;
    const animal = animals.animals.find(a => a.id === id);
    return animal ? `${animal.name} (${animal.tag})` : id;
  };

  const getStatusColor = (status: BreedingRecord['status']) => {
    switch (status) {
      case 'pregnant':
        return 'bg-blue-100 text-blue-800';
      case 'calved':
        return 'bg-green-100 text-green-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      case 'in_progress':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (isLoading) {
    return <div className='py-8 text-center'>Loading breeding records...</div>;
  }

  const records = data?.records || [];
  const alerts = heatAlerts?.alerts || [];

  return (
    <div className='space-y-4'>
      <div className='flex items-center justify-between'>
        <div>
          <h2 className='text-2xl font-bold'>Breeding Management</h2>
          <p className='text-muted-foreground'>
            Track breeding cycles, pregnancies, and calving dates
          </p>
        </div>
        <Button onClick={() => setShowForm(true)}>
          <Plus className='mr-2 h-4 w-4' />
          Add Breeding Record
        </Button>
      </div>

      {/* Heat Alerts */}
      {alerts.length > 0 && (
        <Alert>
          <AlertCircle className='h-4 w-4' />
          <AlertTitle>Heat Alerts</AlertTitle>
          <AlertDescription>
            <div className='mt-2 space-y-2'>
              {alerts.map(alert => (
                <div key={alert.animalId} className='flex items-center justify-between'>
                  <div>
                    <span className='font-semibold'>{alert.animalName}</span> ({alert.animalTag})
                    {alert.status === 'in_heat' ? (
                      <Badge variant='destructive' className='ml-2'>
                        In Heat Now
                      </Badge>
                    ) : (
                      <Badge variant='outline' className='ml-2'>
                        Heat in {alert.daysUntilHeat} days
                      </Badge>
                    )}
                  </div>
                  <Button
                    variant='outline'
                    size='sm'
                    onClick={() => {
                      // Pre-fill form with this animal
                      setShowForm(true);
                    }}
                  >
                    Record Breeding
                  </Button>
                </div>
              ))}
            </div>
          </AlertDescription>
        </Alert>
      )}

      {showForm && (
        <BreedingForm
          record={editingRecord}
          onClose={() => {
            setShowForm(false);
            setEditingRecord(null);
          }}
          onSuccess={() => {
            setShowForm(false);
            setEditingRecord(null);
            queryClient.invalidateQueries({ queryKey: ['breeding-records', 'heat-alerts'] });
          }}
        />
      )}

      {records.length === 0 ? (
        <Card>
          <CardContent className='py-12 text-center'>
            <AlertCircle className='text-muted-foreground mx-auto mb-4 h-12 w-12' />
            <p className='text-muted-foreground'>No breeding records yet</p>
            <Button variant='outline' className='mt-4' onClick={() => setShowForm(true)}>
              <Plus className='mr-2 h-4 w-4' />
              Add First Record
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className='grid gap-4'>
          {records.map(record => {
            const daysUntilCalving = record.expectedCalvingDate
              ? differenceInDays(new Date(record.expectedCalvingDate), new Date())
              : null;

            return (
              <Card key={record.id}>
                <CardHeader>
                  <div className='flex items-start justify-between'>
                    <div className='flex-1'>
                      <div className='mb-2 flex items-center gap-2'>
                        <CardTitle className='text-lg'>
                          <Link
                            href={`/dashboard/animals/${record.animalId}`}
                            className='hover:underline'
                          >
                            {getAnimalName(record.animalId)}
                          </Link>
                        </CardTitle>
                        <Badge className={getStatusColor(record.status)}>{record.status}</Badge>
                      </div>
                      {record.notes && <CardDescription>{record.notes}</CardDescription>}
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
                      <span className='text-muted-foreground'>Breeding Date:</span>
                      <span>{format(new Date(record.breedingDate), 'MMM d, yyyy')}</span>
                    </div>
                    {record.expectedCalvingDate && (
                      <div className='flex items-center gap-2'>
                        <Clock className='text-muted-foreground h-4 w-4' />
                        <span className='text-muted-foreground'>Expected Calving:</span>
                        <span className='font-semibold'>
                          {format(new Date(record.expectedCalvingDate), 'MMM d, yyyy')}
                          {daysUntilCalving !== null && daysUntilCalving > 0 && (
                            <span className='text-muted-foreground ml-1'>
                              ({daysUntilCalving} days)
                            </span>
                          )}
                        </span>
                      </div>
                    )}
                    {record.actualCalvingDate && (
                      <div className='flex items-center gap-2'>
                        <CheckCircle2 className='h-4 w-4 text-green-500' />
                        <span className='text-muted-foreground'>Calved:</span>
                        <span>{format(new Date(record.actualCalvingDate), 'MMM d, yyyy')}</span>
                      </div>
                    )}
                    {record.sireId && (
                      <div className='flex items-center gap-2'>
                        <span className='text-muted-foreground'>Sire:</span>
                        <span>{getAnimalName(record.sireId)}</span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
