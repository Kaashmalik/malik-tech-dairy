import { HealthRecordsList } from '@/components/health/HealthRecordsList';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export default async function AnimalHealthPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  return (
    <div className='space-y-6'>
      <div className='flex flex-wrap items-center justify-between gap-3'>
        <Button variant='outline' asChild>
          <Link href={`/animals/${id}`}>
            <ArrowLeft className='mr-2 h-4 w-4' />
            Back to Animal
          </Link>
        </Button>
        <div className='flex gap-2'>
          <Button variant='outline' size='sm' asChild>
            <Link href={`/animals/${id}`}>Overview</Link>
          </Button>
          <Button variant='secondary' size='sm' asChild>
            <Link href={`/animals/${id}/health`}>Health</Link>
          </Button>
          <Button variant='outline' size='sm' asChild>
            <Link href={`/milk?animalId=${id}`}>Milk</Link>
          </Button>
          <Button variant='outline' size='sm' asChild>
            <Link href={`/breeding?animalId=${id}`}>Breeding</Link>
          </Button>
        </div>
      </div>
      <HealthRecordsList animalId={id} />
    </div>
  );
}
