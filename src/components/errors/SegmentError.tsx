'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import {
  AlertTriangle,
  RefreshCw,
  Home,
  Droplets,
  Package,
  Heart,
  Baby,
  DollarSign,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

type Segment = 'animals' | 'milk' | 'health' | 'breeding' | 'finance';

interface SegmentErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
  segment: Segment;
}

const COPY: Record<
  Segment,
  {
    title: string;
    description: string;
    homeHref: string;
    homeLabel: string;
    icon: Segment;
  }
> = {
  animals: {
    title: 'Animals section error',
    description: 'Something went wrong while loading animals. Your herd data is safe.',
    homeHref: '/animals',
    homeLabel: 'Back to Animals',
    icon: 'animals',
  },
  milk: {
    title: 'Milk section error',
    description: 'Something went wrong while loading milk records. Your logs are safe.',
    homeHref: '/milk',
    homeLabel: 'Back to Milk',
    icon: 'milk',
  },
  health: {
    title: 'Health section error',
    description: 'Something went wrong while loading health records. Your data is safe.',
    homeHref: '/health',
    homeLabel: 'Back to Health',
    icon: 'health',
  },
  breeding: {
    title: 'Breeding section error',
    description: 'Something went wrong while loading breeding records. Your data is safe.',
    homeHref: '/breeding',
    homeLabel: 'Back to Breeding',
    icon: 'breeding',
  },
  finance: {
    title: 'Finance section error',
    description: 'Something went wrong while loading finance data. Your records are safe.',
    homeHref: '/finance',
    homeLabel: 'Back to Finance',
    icon: 'finance',
  },
};

function SegmentIcon({ icon }: { icon: Segment }) {
  const className = 'h-7 w-7 text-red-600 dark:text-red-400';
  switch (icon) {
    case 'milk':
      return <Droplets className={className} />;
    case 'health':
      return <Heart className={className} />;
    case 'breeding':
      return <Baby className={className} />;
    case 'finance':
      return <DollarSign className={className} />;
    default:
      return <Package className={className} />;
  }
}

export function SegmentError({ error, reset, segment }: SegmentErrorProps) {
  const copy = COPY[segment];

  useEffect(() => {
    console.error(`[${segment}] segment error:`, error);
  }, [error, segment]);

  return (
    <div className='flex min-h-[50vh] items-center justify-center px-4'>
      <Card className='w-full max-w-lg border-red-200 bg-gradient-to-br from-red-50 to-orange-50 dark:border-red-800 dark:from-red-900/20 dark:to-orange-900/20'>
        <CardHeader className='text-center'>
          <div className='mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/50'>
            <SegmentIcon icon={copy.icon} />
          </div>
          <CardTitle className='text-xl'>{copy.title}</CardTitle>
          <CardDescription>{copy.description}</CardDescription>
        </CardHeader>
        <CardContent className='space-y-4'>
          {process.env.NODE_ENV === 'development' && (
            <div className='rounded-lg border border-red-200 bg-white/60 p-3 text-left dark:border-red-800 dark:bg-slate-800/50'>
              <div className='mb-1 flex items-center gap-2 text-sm font-medium text-red-700 dark:text-red-400'>
                <AlertTriangle className='h-4 w-4' />
                Dev details
              </div>
              <p className='break-all font-mono text-xs text-red-600 dark:text-red-400'>
                {error.message}
              </p>
            </div>
          )}

          {error.digest && (
            <p className='text-center text-xs text-gray-500'>
              Error ID:{' '}
              <code className='rounded bg-gray-100 px-1.5 py-0.5 font-mono'>{error.digest}</code>
            </p>
          )}

          <div className='flex flex-col gap-2 sm:flex-row'>
            <Button onClick={reset} className='flex-1 gap-2'>
              <RefreshCw className='h-4 w-4' />
              Try again
            </Button>
            <Button asChild variant='outline' className='flex-1 gap-2'>
              <Link href={copy.homeHref}>
                <Home className='h-4 w-4' />
                {copy.homeLabel}
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
