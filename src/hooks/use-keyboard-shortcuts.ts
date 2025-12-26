'use client';

import { useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';

/**
 * Enterprise Keyboard Shortcuts Hook for MTK Dairy
 * 
 * Provides global keyboard shortcuts for power users.
 * Shortcuts are disabled when focused on input elements.
 */

export interface KeyboardShortcut {
  key: string;
  ctrl?: boolean;
  alt?: boolean;
  shift?: boolean;
  meta?: boolean;
  description: string;
  action: () => void;
}

interface UseKeyboardShortcutsOptions {
  enabled?: boolean;
  shortcuts?: KeyboardShortcut[];
}

// Default navigation shortcuts
const createDefaultShortcuts = (router: ReturnType<typeof useRouter>): KeyboardShortcut[] => [
  {
    key: 'g',
    description: 'Go to Dashboard',
    action: () => router.push('/dashboard'),
  },
  {
    key: 'a',
    shift: true,
    description: 'Go to Animals',
    action: () => router.push('/dashboard/animals'),
  },
  {
    key: 'm',
    shift: true,
    description: 'Go to Milk Production',
    action: () => router.push('/dashboard/milk'),
  },
  {
    key: 'h',
    shift: true,
    description: 'Go to Health Records',
    action: () => router.push('/dashboard/health'),
  },
  {
    key: 'b',
    shift: true,
    description: 'Go to Breeding',
    action: () => router.push('/dashboard/breeding'),
  },
  {
    key: 'f',
    shift: true,
    description: 'Go to Finance',
    action: () => router.push('/dashboard/finance'),
  },
  {
    key: 's',
    shift: true,
    description: 'Go to Settings',
    action: () => router.push('/dashboard/settings'),
  },
  {
    key: 'n',
    ctrl: true,
    description: 'Create New (context-aware)',
    action: () => {
      // Trigger a custom event that pages can listen to
      window.dispatchEvent(new CustomEvent('shortcut:create-new'));
    },
  },
  {
    key: 'Escape',
    description: 'Close modal/dialog',
    action: () => {
      window.dispatchEvent(new CustomEvent('shortcut:escape'));
    },
  },
  {
    key: '?',
    shift: true,
    description: 'Show keyboard shortcuts help',
    action: () => {
      window.dispatchEvent(new CustomEvent('shortcut:show-help'));
    },
  },
];

function isInputElement(element: EventTarget | null): boolean {
  if (!element || !(element instanceof HTMLElement)) return false;
  
  const tagName = element.tagName.toLowerCase();
  if (['input', 'textarea', 'select'].includes(tagName)) return true;
  if (element.isContentEditable) return true;
  
  return false;
}

function matchesShortcut(event: KeyboardEvent, shortcut: KeyboardShortcut): boolean {
  const keyMatches = event.key.toLowerCase() === shortcut.key.toLowerCase();
  const ctrlMatches = !!shortcut.ctrl === (event.ctrlKey || event.metaKey);
  const altMatches = !!shortcut.alt === event.altKey;
  const shiftMatches = !!shortcut.shift === event.shiftKey;
  const metaMatches = !!shortcut.meta === event.metaKey;
  
  return keyMatches && ctrlMatches && altMatches && shiftMatches && metaMatches;
}

export function useKeyboardShortcuts(options: UseKeyboardShortcutsOptions = {}) {
  const { enabled = true, shortcuts: customShortcuts } = options;
  const router = useRouter();
  const sequenceRef = useRef<string[]>([]);
  const sequenceTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const shortcuts = customShortcuts || createDefaultShortcuts(router);

  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (!enabled) return;
      if (isInputElement(event.target)) return;

      // Handle keyboard shortcuts
      for (const shortcut of shortcuts) {
        if (matchesShortcut(event, shortcut)) {
          event.preventDefault();
          shortcut.action();
          return;
        }
      }

      // Handle key sequences (e.g., 'g' then 'd' for dashboard)
      if (!event.ctrlKey && !event.altKey && !event.metaKey) {
        sequenceRef.current.push(event.key.toLowerCase());
        
        // Clear sequence after 1 second of inactivity
        if (sequenceTimeoutRef.current) {
          clearTimeout(sequenceTimeoutRef.current);
        }
        sequenceTimeoutRef.current = setTimeout((): void => {
          sequenceRef.current = [];
        }, 1000);

        // Check for 'g' sequences (vim-like navigation)
        const sequence = sequenceRef.current.join('');
        switch (sequence) {
          case 'gd':
            event.preventDefault();
            router.push('/dashboard');
            sequenceRef.current = [];
            break;
          case 'ga':
            event.preventDefault();
            router.push('/dashboard/animals');
            sequenceRef.current = [];
            break;
          case 'gm':
            event.preventDefault();
            router.push('/dashboard/milk');
            sequenceRef.current = [];
            break;
          case 'gh':
            event.preventDefault();
            router.push('/dashboard/health');
            sequenceRef.current = [];
            break;
          case 'gb':
            event.preventDefault();
            router.push('/dashboard/breeding');
            sequenceRef.current = [];
            break;
          case 'gf':
            event.preventDefault();
            router.push('/dashboard/finance');
            sequenceRef.current = [];
            break;
          case 'gs':
            event.preventDefault();
            router.push('/dashboard/settings');
            sequenceRef.current = [];
            break;
        }
      }
    },
    [enabled, shortcuts, router]
  );

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      if (sequenceTimeoutRef.current) {
        clearTimeout(sequenceTimeoutRef.current);
      }
    };
  }, [handleKeyDown]);

  return { shortcuts };
}

// Formatted shortcuts for help modal
export function getShortcutsList(): Array<{ keys: string; description: string }> {
  return [
    { keys: '⌘/Ctrl + K', description: 'Open command palette' },
    { keys: '/', description: 'Open command palette (alternative)' },
    { keys: 'g then d', description: 'Go to Dashboard' },
    { keys: 'g then a', description: 'Go to Animals' },
    { keys: 'g then m', description: 'Go to Milk Production' },
    { keys: 'g then h', description: 'Go to Health Records' },
    { keys: 'g then b', description: 'Go to Breeding' },
    { keys: 'g then f', description: 'Go to Finance' },
    { keys: 'g then s', description: 'Go to Settings' },
    { keys: 'Shift + A', description: 'Quick jump to Animals' },
    { keys: 'Shift + M', description: 'Quick jump to Milk' },
    { keys: 'Ctrl + N', description: 'Create new (context-aware)' },
    { keys: 'Shift + ?', description: 'Show this help' },
    { keys: 'Escape', description: 'Close modal/dialog' },
  ];
}

// Hook for listening to shortcut events
export function useShortcutEvent(
  eventName: 'shortcut:create-new' | 'shortcut:escape' | 'shortcut:show-help',
  handler: () => void
) {
  useEffect(() => {
    window.addEventListener(eventName, handler);
    return () => window.removeEventListener(eventName, handler);
  }, [eventName, handler]);
}
