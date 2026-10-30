'use client';

import { useState } from 'react';
import { ChevronDown, Pause, Play } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

const PLANS = [
  { value: 'free', label: 'Free' },
  { value: 'professional', label: 'Professional' },
  { value: 'farm', label: 'Farm' },
  { value: 'enterprise', label: 'Enterprise' },
];

interface FarmActionsMenuProps {
  farm: { id: string; farmName: string; plan: string; status: string };
  onChanged: () => void;
  compact?: boolean;
}

/** Super-admin farm actions backed by PATCH /api/admin/farms. */
export function FarmActionsMenu({ farm, onChanged, compact }: FarmActionsMenuProps) {
  const [busy, setBusy] = useState(false);

  async function run(body: Record<string, unknown>, success: string) {
    setBusy(true);
    try {
      const res = await fetch('/api/admin/farms', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ farmId: farm.id, ...body }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.error || 'Action failed');
      toast.success(success);
      onChanged();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Action failed');
    } finally {
      setBusy(false);
    }
  }

  const suspended = farm.status === 'suspended';

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant='ghost' size='sm' disabled={busy}>
          {compact ? '⋯' : 'Actions'} <ChevronDown className='ml-1 h-4 w-4' />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align='end'>
        <DropdownMenuLabel>Set plan</DropdownMenuLabel>
        {PLANS.map(p => (
          <DropdownMenuItem
            key={p.value}
            disabled={p.value === farm.plan}
            onClick={() =>
              run({ action: 'change_plan', plan: p.value }, `${farm.farmName} moved to ${p.label}`)
            }
          >
            {p.label}
            {p.value === farm.plan ? ' (current)' : ''}
          </DropdownMenuItem>
        ))}
        <DropdownMenuSeparator />
        {suspended ? (
          <DropdownMenuItem
            onClick={() => run({ action: 'reactivate' }, `${farm.farmName} reactivated`)}
          >
            <Play className='mr-2 h-4 w-4' /> Reactivate farm
          </DropdownMenuItem>
        ) : (
          <DropdownMenuItem
            className='text-red-600'
            onClick={() => {
              const reason = window.prompt(
                `Suspend "${farm.farmName}"? Members will lose access until reactivated.\nReason (optional):`
              );
              if (reason !== null) {
                run({ action: 'suspend', reason }, `${farm.farmName} suspended`);
              }
            }}
          >
            <Pause className='mr-2 h-4 w-4' /> Suspend farm
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
