import { cn } from '@/lib/utils';

function Skeleton({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('bg-muted animate-pulse rounded-md', className)} {...props} />;
}

// Card Skeleton
export function CardSkeleton() {
  return (
    <div className='border-border space-y-4 rounded-lg border p-6'>
      <div className='flex items-center space-x-4'>
        <Skeleton className='h-12 w-12 rounded-full' />
        <div className='space-y-2'>
          <Skeleton className='h-4 w-[250px]' />
          <Skeleton className='h-4 w-[200px]' />
        </div>
      </div>
      <div className='space-y-2'>
        <Skeleton className='h-4 w-full' />
        <Skeleton className='h-4 w-full' />
        <Skeleton className='h-4 w-3/4' />
      </div>
    </div>
  );
}

// Table Skeleton
export function TableSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className='space-y-3'>
      <div className='grid grid-cols-5 gap-4 border-b p-4'>
        <Skeleton className='h-4 w-full' />
        <Skeleton className='h-4 w-full' />
        <Skeleton className='h-4 w-full' />
        <Skeleton className='h-4 w-full' />
        <Skeleton className='h-4 w-full' />
      </div>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className='grid grid-cols-5 gap-4 p-4'>
          <Skeleton className='h-10 w-full rounded' />
          <Skeleton className='h-10 w-full rounded' />
          <Skeleton className='h-10 w-full rounded' />
          <Skeleton className='h-10 w-full rounded' />
          <Skeleton className='h-10 w-full rounded' />
        </div>
      ))}
    </div>
  );
}

// Dashboard Stats Skeleton
export function StatsCardSkeleton() {
  return (
    <div className='border-border bg-card space-y-3 rounded-xl border p-6'>
      <div className='flex items-center justify-between'>
        <Skeleton className='h-8 w-8 rounded-lg' />
        <Skeleton className='h-4 w-20' />
      </div>
      <Skeleton className='h-8 w-32' />
      <Skeleton className='h-3 w-24' />
    </div>
  );
}

// Animal List Skeleton
export function AnimalListSkeleton() {
  return (
    <div className='space-y-4'>
      <div className='flex items-center justify-between'>
        <Skeleton className='h-10 w-64' />
        <Skeleton className='h-10 w-32' />
      </div>
      <div className='grid gap-4'>
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className='border-border rounded-lg border p-4'>
            <div className='flex items-center space-x-4'>
              <Skeleton className='h-16 w-16 rounded-lg' />
              <div className='flex-1 space-y-2'>
                <Skeleton className='h-5 w-48' />
                <Skeleton className='h-4 w-32' />
                <Skeleton className='h-4 w-24' />
              </div>
              <div className='flex space-x-2'>
                <Skeleton className='h-8 w-8 rounded' />
                <Skeleton className='h-8 w-8 rounded' />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// Milk Stats Skeleton
export function MilkStatsSkeleton() {
  return (
    <div className='space-y-6'>
      <div className='grid gap-4 md:grid-cols-2 lg:grid-cols-4'>
        <StatsCardSkeleton />
        <StatsCardSkeleton />
        <StatsCardSkeleton />
        <StatsCardSkeleton />
      </div>
      <div className='border-border rounded-xl border p-6'>
        <Skeleton className='mb-4 h-6 w-48' />
        <div className='flex h-[300px] items-center justify-center'>
          <Skeleton className='h-[250px] w-full rounded-lg' />
        </div>
      </div>
    </div>
  );
}

export { Skeleton };
