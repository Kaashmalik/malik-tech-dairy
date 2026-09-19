'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Search, ChevronLeft, ChevronRight } from 'lucide-react';
import Link from 'next/link';
import type { Animal } from '@/types';
import { AnimalListSkeleton } from '@/components/ui/skeleton';
import { EmptyAnimals, EmptySearchResults, EmptyError } from '@/components/ui/empty-state';

export function AnimalList() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSpecies, setSelectedSpecies] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 12;

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['animals', currentPage, selectedSpecies, selectedStatus, searchQuery],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: String(currentPage),
        limit: String(pageSize),
      });

      if (searchQuery.trim()) params.set('search', searchQuery.trim());
      if (selectedSpecies !== 'all') params.set('species', selectedSpecies);
      if (selectedStatus !== 'all') params.set('status', selectedStatus);

      const res = await fetch(`/api/animals?${params.toString()}`);
      if (!res.ok) throw new Error('Failed to fetch animals');
      const response = await res.json();
      return response.data;
    },
  });

  const animals: Animal[] = data?.animals || [];
  const pagination = data?.pagination || { page: 1, limit: pageSize, total: 0, totalPages: 1 };

  if (isLoading) {
    return <AnimalListSkeleton />;
  }

  if (error) {
    return <EmptyError onRetry={() => refetch()} />;
  }

  return (
    <div className='space-y-6'>
      <div className='flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between'>
        <div>
          <h1 className='text-3xl font-bold'>Animals</h1>
          <p className='text-muted-foreground'>Manage your farm livestock ({pagination.total} total)</p>
        </div>
        <Link href='/animals/new'>
          <Button>
            <Plus className='mr-2 h-4 w-4' />
            Add Animal
          </Button>
        </Link>
      </div>

      {/* Filter and Search Bar */}
      <div className='flex flex-col gap-3 sm:flex-row'>
        <div className='relative flex-1'>
          <Search className='text-muted-foreground absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 transform' />
          <Input
            type='text'
            placeholder='Search by tag or name...'
            value={searchQuery}
            onChange={e => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
            className='pl-10'
            aria-label='Search animals by tag or name'
          />
        </div>

        <Select
          value={selectedSpecies}
          onValueChange={val => {
            setSelectedSpecies(val);
            setCurrentPage(1);
          }}
        >
          <SelectTrigger className='w-full sm:w-[160px]'>
            <SelectValue placeholder='All Species' />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value='all'>All Species</SelectItem>
            <SelectItem value='cow'>Cow / Cattle</SelectItem>
            <SelectItem value='buffalo'>Buffalo</SelectItem>
            <SelectItem value='goat'>Goat</SelectItem>
            <SelectItem value='sheep'>Sheep</SelectItem>
            <SelectItem value='chicken'>Poultry</SelectItem>
            <SelectItem value='horse'>Horse</SelectItem>
          </SelectContent>
        </Select>

        <Select
          value={selectedStatus}
          onValueChange={val => {
            setSelectedStatus(val);
            setCurrentPage(1);
          }}
        >
          <SelectTrigger className='w-full sm:w-[150px]'>
            <SelectValue placeholder='All Status' />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value='all'>All Status</SelectItem>
            <SelectItem value='active'>Active</SelectItem>
            <SelectItem value='quarantine'>Quarantine</SelectItem>
            <SelectItem value='sold'>Sold</SelectItem>
            <SelectItem value='deceased'>Deceased</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Animals Grid */}
      {animals.length === 0 ? (
        searchQuery || selectedSpecies !== 'all' || selectedStatus !== 'all' ? (
          <EmptySearchResults query={searchQuery} />
        ) : (
          <EmptyAnimals onAdd={() => (window.location.href = '/animals/new')} />
        )
      ) : (
        <div className='grid gap-4 md:grid-cols-2 lg:grid-cols-3'>
          {animals.map(animal => (
            <Link key={animal.id} href={`/animals/${animal.id}`}>
              <Card className='cursor-pointer transition-all hover:border-emerald-500/50 hover:shadow-md'>
                <CardHeader className='pb-3'>
                  <div className='flex items-center justify-between'>
                    <CardTitle className='text-lg font-bold tracking-tight'>{animal.tag}</CardTitle>
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-semibold uppercase ${
                        animal.status === 'active'
                          ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300'
                          : (animal.status as string) === 'sick' || (animal.status as string) === 'quarantine'
                          ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/50 dark:text-amber-300'
                          : 'bg-muted text-muted-foreground'
                      }`}
                    >
                      {animal.status}
                    </span>
                  </div>
                  {animal.name && <CardDescription>{animal.name}</CardDescription>}
                </CardHeader>
                <CardContent>
                  <div className='space-y-2 text-sm'>
                    <div className='flex justify-between'>
                      <span className='text-muted-foreground'>Species:</span>
                      <span className='font-medium capitalize'>{animal.species}</span>
                    </div>
                    <div className='flex justify-between'>
                      <span className='text-muted-foreground'>Breed:</span>
                      <span>{animal.breed || 'N/A'}</span>
                    </div>
                    <div className='flex justify-between'>
                      <span className='text-muted-foreground'>Gender:</span>
                      <span className='capitalize'>{animal.gender}</span>
                    </div>
                    {(animal as any).weight && (
                      <div className='flex justify-between'>
                        <span className='text-muted-foreground'>Weight:</span>
                        <span>{(animal as any).weight} kg</span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}

      {/* Pagination Controls */}
      {pagination.totalPages > 1 && (
        <div className='flex items-center justify-between border-t pt-4'>
          <p className='text-muted-foreground text-sm'>
            Showing {(pagination.page - 1) * pagination.limit + 1} to{' '}
            {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} animals
          </p>
          <div className='flex items-center gap-2'>
            <Button
              variant='outline'
              size='sm'
              disabled={pagination.page <= 1}
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
            >
              <ChevronLeft className='h-4 w-4 mr-1' /> Previous
            </Button>
            <span className='text-sm font-medium px-2'>
              Page {pagination.page} of {pagination.totalPages}
            </span>
            <Button
              variant='outline'
              size='sm'
              disabled={pagination.page >= pagination.totalPages}
              onClick={() => setCurrentPage(p => Math.min(pagination.totalPages, p + 1))}
            >
              Next <ChevronRight className='h-4 w-4 ml-1' />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
