'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Check } from 'lucide-react';
import { SUBSCRIPTION_PLANS } from '@/lib/constants';
import type { SubscriptionPlan } from '@/types';
import Link from 'next/link';

interface PricingCardProps {
  plan: SubscriptionPlan;
  currentPlan?: SubscriptionPlan;
  onSelect?: (plan: SubscriptionPlan) => void;
}

export function PricingCard({ plan, currentPlan, onSelect }: PricingCardProps) {
  const planDetails = SUBSCRIPTION_PLANS[plan];
  const isCurrentPlan = currentPlan === plan;
  const isFree = plan === 'free';

  return (
    <Card className={isCurrentPlan ? 'border-primary' : ''}>
      <CardHeader>
        <CardTitle className='text-2xl'>{planDetails.name}</CardTitle>
        <CardDescription>
          {isFree ? (
            <span className='text-3xl font-bold'>Free Forever</span>
          ) : (
            <span>
              <span className='text-3xl font-bold'>PKR {planDetails.price.toLocaleString()}</span>
              <span className='text-muted-foreground'>/month</span>
            </span>
          )}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ul className='mb-6 space-y-3'>
          <li className='flex items-center gap-2'>
            <Check className='text-primary h-4 w-4' />
            <span>
              {planDetails.maxAnimals === -1 ? 'Unlimited' : planDetails.maxAnimals} Animals
            </span>
          </li>
          <li className='flex items-center gap-2'>
            <Check className='text-primary h-4 w-4' />
            <span>{planDetails.maxUsers === -1 ? 'Unlimited' : planDetails.maxUsers} Users</span>
          </li>
          {planDetails.features.map((feature, idx) => (
            <li key={idx} className='flex items-center gap-2'>
              <Check className='text-primary h-4 w-4' />
              <span className='capitalize'>{feature.replace(/_/g, ' ')}</span>
            </li>
          ))}
        </ul>
        {isCurrentPlan ? (
          <Button disabled className='w-full'>
            Current Plan
          </Button>
        ) : isFree ? (
          <Button variant='outline' className='w-full' disabled>
            Already on Free Plan
          </Button>
        ) : (
          <Link href={`/dashboard/subscription/checkout?plan=${plan}`}>
            <Button className='w-full' onClick={() => onSelect?.(plan)}>
              {currentPlan ? 'Upgrade' : 'Subscribe'}
            </Button>
          </Link>
        )}
      </CardContent>
    </Card>
  );
}
