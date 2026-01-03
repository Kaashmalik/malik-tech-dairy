'use client';

import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import Link from 'next/link';
import { format } from 'date-fns';

import { Skeleton } from '@/components/ui/skeleton';

export default function MilkLogsPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['milk-logs'],
    queryFn: async () => {
      const res = await fetch('/api/milk?limit=50');
      if (!res.ok) return { logs: [] };
      return res.json();
    },
    staleTime: 60000, // cache for 1 minute
  });

  const logs = data?.logs || [];

  return (
    <div className='space-y-6'>
      <div className='flex items-center justify-between'>
        <div>
          <h1 className='text-3xl font-bold'>Milk Logs</h1>
          <p className='text-muted-foreground'>Track milk production from your dairy animals</p>
        </div>
        <Link href='/milk/new'>
          <Button>
            <Plus className='mr-2 h-4 w-4' />
            Log Milk
          </Button>
        </Link>
      </div>

      {isLoading ? (
        <div className='space-y-4'>
          {[1, 2, 3].map(i => (
            <Card key={i}>
              <CardHeader className='pb-2'>
                <Skeleton className='h-4 w-1/3' />
              </CardHeader>
              <CardContent>
                <Skeleton className='mb-2 h-8 w-1/4' />
                <Skeleton className='h-4 w-1/2' />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : logs.length === 0 ? (
        <Card>
          <CardContent className='py-12 text-center'>
            <p className='text-muted-foreground mb-4'>No milk logs yet.</p>
            <Link href='/milk/new'>
              <Button>
                <Plus className='mr-2 h-4 w-4' />
                Log Your First Milk Entry
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className='space-y-4'>
          {logs.map((log: any) => (
            <Card key={log.id}>
              <CardHeader>
                <div className='flex items-center justify-between'>
                  <div className='flex flex-col gap-1'>
                    <CardTitle className='text-lg'>
                      {log.animalTag} {log.animalName ? `(- ${log.animalName})` : ''}
                    </CardTitle>
                    <p className='text-muted-foreground text-sm'>
                      {format(new Date(log.date), 'MMMM d, yyyy')}
                    </p>
                  </div>
                  <span className='bg-muted rounded px-2 py-1 text-sm capitalize'>
                    {log.session}
                  </span>
                </div>
              </CardHeader>
              <CardContent>
                <div className='flex items-center justify-between'>
                  <div>
                    <p className='text-2xl font-bold'>{log.quantity} L</p>
                    {log.quality && (
                      <p className='text-muted-foreground text-sm'>Quality: {log.quality}/10</p>
                    )}
                  </div>
                  {log.notes && (
                    <p className='text-muted-foreground max-w-[50%] text-right text-sm'>
                      {log.notes}
                    </p>
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
