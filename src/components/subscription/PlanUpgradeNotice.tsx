'use client';

import Link from 'next/link';
import { AlertCircle } from 'lucide-react';

interface PlanUpgradeNoticeProps {
  message: string;
  className?: string;
}

function isPlanGateMessage(message: string): boolean {
  return message.startsWith('FEATURE_NOT_AVAILABLE') || message.startsWith('PLAN_LIMIT_REACHED');
}

function displayMessage(message: string): string {
  return message.replace(/^(FEATURE_NOT_AVAILABLE|PLAN_LIMIT_REACHED):\s*/i, '');
}

/** Shows plan/feature block errors with a link to upgrade. */
export function PlanUpgradeNotice({ message, className }: PlanUpgradeNoticeProps) {
  const showUpgrade = isPlanGateMessage(message);

  return (
    <div className={className ?? 'rounded-lg bg-red-50 p-3 dark:bg-red-900/20'}>
      <p className='flex items-start gap-2 text-sm text-red-600 dark:text-red-400'>
        <AlertCircle className='mt-0.5 h-4 w-4 shrink-0' />
        <span>
          {displayMessage(message)}
          {showUpgrade && (
            <>
              {' '}
              <Link
                href='/subscription'
                className='font-medium underline underline-offset-2 hover:text-red-700 dark:hover:text-red-300'
              >
                Upgrade plan
              </Link>
            </>
          )}
        </span>
      </p>
    </div>
  );
}
