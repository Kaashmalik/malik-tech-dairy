// Super Admin - Notifications Page
'use client';

import { useState } from 'react';
import {
  Bell,
  Check,
  CheckCheck,
  Trash2,
  Filter,
  Clock,
  AlertTriangle,
  Info,
  CheckCircle2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { format } from 'date-fns';

interface Notification {
  id: string;
  type: 'info' | 'warning' | 'success' | 'alert';
  title: string;
  message: string;
  read: boolean;
  createdAt: Date;
}

const typeConfig = {
  info: { icon: Info, color: 'bg-blue-100 text-blue-600' },
  warning: { icon: AlertTriangle, color: 'bg-amber-100 text-amber-600' },
  success: { icon: CheckCircle2, color: 'bg-emerald-100 text-emerald-600' },
  alert: { icon: Bell, color: 'bg-red-100 text-red-600' },
};

export default function NotificationsPage() {
  const [filter, setFilter] = useState('all');
  const [notifications, setNotifications] = useState<Notification[]>([
    {
      id: '1',
      type: 'success',
      title: 'New Farm Approved',
      message: 'Green Valley Dairy has been approved and assigned Farm ID.',
      read: false,
      createdAt: new Date(),
    },
    {
      id: '2',
      type: 'warning',
      title: 'Payment Pending Review',
      message: 'Payment slip uploaded by Sunrise Farm requires verification.',
      read: false,
      createdAt: new Date(Date.now() - 3600000),
    },
    {
      id: '3',
      type: 'info',
      title: 'New User Registration',
      message: 'Ahmad Khan has registered on the platform.',
      read: true,
      createdAt: new Date(Date.now() - 86400000),
    },
    {
      id: '4',
      type: 'alert',
      title: 'System Alert',
      message: 'High server load detected. Consider scaling resources.',
      read: true,
      createdAt: new Date(Date.now() - 172800000),
    },
  ]);

  const markAsRead = (id: string) => {
    setNotifications(prev => prev.map(n => (n.id === id ? { ...n, read: true } : n)));
  };

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const deleteNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const filtered = notifications.filter(n => {
    if (filter === 'unread') return !n.read;
    if (filter === 'read') return n.read;
    return true;
  });

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <div className='space-y-4 md:space-y-6'>
      <div className='flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between'>
        <div>
          <div className='flex items-center gap-2'>
            <h1 className='text-xl font-bold md:text-2xl dark:text-white'>Notifications</h1>
            {unreadCount > 0 && (
              <span className='rounded-full bg-red-500 px-2 py-0.5 text-xs text-white'>
                {unreadCount}
              </span>
            )}
          </div>
          <p className='text-sm text-gray-500'>Stay updated with platform activities</p>
        </div>
        <div className='flex gap-2'>
          <Select value={filter} onValueChange={setFilter}>
            <SelectTrigger className='w-32'>
              <Filter className='mr-2 h-4 w-4' />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value='all'>All</SelectItem>
              <SelectItem value='unread'>Unread</SelectItem>
              <SelectItem value='read'>Read</SelectItem>
            </SelectContent>
          </Select>
          <Button variant='outline' size='sm' onClick={markAllAsRead}>
            <CheckCheck className='mr-2 h-4 w-4' /> Mark all read
          </Button>
        </div>
      </div>

      <div className='divide-y divide-gray-100 rounded-xl border border-gray-100 bg-white shadow-sm dark:divide-slate-700 dark:border-slate-700 dark:bg-slate-800'>
        {filtered.length === 0 ? (
          <div className='p-12 text-center'>
            <Bell className='mx-auto h-12 w-12 text-gray-300' />
            <p className='mt-2 text-gray-500'>No notifications</p>
          </div>
        ) : (
          filtered.map(notification => {
            const config = typeConfig[notification.type];
            const Icon = config.icon;

            return (
              <div
                key={notification.id}
                className={`p-4 ${!notification.read ? 'bg-blue-50/50 dark:bg-blue-900/10' : ''}`}
              >
                <div className='flex items-start gap-3'>
                  <div className={`flex-shrink-0 rounded-lg p-2 ${config.color}`}>
                    <Icon className='h-4 w-4' />
                  </div>
                  <div className='min-w-0 flex-1'>
                    <div className='flex items-start justify-between gap-2'>
                      <div className='flex-1'>
                        <p className='font-medium dark:text-white'>{notification.title}</p>
                        <p className='mt-0.5 text-sm text-gray-600 dark:text-slate-400'>
                          {notification.message}
                        </p>
                        <p className='mt-1 flex items-center gap-1 text-xs text-gray-400'>
                          <Clock className='h-3 w-3' />
                          {format(notification.createdAt, 'MMM d, h:mm a')}
                        </p>
                      </div>
                      <div className='flex flex-shrink-0 items-center gap-1'>
                        {!notification.read && (
                          <Button
                            variant='ghost'
                            size='icon'
                            className='h-8 w-8'
                            onClick={() => markAsRead(notification.id)}
                          >
                            <Check className='h-4 w-4' />
                          </Button>
                        )}
                        <Button
                          variant='ghost'
                          size='icon'
                          className='h-8 w-8 text-red-500'
                          onClick={() => deleteNotification(notification.id)}
                        >
                          <Trash2 className='h-4 w-4' />
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
