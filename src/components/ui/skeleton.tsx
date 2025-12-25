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

// Chart Skeleton
export function ChartSkeleton({ height = 300 }: { height?: number }) {
  return (
    <div className='space-y-4'>
      <div className='flex items-center justify-between'>
        <Skeleton className='h-5 w-32' />
        <Skeleton className='h-8 w-24 rounded-lg' />
      </div>
      <div className='relative' style={{ height }}>
        <Skeleton className='absolute inset-0 rounded-lg' />
        {/* Fake chart lines */}
        <div className='absolute bottom-4 left-4 right-4 flex items-end justify-between gap-2'>
          {Array.from({ length: 7 }).map((_, i) => (
            <Skeleton 
              key={i} 
              className='w-8 rounded-t' 
              style={{ height: `${Math.random() * 60 + 20}%` }} 
            />
          ))}
        </div>
      </div>
    </div>
  );
}

// Dashboard Skeleton (Full Page)
export function DashboardSkeleton() {
  return (
    <div className='space-y-8'>
      {/* Welcome Banner */}
      <Skeleton className='h-48 w-full rounded-2xl' />
      
      {/* Stats Grid */}
      <div className='grid gap-4 sm:grid-cols-2 lg:grid-cols-4'>
        <StatsCardSkeleton />
        <StatsCardSkeleton />
        <StatsCardSkeleton />
        <StatsCardSkeleton />
      </div>
      
      {/* Charts */}
      <div className='grid gap-6 lg:grid-cols-2'>
        <div className='border-border rounded-xl border p-6'>
          <ChartSkeleton />
        </div>
        <div className='border-border rounded-xl border p-6'>
          <ChartSkeleton />
        </div>
      </div>
      
      {/* Quick Actions */}
      <div className='border-border rounded-xl border p-6'>
        <Skeleton className='mb-6 h-6 w-32' />
        <div className='grid gap-4 sm:grid-cols-2 lg:grid-cols-4'>
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className='h-32 rounded-xl' />
          ))}
        </div>
      </div>
    </div>
  );
}

// Animal Detail Skeleton
export function AnimalDetailSkeleton() {
  return (
    <div className='space-y-6'>
      {/* Header */}
      <div className='flex items-start gap-6'>
        <Skeleton className='h-32 w-32 rounded-2xl' />
        <div className='flex-1 space-y-3'>
          <Skeleton className='h-8 w-48' />
          <Skeleton className='h-4 w-32' />
          <div className='flex gap-2'>
            <Skeleton className='h-6 w-16 rounded-full' />
            <Skeleton className='h-6 w-20 rounded-full' />
          </div>
        </div>
        <div className='flex gap-2'>
          <Skeleton className='h-10 w-24 rounded-lg' />
          <Skeleton className='h-10 w-10 rounded-lg' />
        </div>
      </div>
      
      {/* Info Cards */}
      <div className='grid gap-4 md:grid-cols-3'>
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className='border-border rounded-lg border p-4'>
            <Skeleton className='mb-2 h-4 w-24' />
            <Skeleton className='h-6 w-32' />
          </div>
        ))}
      </div>
      
      {/* Tabs */}
      <div className='border-border rounded-xl border'>
        <div className='flex gap-4 border-b p-4'>
          <Skeleton className='h-8 w-24' />
          <Skeleton className='h-8 w-24' />
          <Skeleton className='h-8 w-24' />
        </div>
        <div className='p-4'>
          <TableSkeleton rows={3} />
        </div>
      </div>
    </div>
  );
}

// Health Records Skeleton
export function HealthRecordsSkeleton() {
  return (
    <div className='space-y-4'>
      <div className='flex items-center justify-between'>
        <Skeleton className='h-8 w-40' />
        <Skeleton className='h-10 w-32 rounded-lg' />
      </div>
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className='border-border rounded-lg border p-4'>
          <div className='flex items-start justify-between'>
            <div className='space-y-2'>
              <Skeleton className='h-5 w-32' />
              <Skeleton className='h-4 w-48' />
              <Skeleton className='h-4 w-24' />
            </div>
            <Skeleton className='h-6 w-20 rounded-full' />
          </div>
        </div>
      ))}
    </div>
  );
}

// Form Skeleton
export function FormSkeleton({ fields = 4 }: { fields?: number }) {
  return (
    <div className='space-y-6'>
      {Array.from({ length: fields }).map((_, i) => (
        <div key={i} className='space-y-2'>
          <Skeleton className='h-4 w-24' />
          <Skeleton className='h-10 w-full rounded-lg' />
        </div>
      ))}
      <div className='flex justify-end gap-3 pt-4'>
        <Skeleton className='h-10 w-24 rounded-lg' />
        <Skeleton className='h-10 w-32 rounded-lg' />
      </div>
    </div>
  );
}

// Profile Skeleton
export function ProfileSkeleton() {
  return (
    <div className='space-y-6'>
      <div className='flex items-center gap-4'>
        <Skeleton className='h-20 w-20 rounded-full' />
        <div className='space-y-2'>
          <Skeleton className='h-6 w-40' />
          <Skeleton className='h-4 w-56' />
        </div>
      </div>
      <FormSkeleton fields={3} />
    </div>
  );
}

// Breeding Records Skeleton
export function BreedingRecordsSkeleton() {
  return (
    <div className='space-y-4'>
      <div className='flex items-center justify-between'>
        <Skeleton className='h-8 w-44' />
        <Skeleton className='h-10 w-36 rounded-lg' />
      </div>
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className='border-border rounded-lg border p-4'>
          <div className='flex items-center gap-4'>
            <Skeleton className='h-12 w-12 rounded-full' />
            <div className='flex-1 space-y-2'>
              <Skeleton className='h-5 w-48' />
              <Skeleton className='h-4 w-32' />
            </div>
            <div className='text-right space-y-2'>
              <Skeleton className='h-6 w-24 rounded-full' />
              <Skeleton className='h-4 w-20' />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export { Skeleton };
