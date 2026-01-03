'use client';

import * as React from 'react';
import {
  Settings,
  User,
  LayoutDashboard,
  Moon,
  Sun,
  Laptop,
  Beef,
  Milk,
  Heart,
  FileText,
  DollarSign,
  MapPin,
  Activity,
  Users,
  Syringe,
} from 'lucide-react';

import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
} from '@/components/ui/command';
import { useTheme } from 'next-themes';
import { useRouter } from 'next/navigation';

export function CommandPalette() {
  const [open, setOpen] = React.useState(false);
  const { setTheme } = useTheme();
  const router = useRouter();

  React.useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen(open => !open);
      }
    };

    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, []);

  const runCommand = React.useCallback((command: () => unknown) => {
    setOpen(false);
    command();
  }, []);

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput placeholder='Type a command or search...' />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>

        <CommandGroup heading='Navigation'>
          <CommandItem onSelect={() => runCommand(() => router.push('/dashboard'))}>
            <LayoutDashboard className='mr-2 h-4 w-4' />
            <span>Dashboard</span>
            <CommandShortcut>⌘D</CommandShortcut>
          </CommandItem>
          <CommandItem onSelect={() => runCommand(() => router.push('/animals'))}>
            <Beef className='mr-2 h-4 w-4' />
            <span>Animals</span>
          </CommandItem>
          <CommandItem onSelect={() => runCommand(() => router.push('/milk'))}>
            <Milk className='mr-2 h-4 w-4' />
            <span>Milk Production</span>
          </CommandItem>
          <CommandItem onSelect={() => runCommand(() => router.push('/health'))}>
            <Heart className='mr-2 h-4 w-4' />
            <span>Health Records</span>
          </CommandItem>
          <CommandItem onSelect={() => runCommand(() => router.push('/breeding'))}>
            <Activity className='mr-2 h-4 w-4' />
            <span>Breeding Center</span>
          </CommandItem>
        </CommandGroup>

        <CommandSeparator />

        <CommandGroup heading='Management'>
          <CommandItem onSelect={() => runCommand(() => router.push('/finance'))}>
            <DollarSign className='mr-2 h-4 w-4' />
            <span>Finance</span>
          </CommandItem>
          <CommandItem onSelect={() => runCommand(() => router.push('/medicine'))}>
            <Syringe className='mr-2 h-4 w-4' />
            <span>Medicine Inventory</span>
          </CommandItem>
          <CommandItem onSelect={() => runCommand(() => router.push('/staff'))}>
            <Users className='mr-2 h-4 w-4' />
            <span>Staff Management</span>
          </CommandItem>
          <CommandItem onSelect={() => runCommand(() => router.push('/reports'))}>
            <FileText className='mr-2 h-4 w-4' />
            <span>Reports</span>
          </CommandItem>
        </CommandGroup>

        <CommandSeparator />

        <CommandGroup heading='Settings'>
          <CommandItem onSelect={() => runCommand(() => router.push('/settings'))}>
            <User className='mr-2 h-4 w-4' />
            <span>Profile & Settings</span>
            <CommandShortcut>⌘P</CommandShortcut>
          </CommandItem>
          <CommandItem onSelect={() => runCommand(() => router.push('/settings'))}>
            <Settings className='mr-2 h-4 w-4' />
            <span>Farm Settings</span>
            <CommandShortcut>⌘S</CommandShortcut>
          </CommandItem>
          <CommandItem onSelect={() => runCommand(() => router.push('/settings'))}>
            <MapPin className='mr-2 h-4 w-4' />
            <span>Location Settings</span>
          </CommandItem>
        </CommandGroup>

        <CommandSeparator />

        <CommandGroup heading='Theme'>
          <CommandItem onSelect={() => runCommand(() => setTheme('light'))}>
            <Sun className='mr-2 h-4 w-4' />
            <span>Light</span>
          </CommandItem>
          <CommandItem onSelect={() => runCommand(() => setTheme('dark'))}>
            <Moon className='mr-2 h-4 w-4' />
            <span>Dark</span>
          </CommandItem>
          <CommandItem onSelect={() => runCommand(() => setTheme('system'))}>
            <Laptop className='mr-2 h-4 w-4' />
            <span>System</span>
          </CommandItem>
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}
