'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import {
  Bell,
  Check,
  CheckCheck,
  AlertTriangle,
  Calendar,
  Package,
  ClipboardList,
  Info,
  Loader2,
  X,
  ExternalLink,
} from 'lucide-react';

interface NotificationItem {
  id: string;
  tenantId: string;
  userId?: string | null;
  type: string;
  title: string;
  message: string;
  link?: string | null;
  read: boolean;
  metadata?: any;
  createdAt: string;
}

export function NotificationBell() {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const fetchNotifications = async (triggerReminders: boolean = false) => {
    try {
      setLoading(true);
      const res = await fetch(
        `/api/notifications?limit=15${triggerReminders ? '&checkReminders=true' : ''}`,
        { cache: 'no-store' }
      );
      if (!res.ok) return;
      const data = await res.json();
      if (data.success) {
        setNotifications(data.items || []);
        setUnreadCount(data.unreadCount || 0);
      }
    } catch (err) {
      console.error('Error loading notifications:', err);
    } finally {
      setLoading(false);
    }
  };

  // Initial fetch with automated reminder checks triggered once
  useEffect(() => {
    fetchNotifications(true);

    // Refresh every 90 seconds
    const interval = setInterval(() => {
      fetchNotifications(false);
    }, 90000);

    return () => clearInterval(interval);
  }, []);

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleMarkAsRead = async (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    try {
      const res = await fetch('/api/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });
      if (res.ok) {
        setNotifications(prev => prev.map(n => (n.id === id ? { ...n, read: true } : n)));
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
    } catch (err) {
      console.error('Error marking read:', err);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      const res = await fetch('/api/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ markAll: true }),
      });
      if (res.ok) {
        setNotifications(prev => prev.map(n => ({ ...n, read: true })));
        setUnreadCount(0);
      }
    } catch (err) {
      console.error('Error marking all as read:', err);
    }
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const res = await fetch(`/api/notifications?id=${id}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        setNotifications(prev => {
          const removed = prev.find(n => n.id === id);
          if (removed && !removed.read) {
            setUnreadCount(c => Math.max(0, c - 1));
          }
          return prev.filter(n => n.id !== id);
        });
      }
    } catch (err) {
      console.error('Error deleting notification:', err);
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'vaccination_due':
        return <Calendar className='h-4 w-4 text-emerald-500' />;
      case 'pregnancy_check':
        return <Info className='h-4 w-4 text-purple-500' />;
      case 'low_stock':
        return <AlertTriangle className='h-4 w-4 text-amber-500' />;
      case 'task_assigned':
        return <ClipboardList className='h-4 w-4 text-blue-500' />;
      default:
        return <Bell className='h-4 w-4 text-emerald-600' />;
    }
  };

  const formatTimeAgo = (dateStr: string) => {
    const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
    if (diff < 60) return 'Just now';
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return `${Math.floor(diff / 86400)}d ago`;
  };

  return (
    <div className='relative' ref={dropdownRef}>
      {/* Bell Button */}
      <button
        type='button'
        id='notification-bell-btn'
        aria-label='View notifications'
        onClick={() => {
          setIsOpen(!isOpen);
          if (!isOpen) fetchNotifications(false);
        }}
        className='relative rounded-xl p-2 text-neutral-600 transition-colors hover:bg-neutral-100 focus:outline-none focus:ring-2 focus:ring-emerald-500 dark:text-neutral-300 dark:hover:bg-neutral-800'
      >
        <Bell className='h-5 w-5' />
        {unreadCount > 0 && (
          <span className='absolute right-1 top-1 flex h-4 w-4'>
            <span className='absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75'></span>
            <span className='relative inline-flex h-4 w-4 items-center justify-center rounded-full bg-emerald-600 text-[10px] font-bold leading-none text-white'>
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          </span>
        )}
      </button>

      {/* Popover Dropdown */}
      {isOpen && (
        <div
          className='animate-in fade-in slide-in-from-top-2 absolute right-0 z-50 mt-2 w-80 overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-2xl duration-150 sm:w-96 dark:border-neutral-800 dark:bg-neutral-900'
          role='region'
          aria-label='Notifications panel'
        >
          {/* Header */}
          <div className='flex items-center justify-between border-b border-neutral-100 bg-neutral-50/50 px-4 py-3 dark:border-neutral-800 dark:bg-neutral-900/50'>
            <div className='flex items-center space-x-2'>
              <h3 className='text-sm font-semibold text-neutral-900 dark:text-white'>
                Notifications
              </h3>
              {unreadCount > 0 && (
                <span className='rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'>
                  {unreadCount} new
                </span>
              )}
            </div>
            <div className='flex items-center space-x-1'>
              {unreadCount > 0 && (
                <button
                  type='button'
                  onClick={handleMarkAllAsRead}
                  className='flex items-center space-x-1 rounded px-2 py-1 text-xs text-emerald-600 hover:underline dark:text-emerald-400'
                >
                  <CheckCheck className='mr-1 h-3.5 w-3.5' />
                  <span>Mark all read</span>
                </button>
              )}
            </div>
          </div>

          {/* List */}
          <div className='max-h-[380px] divide-y divide-neutral-100 overflow-y-auto dark:divide-neutral-800'>
            {loading && notifications.length === 0 ? (
              <div className='flex flex-col items-center justify-center py-8 text-sm text-neutral-400'>
                <Loader2 className='mb-2 h-6 w-6 animate-spin text-emerald-600' />
                <span>Checking notifications...</span>
              </div>
            ) : notifications.length === 0 ? (
              <div className='px-4 py-10 text-center'>
                <div className='mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-emerald-50 text-emerald-600 dark:bg-emerald-950/50'>
                  <Check className='h-5 w-5' />
                </div>
                <p className='text-sm font-medium text-neutral-900 dark:text-white'>
                  All caught up!
                </p>
                <p className='mt-1 text-xs text-neutral-500'>
                  No alerts or pending reminders right now.
                </p>
              </div>
            ) : (
              notifications.map(item => (
                <div
                  key={item.id}
                  className={`group relative flex items-start space-x-3 p-3.5 transition-colors ${
                    item.read
                      ? 'bg-transparent opacity-75 hover:opacity-100'
                      : 'bg-emerald-50/40 dark:bg-emerald-950/20'
                  }`}
                >
                  <div className='mt-0.5 shrink-0 rounded-xl bg-neutral-100 p-2 dark:bg-neutral-800'>
                    {getIcon(item.type)}
                  </div>
                  <div className='min-w-0 flex-1 pr-6'>
                    <div className='flex items-center justify-between'>
                      <h4 className='truncate text-xs font-semibold text-neutral-900 dark:text-neutral-100'>
                        {item.title}
                      </h4>
                      <span className='ml-2 whitespace-nowrap text-[10px] text-neutral-400'>
                        {formatTimeAgo(item.createdAt)}
                      </span>
                    </div>
                    <p className='mt-0.5 line-clamp-2 text-xs text-neutral-600 dark:text-neutral-400'>
                      {item.message}
                    </p>
                    {item.link && (
                      <Link
                        href={item.link}
                        onClick={() => {
                          if (!item.read) handleMarkAsRead(item.id);
                          setIsOpen(false);
                        }}
                        className='mt-1.5 inline-flex items-center text-[11px] font-medium text-emerald-600 hover:underline dark:text-emerald-400'
                      >
                        <span>View details</span>
                        <ExternalLink className='ml-1 h-3 w-3' />
                      </Link>
                    )}
                  </div>

                  {/* Actions on hover */}
                  <div className='absolute right-2 top-2 flex items-center space-x-1 opacity-0 transition-opacity group-hover:opacity-100'>
                    {!item.read && (
                      <button
                        type='button'
                        title='Mark as read'
                        onClick={e => handleMarkAsRead(item.id, e)}
                        className='rounded p-1 text-neutral-400 hover:text-emerald-600 dark:hover:text-emerald-400'
                      >
                        <Check className='h-3.5 w-3.5' />
                      </button>
                    )}
                    <button
                      type='button'
                      title='Delete'
                      onClick={e => handleDelete(item.id, e)}
                      className='rounded p-1 text-neutral-400 hover:text-rose-600'
                    >
                      <X className='h-3.5 w-3.5' />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
