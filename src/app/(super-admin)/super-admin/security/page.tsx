// Super Admin - Security Page
'use client';

import { useState } from 'react';
import {
  Shield,
  Key,
  Lock,
  Eye,
  EyeOff,
  AlertTriangle,
  CheckCircle2,
  Clock,
  MapPin,
  Monitor,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { format } from 'date-fns';

export default function SecurityPage() {
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const [ipRestriction, setIpRestriction] = useState(false);

  const sessions = [
    {
      id: '1',
      device: 'Chrome on Windows',
      ip: '192.168.1.1',
      location: 'Lahore, Pakistan',
      current: true,
      lastActive: new Date(),
    },
    {
      id: '2',
      device: 'Safari on iPhone',
      ip: '192.168.1.2',
      location: 'Karachi, Pakistan',
      current: false,
      lastActive: new Date(Date.now() - 3600000),
    },
  ];

  const auditLogs = [
    {
      id: '1',
      action: 'Farm Approved',
      user: 'Malik Kashif',
      ip: '192.168.1.1',
      createdAt: new Date(),
    },
    {
      id: '2',
      action: 'User Role Changed',
      user: 'Malik Kashif',
      ip: '192.168.1.1',
      createdAt: new Date(Date.now() - 7200000),
    },
    {
      id: '3',
      action: 'Settings Updated',
      user: 'Malik Kashif',
      ip: '192.168.1.1',
      createdAt: new Date(Date.now() - 86400000),
    },
  ];

  return (
    <div className='space-y-4 md:space-y-6'>
      <div>
        <h1 className='text-xl font-bold md:text-2xl dark:text-white'>Security</h1>
        <p className='text-sm text-gray-500'>Manage platform security settings</p>
      </div>

      {/* Security Status */}
      <div className='grid grid-cols-1 gap-4 md:grid-cols-3'>
        <div className='rounded-xl border border-gray-100 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-800'>
          <div className='flex items-center gap-3'>
            <div className='rounded-lg bg-emerald-100 p-2'>
              <Shield className='h-5 w-5 text-emerald-600' />
            </div>
            <div>
              <p className='font-medium dark:text-white'>Security Score</p>
              <p className='text-2xl font-bold text-emerald-600'>85%</p>
            </div>
          </div>
        </div>
        <div className='rounded-xl border border-gray-100 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-800'>
          <div className='flex items-center gap-3'>
            <div className='rounded-lg bg-blue-100 p-2'>
              <Monitor className='h-5 w-5 text-blue-600' />
            </div>
            <div>
              <p className='font-medium dark:text-white'>Active Sessions</p>
              <p className='text-2xl font-bold text-blue-600'>{sessions.length}</p>
            </div>
          </div>
        </div>
        <div className='rounded-xl border border-gray-100 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-800'>
          <div className='flex items-center gap-3'>
            <div className='rounded-lg bg-amber-100 p-2'>
              <AlertTriangle className='h-5 w-5 text-amber-600' />
            </div>
            <div>
              <p className='font-medium dark:text-white'>Failed Logins</p>
              <p className='text-2xl font-bold text-amber-600'>0</p>
            </div>
          </div>
        </div>
      </div>

      {/* Security Settings */}
      <div className='rounded-xl border border-gray-100 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-800'>
        <div className='border-b border-gray-100 p-4 dark:border-slate-700'>
          <h3 className='font-semibold dark:text-white'>Security Settings</h3>
        </div>
        <div className='space-y-4 p-4'>
          <div className='flex items-center justify-between py-2'>
            <div>
              <p className='font-medium dark:text-white'>Two-Factor Authentication</p>
              <p className='text-sm text-gray-500'>Add an extra layer of security</p>
            </div>
            <Switch checked={twoFactorEnabled} onCheckedChange={setTwoFactorEnabled} />
          </div>
          <div className='flex items-center justify-between py-2'>
            <div>
              <p className='font-medium dark:text-white'>IP Restriction</p>
              <p className='text-sm text-gray-500'>Limit access to specific IP addresses</p>
            </div>
            <Switch checked={ipRestriction} onCheckedChange={setIpRestriction} />
          </div>
        </div>
      </div>

      {/* Active Sessions */}
      <div className='rounded-xl border border-gray-100 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-800'>
        <div className='flex items-center justify-between border-b border-gray-100 p-4 dark:border-slate-700'>
          <h3 className='font-semibold dark:text-white'>Active Sessions</h3>
          <Button variant='outline' size='sm'>
            End All Sessions
          </Button>
        </div>
        <div className='divide-y divide-gray-100 dark:divide-slate-700'>
          {sessions.map(session => (
            <div key={session.id} className='flex items-center justify-between p-4'>
              <div className='flex items-center gap-3'>
                <Monitor className='h-5 w-5 text-gray-400' />
                <div>
                  <p className='flex items-center gap-2 font-medium dark:text-white'>
                    {session.device}
                    {session.current && (
                      <span className='rounded bg-emerald-100 px-2 py-0.5 text-xs text-emerald-600'>
                        Current
                      </span>
                    )}
                  </p>
                  <p className='flex items-center gap-2 text-sm text-gray-500'>
                    <MapPin className='h-3 w-3' /> {session.location} • {session.ip}
                  </p>
                </div>
              </div>
              {!session.current && (
                <Button variant='ghost' size='sm' className='text-red-500'>
                  End
                </Button>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Audit Log */}
      <div className='rounded-xl border border-gray-100 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-800'>
        <div className='border-b border-gray-100 p-4 dark:border-slate-700'>
          <h3 className='font-semibold dark:text-white'>Recent Activity</h3>
        </div>
        <div className='divide-y divide-gray-100 dark:divide-slate-700'>
          {auditLogs.map(log => (
            <div key={log.id} className='flex items-center justify-between p-4'>
              <div>
                <p className='font-medium dark:text-white'>{log.action}</p>
                <p className='text-sm text-gray-500'>
                  by {log.user} • {log.ip}
                </p>
              </div>
              <span className='text-xs text-gray-400'>
                {format(log.createdAt, 'MMM d, h:mm a')}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
