'use client';

import * as React from 'react';
import { useEffect, useState, useCallback } from 'react';
import { Search } from 'lucide-react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Command } from 'cmdk';
import { useRouter } from 'next/navigation';

interface CommandItem {
  id: string;
  title: string;
  description?: string;
  icon?: React.ReactNode;
  action: () => void;
  keywords?: string[];
}

export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const router = useRouter();

  const commands: CommandItem[] = [
    {
      id: 'dashboard',
      title: 'Dashboard',
      description: 'View farm overview and statistics',
      action: () => {
        router.push('/dashboard');
        setOpen(false);
      },
      keywords: ['home', 'overview', 'stats'],
    },
    {
      id: 'animals',
      title: 'Animals',
      description: 'Manage livestock and animal records',
      action: () => {
        router.push('/animals');
        setOpen(false);
      },
      keywords: ['livestock', 'cattle', 'cows', 'buffalo'],
    },
    {
      id: 'milk',
      title: 'Milk Production',
      description: 'Track milk yields and production',
      action: () => {
        router.push('/milk');
        setOpen(false);
      },
      keywords: ['milk', 'dairy', 'production', 'yields'],
    },
    {
      id: 'health',
      title: 'Health Records',
      description: 'Monitor animal health and treatments',
      action: () => {
        router.push('/health');
        setOpen(false);
      },
      keywords: ['health', 'veterinary', 'treatment', 'medicine'],
    },
    {
      id: 'breeding',
      title: 'Breeding',
      description: 'Manage breeding programs and records',
      action: () => {
        router.push('/breeding');
        setOpen(false);
      },
      keywords: ['breeding', 'pregnancy', 'birth', 'calves'],
    },
    {
      id: 'diseases',
      title: 'Disease Management',
      description: 'Track diseases and prevention measures',
      action: () => {
        router.push('/diseases');
        setOpen(false);
      },
      keywords: ['disease', 'sickness', 'illness', 'outbreak'],
    },
    {
      id: 'finance',
      title: 'Finance',
      description: 'Manage expenses and income',
      action: () => {
        router.push('/finance');
        setOpen(false);
      },
      keywords: ['money', 'expenses', 'income', 'profit'],
    },
    {
      id: 'analytics',
      title: 'Analytics',
      description: 'View detailed reports and insights',
      action: () => {
        router.push('/analytics');
        setOpen(false);
      },
      keywords: ['reports', 'insights', 'data', 'charts'],
    },
    {
      id: 'settings',
      title: 'Settings',
      description: 'Configure farm preferences',
      action: () => {
        router.push('/settings');
        setOpen(false);
      },
      keywords: ['preferences', 'config', 'options'],
    },
    {
      id: 'add-animal',
      title: 'Add New Animal',
      description: 'Quickly add a new animal to your farm',
      action: () => {
        router.push('/animals?action=add');
        setOpen(false);
      },
      keywords: ['new', 'create', 'add animal'],
    },
    {
      id: 'log-milk',
      title: 'Log Milk Production',
      description: "Record today's milk production",
      action: () => {
        router.push('/milk?action=log');
        setOpen(false);
      },
      keywords: ['record', 'log', 'milk'],
    },
    {
      id: 'health-check',
      title: 'Health Checkup',
      description: 'Schedule or record a health checkup',
      action: () => {
        router.push('/health?action=add');
        setOpen(false);
      },
      keywords: ['checkup', 'veterinary', 'health'],
    },
  ];

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if ((e.key === 'k' && (e.metaKey || e.ctrlKey)) || e.key === '/') {
        if (
          (e.target instanceof HTMLElement && e.target.isContentEditable) ||
          e.target instanceof HTMLInputElement ||
          e.target instanceof HTMLTextAreaElement ||
          e.target instanceof HTMLSelectElement
        ) {
          return;
        }
        e.preventDefault();
        setOpen(open => !open);
      }
    };

    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, []);

  const runCommand = useCallback((command: CommandItem) => {
    command.action();
  }, []);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className='max-w-2xl overflow-hidden p-0'>
        <Command className='rounded-lg border shadow-md'>
          <div className='flex items-center border-b px-3'>
            <Search className='mr-2 h-4 w-4 shrink-0 opacity-50' />
            <Command.Input
              placeholder='Type a command or search...'
              className='placeholder:text-muted-foreground flex h-11 w-full rounded-md bg-transparent py-3 text-sm outline-none disabled:cursor-not-allowed disabled:opacity-50'
            />
          </div>
          <Command.List className='max-h-[450px] overflow-y-auto p-2'>
            <Command.Empty className='text-muted-foreground py-6 text-center text-sm'>
              No results found.
            </Command.Empty>

            <Command.Group heading='Navigation'>
              {commands
                .filter(cmd =>
                  [
                    'dashboard',
                    'animals',
                    'milk',
                    'health',
                    'breeding',
                    'diseases',
                    'finance',
                    'analytics',
                    'settings',
                  ].includes(cmd.id)
                )
                .map(command => (
                  <Command.Item
                    key={command.id}
                    onSelect={() => runCommand(command)}
                    className='hover:bg-accent aria-selected:bg-accent flex cursor-pointer items-center gap-3 rounded-md px-3 py-2 text-sm'
                  >
                    {command.icon}
                    <div className='flex-1'>
                      <div className='font-medium'>{command.title}</div>
                      {command.description && (
                        <div className='text-muted-foreground text-xs'>{command.description}</div>
                      )}
                    </div>
                  </Command.Item>
                ))}
            </Command.Group>

            <Command.Group heading='Quick Actions'>
              {commands
                .filter(cmd => ['add-animal', 'log-milk', 'health-check'].includes(cmd.id))
                .map(command => (
                  <Command.Item
                    key={command.id}
                    onSelect={() => runCommand(command)}
                    className='hover:bg-accent aria-selected:bg-accent flex cursor-pointer items-center gap-3 rounded-md px-3 py-2 text-sm'
                  >
                    {command.icon}
                    <div className='flex-1'>
                      <div className='font-medium'>{command.title}</div>
                      {command.description && (
                        <div className='text-muted-foreground text-xs'>{command.description}</div>
                      )}
                    </div>
                  </Command.Item>
                ))}
            </Command.Group>
          </Command.List>
        </Command>
      </DialogContent>
    </Dialog>
  );
}
