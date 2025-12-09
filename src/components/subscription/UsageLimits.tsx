'use client';

import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { AlertCircle, Users, Beef, TrendingUp } from 'lucide-react';
import { SUBSCRIPTION_PLANS } from '@/lib/constants';
import type { SubscriptionPlan } from '@/types';

// Alias for semantic clarity
const Cow = Beef;

export function UsageLimits() {
  const { data: limits, isLoading } = useQuery({
    queryKey: ['usage-limits'],
    queryFn: async () => {
      const res = await fetch('/api/tenants/limits');
      if (!res.ok) return null;
      return res.json();
    },
  });

  const { data: subscription } = useQuery({
    queryKey: ['subscription'],
    queryFn: async () => {
      const res = await fetch('/api/subscription');
      if (!res.ok) return null;
      return res.json();
    },
  });

  if (isLoading || !limits || !subscription) {
    return <div className='py-4 text-center'>Loading usage limits...</div>;
  }

  const currentPlan = subscription.plan as SubscriptionPlan;
  const planConfig = SUBSCRIPTION_PLANS[currentPlan];

  const animalUsage = limits.animalCount || 0;
  const userUsage = limits.userCount || 0;
  const maxAnimals = planConfig.maxAnimals === -1 ? Infinity : planConfig.maxAnimals;
  const maxUsers = planConfig.maxUsers === -1 ? Infinity : planConfig.maxUsers;

  const animalPercentage = maxAnimals === Infinity ? 0 : (animalUsage / maxAnimals) * 100;
  const userPercentage = maxUsers === Infinity ? 0 : (userUsage / maxUsers) * 100;

  const isNearLimit = (percentage: number) => percentage >= 80;
  const isAtLimit = (usage: number, max: number) => max !== Infinity && usage >= max;

  const needsUpgrade =
    isAtLimit(animalUsage, maxAnimals) ||
    isAtLimit(userUsage, maxUsers) ||
    isNearLimit(animalPercentage) ||
    isNearLimit(userPercentage);

  return (
    <div className='space-y-4'>
      <Card>
        <CardHeader>
          <CardTitle className='flex items-center gap-2'>
            <TrendingUp className='h-5 w-5' />
            Usage & Limits
          </CardTitle>
          <CardDescription>
            Current plan: <span className='font-semibold capitalize'>{planConfig.name}</span>
          </CardDescription>
        </CardHeader>
        <CardContent className='space-y-6'>
          {/* Animals Usage */}
          <div>
            <div className='mb-2 flex items-center justify-between'>
              <div className='flex items-center gap-2'>
                <Cow className='text-muted-foreground h-4 w-4' />
                <span className='text-sm font-medium'>Animals</span>
              </div>
              <span className='text-muted-foreground text-sm'>
                {animalUsage} / {maxAnimals === Infinity ? '∞' : maxAnimals}
              </span>
            </div>
            {maxAnimals !== Infinity && (
              <>
                <Progress
                  value={Math.min(animalPercentage, 100)}
                  className={`h-2 ${
                    isAtLimit(animalUsage, maxAnimals)
                      ? 'bg-red-500'
                      : isNearLimit(animalPercentage)
                        ? 'bg-yellow-500'
                        : ''
                  }`}
                />
                {isAtLimit(animalUsage, maxAnimals) && (
                  <p className='mt-1 flex items-center gap-1 text-xs text-red-500'>
                    <AlertCircle className='h-3 w-3' />
                    Limit reached! Upgrade to add more animals.
                  </p>
                )}
                {isNearLimit(animalPercentage) && !isAtLimit(animalUsage, maxAnimals) && (
                  <p className='mt-1 text-xs text-yellow-600'>
                    You're using {Math.round(animalPercentage)}% of your limit.
                  </p>
                )}
              </>
            )}
          </div>

          {/* Users Usage */}
          <div>
            <div className='mb-2 flex items-center justify-between'>
              <div className='flex items-center gap-2'>
                <Users className='text-muted-foreground h-4 w-4' />
                <span className='text-sm font-medium'>Users</span>
              </div>
              <span className='text-muted-foreground text-sm'>
                {userUsage} / {maxUsers === Infinity ? '∞' : maxUsers}
              </span>
            </div>
            {maxUsers !== Infinity && (
              <>
                <Progress
                  value={Math.min(userPercentage, 100)}
                  className={`h-2 ${
                    isAtLimit(userUsage, maxUsers)
                      ? 'bg-red-500'
                      : isNearLimit(userPercentage)
                        ? 'bg-yellow-500'
                        : ''
                  }`}
                />
                {isAtLimit(userUsage, maxUsers) && (
                  <p className='mt-1 flex items-center gap-1 text-xs text-red-500'>
                    <AlertCircle className='h-3 w-3' />
                    Limit reached! Upgrade to add more users.
                  </p>
                )}
                {isNearLimit(userPercentage) && !isAtLimit(userUsage, maxUsers) && (
                  <p className='mt-1 text-xs text-yellow-600'>
                    You're using {Math.round(userPercentage)}% of your limit.
                  </p>
                )}
              </>
            )}
          </div>

          {/* Upgrade Prompt */}
          {needsUpgrade && currentPlan !== 'enterprise' && (
            <div className='rounded-lg border border-yellow-200 bg-yellow-50 p-4'>
              <div className='flex items-start gap-3'>
                <AlertCircle className='mt-0.5 h-5 w-5 text-yellow-600' />
                <div className='flex-1'>
                  <p className='text-sm font-medium text-yellow-900'>
                    {isAtLimit(animalUsage, maxAnimals) || isAtLimit(userUsage, maxUsers)
                      ? "You've reached your plan limits"
                      : "You're approaching your plan limits"}
                  </p>
                  <p className='mt-1 text-xs text-yellow-700'>
                    Upgrade to a higher plan to continue growing your farm.
                  </p>
                  <Link href='/dashboard/subscription'>
                    <Button size='sm' className='mt-3' variant='outline'>
                      View Plans & Upgrade
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
