import { CheckoutForm } from '@/components/subscription/CheckoutForm';

export const dynamic = 'force-dynamic';

export default function CheckoutPage() {
  return (
    <div className='container max-w-2xl'>
      <CheckoutForm />
    </div>
  );
}
