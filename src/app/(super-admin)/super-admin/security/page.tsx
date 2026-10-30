// Super Admin - Security & audit log
'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { useClerk } from '@clerk/nextjs';
import { format } from 'date-fns';
import { Shield, History, KeyRound, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface AuditLog {
  id: string;
  tenantId: string | null;
  user: string;
  action: string;
  resource: string;
  resourceId: string | null;
  details: Record<string, unknown> | null;
  ip: string | null;
  createdAt: string;
}

const ACTIONS = ['', 'create', 'update', 'delete', 'read', 'login', 'logout'];

export default function SecurityPage() {
  const { openUserProfile } = useClerk();
  const [page, setPage] = useState(1);
  const [action, setAction] = useState('');

  const { data, isLoading, isError } = useQuery({
    queryKey: ['admin', 'audit-logs', page, action],
    queryFn: async () => {
      const params = new URLSearchParams({ page: String(page), limit: '50' });
      if (action) params.set('action', action);
      const res = await fetch(`/api/admin/audit-logs?${params.toString()}`);
      if (!res.ok) throw new Error('Failed to load audit log');
      return res.json() as Promise<{
        data: AuditLog[];
        pagination: { page: number; totalPages: number; total: number };
      }>;
    },
  });

  return (
    <div className='space-y-4 md:space-y-6'>
      <div>
        <h1 className='text-xl font-bold md:text-2xl dark:text-white'>Security</h1>
        <p className='text-sm text-gray-500'>Platform audit trail and account security</p>
      </div>

      <div className='grid gap-4 md:grid-cols-2'>
        <div className='rounded-xl border border-gray-100 bg-white p-5 dark:border-slate-700 dark:bg-slate-800'>
          <div className='mb-2 flex items-center gap-2 font-semibold dark:text-white'>
            <KeyRound className='h-5 w-5 text-emerald-600' /> Two-factor & sessions
          </div>
          <p className='mb-3 text-sm text-gray-500'>
            Sign-in security (2FA, active sessions, devices) is managed by Clerk for every account,
            including yours.
          </p>
          <Button variant='outline' size='sm' onClick={() => openUserProfile()}>
            Manage my account security
          </Button>
        </div>
        <div className='rounded-xl border border-gray-100 bg-white p-5 dark:border-slate-700 dark:bg-slate-800'>
          <div className='mb-2 flex items-center gap-2 font-semibold dark:text-white'>
            <Shield className='h-5 w-5 text-blue-600' /> Super admin access
          </div>
          <p className='text-sm text-gray-500'>
            Granted only to verified primary emails listed in <code>SUPER_ADMIN_EMAILS</code>, or
            users promoted under{' '}
            <Link href='/super-admin/users' className='underline'>
              Users
            </Link>
            . Access is denied whenever the check cannot be completed.
          </p>
        </div>
      </div>

      <div className='rounded-xl border border-gray-100 bg-white dark:border-slate-700 dark:bg-slate-800'>
        <div className='flex flex-col gap-3 border-b border-gray-100 p-4 sm:flex-row sm:items-center sm:justify-between dark:border-slate-700'>
          <div className='flex items-center gap-2 font-semibold dark:text-white'>
            <History className='h-5 w-5' /> Audit log
            {data && (
              <span className='text-sm font-normal text-gray-500'>({data.pagination.total})</span>
            )}
          </div>
          <select
            aria-label='Filter by action'
            className='h-9 rounded-md border px-2 text-sm dark:bg-slate-900'
            value={action}
            onChange={e => {
              setAction(e.target.value);
              setPage(1);
            }}
          >
            {ACTIONS.map(a => (
              <option key={a} value={a}>
                {a ? a[0].toUpperCase() + a.slice(1) : 'All actions'}
              </option>
            ))}
          </select>
        </div>

        {isLoading && (
          <div className='flex justify-center p-8'>
            <Loader2 className='h-6 w-6 animate-spin text-gray-400' />
          </div>
        )}
        {isError && <p className='p-4 text-sm text-red-600'>Could not load the audit log.</p>}
        {data && data.data.length === 0 && (
          <p className='p-4 text-sm text-gray-500'>No audit events recorded yet.</p>
        )}
        {data && data.data.length > 0 && (
          <div className='overflow-x-auto'>
            <table className='w-full text-sm'>
              <thead className='text-left text-gray-500'>
                <tr>
                  <th className='p-3'>When</th>
                  <th className='p-3'>User</th>
                  <th className='p-3'>Action</th>
                  <th className='p-3'>Resource</th>
                  <th className='p-3'>Farm</th>
                </tr>
              </thead>
              <tbody>
                {data.data.map(log => (
                  <tr key={log.id} className='border-t border-gray-100 dark:border-slate-700'>
                    <td className='whitespace-nowrap p-3'>
                      {format(new Date(log.createdAt), 'dd MMM yyyy HH:mm')}
                    </td>
                    <td className='p-3'>{log.user}</td>
                    <td className='p-3 capitalize'>{log.action}</td>
                    <td className='p-3'>
                      {log.resource}
                      {log.resourceId && (
                        <span className='ml-1 text-xs text-gray-400'>{log.resourceId}</span>
                      )}
                    </td>
                    <td className='p-3 text-xs text-gray-500'>{log.tenantId || 'platform'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {data && data.pagination.totalPages > 1 && (
          <div className='flex items-center justify-end gap-2 p-3'>
            <Button
              variant='outline'
              size='sm'
              disabled={page <= 1}
              onClick={() => setPage(p => p - 1)}
            >
              Previous
            </Button>
            <span className='text-sm text-gray-500'>
              Page {page} of {data.pagination.totalPages}
            </span>
            <Button
              variant='outline'
              size='sm'
              disabled={page >= data.pagination.totalPages}
              onClick={() => setPage(p => p + 1)}
            >
              Next
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
