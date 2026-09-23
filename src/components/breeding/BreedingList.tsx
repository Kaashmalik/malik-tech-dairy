'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Plus,
  Calendar,
  AlertCircle,
  CheckCircle2,
  Clock,
  Syringe,
  Heart,
  Baby,
  Trash2,
  Edit,
  Stethoscope,
} from 'lucide-react';
import { BreedingForm } from './BreedingForm';
import { PregnancyCheckForm } from './PregnancyCheckForm';
import { useState } from 'react';
import type { BreedingRecord, Animal } from '@/types';
import { BREEDING_STATUSES } from '@/lib/breeding-constants';
import { format } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { EmptyBreedingRecords, EmptyAnimals, EmptyError } from '@/components/ui/empty-state';
import { invalidateBreedingQueries } from '@/lib/query/farm-cache';
import { PlanUpgradeNotice } from '@/components/subscription/PlanUpgradeNotice';
import Link from 'next/link';

interface EnhancedBreedingRecord extends BreedingRecord {
  daysRemaining?: number;
  progressPercent?: number;
  isOverdue?: boolean;
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: {
      type: 'spring',
      stiffness: 100,
    },
  },
};

export function BreedingList() {
  const router = useRouter();
  const [showForm, setShowForm] = useState(false);
  const [editingRecord, setEditingRecord] = useState<Partial<BreedingRecord> | null>(null);
  const [pregnancyCheckRecord, setPregnancyCheckRecord] = useState<EnhancedBreedingRecord | null>(
    null
  );
  const queryClient = useQueryClient();

  const {
    data: breedingData,
    isLoading: breedingLoading,
    error: breedingError,
    refetch: refetchBreeding,
    isError: isBreedingError,
  } = useQuery<{
    data: EnhancedBreedingRecord[];
    error?: string;
  }>({
    queryKey: ['breeding-records'],
    queryFn: async () => {
      const res = await fetch('/api/breeding');
      const json = await res.json();
      if (res.status === 403 && typeof json.error === 'string') {
        throw new Error(json.error);
      }
      if (!res.ok) throw new Error(json.error || 'Failed to fetch breeding records');
      return json;
    },
    staleTime: 60000,
  });

  const { data: animalsData } = useQuery<{ animals: Animal[] }>({
    queryKey: ['animals'],
    queryFn: async () => {
      const res = await fetch('/api/animals');
      if (!res.ok) throw new Error('Failed to fetch animals');
      const response = await res.json();
      return response.data;
    },
    staleTime: 60000,
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/breeding/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete record');
      return res.json();
    },
    onSuccess: () => {
      void invalidateBreedingQueries(queryClient);
    },
  });

  const records = breedingData?.data || [];
  const animals = animalsData?.animals || [];
  const femaleAnimals = animals.filter(a => a.gender === 'female' && a.status === 'active');

  const getAnimalName = (id: string) => {
    const animal = animals.find(a => a.id === id);
    return animal ? `${animal.name || animal.tag}` : 'Unknown';
  };

  const getAnimalDetails = (id: string) => {
    return animals.find(a => a.id === id);
  };

  const getStatusConfig = (status: string) => {
    const config = BREEDING_STATUSES.find(s => s.value === status);
    return config || { label: status, color: 'gray', icon: '❓' };
  };

  const getStatusVariant = (
    status: string
  ): 'default' | 'secondary' | 'destructive' | 'outline' => {
    switch (status) {
      case 'pregnant':
      case 'confirmed':
        return 'default';
      case 'delivered':
        return 'secondary';
      case 'failed':
      case 'not_pregnant':
      case 'overdue':
        return 'destructive';
      default:
        return 'outline';
    }
  };

  const handleFormSuccess = () => {
    setShowForm(false);
    setEditingRecord(null);
    void invalidateBreedingQueries(queryClient);
  };

  const handlePregnancyCheckSuccess = () => {
    setPregnancyCheckRecord(null);
    void invalidateBreedingQueries(queryClient);
  };

  // Summary stats
  const stats = {
    total: records.length,
    pregnant: records.filter(r => ['pregnant', 'confirmed'].includes(r.status)).length,
    pending: records.filter(r => ['inseminated', 'check_pending'].includes(r.status)).length,
    overdue: records.filter(r => r.isOverdue).length,
    delivered: records.filter(r => r.status === 'delivered').length,
  };

  const featureBlocked =
    isBreedingError &&
    typeof breedingError?.message === 'string' &&
    breedingError.message.startsWith('FEATURE_NOT_AVAILABLE');

  if (breedingLoading) {
    return (
      <div className='space-y-6'>
        {/* Skeleton Header */}
        <div className='flex items-center justify-between'>
          <div className='space-y-2'>
            <div className='h-8 w-64 animate-pulse rounded bg-gray-200 dark:bg-gray-800' />
            <div className='h-4 w-48 animate-pulse rounded bg-gray-200 dark:bg-gray-800' />
          </div>
          <div className='h-10 w-40 animate-pulse rounded bg-gray-200 dark:bg-gray-800' />
        </div>

        {/* Skeleton Stats */}
        <div className='grid grid-cols-2 gap-4 md:grid-cols-5'>
          {[1, 2, 3, 4, 5].map(i => (
            <Card key={i}>
              <CardContent className='pt-4'>
                <div className='flex items-center gap-3'>
                  <div className='h-10 w-10 animate-pulse rounded-lg bg-gray-200 dark:bg-gray-800' />
                  <div className='space-y-1'>
                    <div className='h-6 w-8 animate-pulse rounded bg-gray-200 dark:bg-gray-800' />
                    <div className='h-3 w-16 animate-pulse rounded bg-gray-200 dark:bg-gray-800' />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Skeleton Table */}
        <Card>
          <CardHeader>
            <div className='mb-2 h-6 w-32 animate-pulse rounded bg-gray-200 dark:bg-gray-800' />
            <div className='h-4 w-48 animate-pulse rounded bg-gray-200 dark:bg-gray-800' />
          </CardHeader>
          <CardContent>
            <div className='space-y-4'>
              {[1, 2, 3, 4, 5].map(i => (
                <div key={i} className='flex items-center justify-between border-b py-2'>
                  <div className='h-4 w-24 animate-pulse rounded bg-gray-200 dark:bg-gray-800' />
                  <div className='h-4 w-20 animate-pulse rounded bg-gray-200 dark:bg-gray-800' />
                  <div className='h-4 w-24 animate-pulse rounded bg-gray-200 dark:bg-gray-800' />
                  <div className='h-4 w-32 animate-pulse rounded bg-gray-200 dark:bg-gray-800' />
                  <div className='h-4 w-16 animate-pulse rounded bg-gray-200 dark:bg-gray-800' />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (featureBlocked) {
    return (
      <Card>
        <CardContent className='space-y-4 py-8'>
          <PlanUpgradeNotice
            message={breedingError?.message || 'FEATURE_NOT_AVAILABLE:breeding_tracking'}
          />
          <div className='text-center'>
            <Button asChild>
              <Link href='/subscription'>View Plans</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (breedingError) {
    return (
      <Card>
        <CardContent className='py-8'>
          <EmptyError onRetry={() => refetchBreeding()} />
        </CardContent>
      </Card>
    );
  }

  return (
    <motion.div
      initial='hidden'
      animate='visible'
      variants={containerVariants}
      className='space-y-6'
    >
      {/* Header */}
      <div className='flex items-center justify-between'>
        <motion.div variants={itemVariants}>
          <h1 className='text-2xl font-bold text-gray-900 dark:text-white'>
            Breeding & Pregnancy Management
          </h1>
          <p className='text-muted-foreground'>
            Track inseminations, pregnancy checks, and upcoming births
          </p>
        </motion.div>
        <motion.div variants={itemVariants}>
          <Button
            onClick={() => setShowForm(true)}
            className='bg-gradient-to-r from-emerald-500 to-teal-500 shadow-lg transition-all hover:from-emerald-600 hover:to-teal-600 hover:shadow-xl'
          >
            <Plus className='mr-2 h-4 w-4' />
            Record Insemination
          </Button>
        </motion.div>
      </div>

      {/* Stats Cards */}
      <div className='grid grid-cols-2 gap-4 md:grid-cols-5'>
        <motion.div variants={itemVariants}>
          <Card className='transition-transform hover:scale-[1.02]'>
            <CardContent className='pt-4'>
              <div className='flex items-center gap-3'>
                <div className='rounded-lg bg-blue-100 p-2 dark:bg-blue-900/30'>
                  <Calendar className='h-5 w-5 text-blue-600 dark:text-blue-400' />
                </div>
                <div>
                  <p className='text-2xl font-bold'>{stats.total}</p>
                  <p className='text-muted-foreground text-xs'>Total Records</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={itemVariants}>
          <Card className='border-green-200 transition-transform hover:scale-[1.02] dark:border-green-800'>
            <CardContent className='pt-4'>
              <div className='flex items-center gap-3'>
                <div className='rounded-lg bg-green-100 p-2 dark:bg-green-900/30'>
                  <Baby className='h-5 w-5 text-green-600 dark:text-green-400' />
                </div>
                <div>
                  <p className='text-2xl font-bold text-green-600'>{stats.pregnant}</p>
                  <p className='text-muted-foreground text-xs'>Pregnant</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={itemVariants}>
          <Card className='border-orange-200 transition-transform hover:scale-[1.02] dark:border-orange-800'>
            <CardContent className='pt-4'>
              <div className='flex items-center gap-3'>
                <div className='rounded-lg bg-orange-100 p-2 dark:bg-orange-900/30'>
                  <Clock className='h-5 w-5 text-orange-600 dark:text-orange-400' />
                </div>
                <div>
                  <p className='text-2xl font-bold text-orange-600'>{stats.pending}</p>
                  <p className='text-muted-foreground text-xs'>Awaiting Check</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={itemVariants}>
          <Card className='border-red-200 transition-transform hover:scale-[1.02] dark:border-red-800'>
            <CardContent className='pt-4'>
              <div className='flex items-center gap-3'>
                <div className='rounded-lg bg-red-100 p-2 dark:bg-red-900/30'>
                  <AlertCircle className='h-5 w-5 text-red-600 dark:text-red-400' />
                </div>
                <div>
                  <p className='text-2xl font-bold text-red-600'>{stats.overdue}</p>
                  <p className='text-muted-foreground text-xs'>Overdue</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={itemVariants}>
          <Card className='border-purple-200 transition-transform hover:scale-[1.02] dark:border-purple-800'>
            <CardContent className='pt-4'>
              <div className='flex items-center gap-3'>
                <div className='rounded-lg bg-purple-100 p-2 dark:bg-purple-900/30'>
                  <CheckCircle2 className='h-5 w-5 text-purple-600 dark:text-purple-400' />
                </div>
                <div>
                  <p className='text-2xl font-bold text-purple-600'>{stats.delivered}</p>
                  <p className='text-muted-foreground text-xs'>Delivered</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Form Modal */}
      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className='fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4'
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className='max-h-[90vh] w-full max-w-lg overflow-y-auto'
            >
              <BreedingForm
                record={editingRecord}
                onClose={() => {
                  setShowForm(false);
                  setEditingRecord(null);
                }}
                onSuccess={handleFormSuccess}
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Pregnancy Check Modal */}
      <AnimatePresence>
        {pregnancyCheckRecord && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className='fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4'
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className='max-h-[90vh] w-full max-w-lg overflow-y-auto'
            >
              <PregnancyCheckForm
                breedingRecordId={pregnancyCheckRecord.id}
                animalId={pregnancyCheckRecord.animalId}
                animalName={getAnimalName(pregnancyCheckRecord.animalId)}
                onClose={() => setPregnancyCheckRecord(null)}
                onSuccess={handlePregnancyCheckSuccess}
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Records Table */}
      <motion.div variants={itemVariants}>
        <Card>
          <CardHeader>
            <CardTitle>Breeding Records</CardTitle>
            <CardDescription>All insemination and pregnancy records</CardDescription>
          </CardHeader>
          <CardContent>
            {femaleAnimals.length === 0 ? (
              <div className='py-8'>
                <EmptyAnimals onAdd={() => router.push('/animals/new')} />
                <p className='text-muted-foreground mt-2 text-center text-sm'>
                  Add an active female animal before recording breeding.
                </p>
              </div>
            ) : records.length === 0 ? (
              <div className='py-8'>
                <EmptyBreedingRecords onAdd={() => setShowForm(true)} />
              </div>
            ) : (
              <div className='overflow-x-auto'>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Animal</TableHead>
                      <TableHead>Method</TableHead>
                      <TableHead>Breeding Date</TableHead>
                      <TableHead>Expected Due</TableHead>
                      <TableHead>Progress</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className='text-right'>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {records.map(record => {
                      const animal = getAnimalDetails(record.animalId);
                      const statusConfig = getStatusConfig(record.status);

                      return (
                        <TableRow key={record.id}>
                          <TableCell>
                            <div className='flex flex-col'>
                              <span className='font-medium'>{getAnimalName(record.animalId)}</span>
                              {animal && (
                                <span className='text-muted-foreground text-xs'>
                                  {animal.species} • {animal.breed || 'Unknown breed'}
                                </span>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant='outline' className='flex w-fit items-center gap-1'>
                              {record.breedingMethod === 'artificial_insemination' ? (
                                <>
                                  <Syringe className='h-3 w-3' />
                                  AI
                                </>
                              ) : (
                                <>
                                  <Heart className='h-3 w-3' />
                                  Natural
                                </>
                              )}
                            </Badge>
                            {record.semenSource && (
                              <p className='text-muted-foreground mt-1 text-xs'>
                                {record.semenSource}
                              </p>
                            )}
                          </TableCell>
                          <TableCell>
                            {format(new Date(record.breedingDate), 'MMM d, yyyy')}
                          </TableCell>
                          <TableCell>
                            {record.expectedDueDate ? (
                              <div className='flex flex-col'>
                                <span>
                                  {format(new Date(record.expectedDueDate), 'MMM d, yyyy')}
                                </span>
                                {record.daysRemaining !== undefined &&
                                  record.daysRemaining !== null && (
                                    <span
                                      className={`text-xs ${
                                        record.isOverdue
                                          ? 'font-medium text-red-600'
                                          : record.daysRemaining <= 7
                                            ? 'text-orange-600'
                                            : 'text-muted-foreground'
                                      }`}
                                    >
                                      {record.isOverdue
                                        ? `${Math.abs(record.daysRemaining)} days overdue`
                                        : `${record.daysRemaining} days remaining`}
                                    </span>
                                  )}
                              </div>
                            ) : (
                              <span className='text-muted-foreground'>-</span>
                            )}
                          </TableCell>
                          <TableCell>
                            {record.progressPercent !== undefined && (
                              <div className='w-24'>
                                <Progress
                                  value={record.progressPercent}
                                  className={`h-2 ${
                                    record.isOverdue
                                      ? '[&>div]:bg-red-500'
                                      : record.progressPercent > 90
                                        ? '[&>div]:bg-orange-500'
                                        : '[&>div]:bg-green-500'
                                  }`}
                                />
                                <span className='text-muted-foreground text-xs'>
                                  {record.progressPercent}%
                                </span>
                              </div>
                            )}
                          </TableCell>
                          <TableCell>
                            <Badge variant={getStatusVariant(record.status)}>
                              <span className='mr-1'>{statusConfig.icon}</span>
                              {statusConfig.label}
                            </Badge>
                          </TableCell>
                          <TableCell className='text-right'>
                            <div className='flex items-center justify-end gap-1'>
                              <Button
                                variant='ghost'
                                size='sm'
                                title='Add Pregnancy Check'
                                onClick={() => setPregnancyCheckRecord(record)}
                              >
                                <Stethoscope className='h-4 w-4' />
                              </Button>
                              <Button
                                variant='ghost'
                                size='sm'
                                onClick={() => {
                                  setEditingRecord(record);
                                  setShowForm(true);
                                }}
                                title='Edit'
                              >
                                <Edit className='h-4 w-4' />
                              </Button>
                              <Button
                                variant='ghost'
                                size='sm'
                                onClick={() => {
                                  if (confirm('Delete this breeding record?')) {
                                    deleteMutation.mutate(record.id);
                                  }
                                }}
                                title='Delete'
                                className='text-red-600 hover:text-red-700'
                              >
                                <Trash2 className='h-4 w-4' />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );
}
