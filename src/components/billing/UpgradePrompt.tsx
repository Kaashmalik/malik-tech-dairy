import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Crown, ArrowRight } from 'lucide-react';
import Link from 'next/link';

interface UpgradePromptProps {
  title?: string;
  description?: string;
  limitName?: string;
  currentPlan?: string;
}

export function UpgradePrompt({
  title = 'Unlock Unlimited Potential',
  description = "You've reached the limits of your current plan. Upgrade now to remove restrictions and access advanced features.",
  limitName,
  currentPlan,
}: UpgradePromptProps) {
  return (
    <Card className='border-indigo-100 bg-gradient-to-br from-white to-indigo-50/50 shadow-sm dark:border-indigo-900 dark:from-slate-950 dark:to-indigo-950/30'>
      <CardHeader>
        <div className='mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-indigo-100 text-indigo-600 dark:bg-indigo-900 dark:text-indigo-400'>
          <Crown className='h-5 w-5' />
        </div>
        <CardTitle className='text-xl'>{title}</CardTitle>
        <CardDescription className='text-base'>
          {limitName ? (
            <span>
              You have reached the <strong>{limitName}</strong> limit on your{' '}
              <strong>{currentPlan}</strong> plan.
            </span>
          ) : (
            description
          )}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ul className='text-muted-foreground grid gap-2 text-sm sm:grid-cols-2'>
          <li className='flex items-center gap-2'>
            <div className='h-1.5 w-1.5 rounded-full bg-indigo-500' />
            Unlimited Animals & Users
          </li>
          <li className='flex items-center gap-2'>
            <div className='h-1.5 w-1.5 rounded-full bg-indigo-500' />
            Advanced Analytics
          </li>
          <li className='flex items-center gap-2'>
            <div className='h-1.5 w-1.5 rounded-full bg-indigo-500' />
            AI Health Predictions
          </li>
          <li className='flex items-center gap-2'>
            <div className='h-1.5 w-1.5 rounded-full bg-indigo-500' />
            Priority 24/7 Support
          </li>
        </ul>
      </CardContent>
      <CardFooter>
        <Link href='/settings/billing' className='w-full sm:w-auto'>
          <Button className='w-full gap-2 bg-indigo-600 text-white hover:bg-indigo-700'>
            Upgrade Plan <ArrowRight className='h-4 w-4' />
          </Button>
        </Link>
      </CardFooter>
    </Card>
  );
}
