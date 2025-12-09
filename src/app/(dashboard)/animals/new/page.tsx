import { AnimalForm } from '@/components/animals/AnimalForm';

export const dynamic = 'force-dynamic';

export default function NewAnimalPage() {
  return (
    <div className='container max-w-4xl'>
      <AnimalForm />
    </div>
  );
}
