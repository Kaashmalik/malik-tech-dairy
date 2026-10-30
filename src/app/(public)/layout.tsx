import type { Metadata } from 'next';
// Public Layout - Requires authentication but NOT organization
// Used for: /apply, /apply/success, /apply/status
import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { ensurePlatformUser } from '@/lib/auth/platform-user';
import { logger } from '@/lib/logger';

// Private app area: keep out of search results
export const metadata: Metadata = { robots: { index: false, follow: false } };
export const dynamic = 'force-dynamic';
export default async function PublicLayout({ children }: { children: React.ReactNode }) {
  const { userId, orgId } = await auth();
  // Must be authenticated
  if (!userId) {
    redirect('/sign-in');
  }
  // If user already has an organization, redirect to dashboard
  if (orgId) {
    redirect('/dashboard');
  }
  // Ensure user exists in Supabase and check if super admin
  let email = '';
  let isSuperAdmin = false;
  try {
    const platformUser = await ensurePlatformUser(userId);
    email = platformUser.email || '';
    isSuperAdmin = platformUser.isSuperAdmin;
  } catch (error) {
    // Page still renders; API calls re-attempt the bootstrap and report errors
    logger.error('Public layout user bootstrap failed', error, { userId });
  }
  return (
    <div className='min-h-screen bg-gray-50 dark:bg-slate-900'>
      {/* Simple header for public pages */}
      <header className='border-b border-gray-200 bg-white dark:border-slate-700 dark:bg-slate-800'>
        <div className='container mx-auto flex items-center justify-between px-4 py-4'>
          <div className='flex items-center gap-3'>
            <div className='flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-600'>
              <span className='text-xl'>🐄</span>
            </div>
            <div>
              <h1 className='text-lg font-bold text-gray-900 dark:text-white'>MTK Dairy</h1>
              <p className='text-xs text-gray-500 dark:text-slate-400'>Smart Farm Management</p>
            </div>
          </div>
          <div className='flex items-center gap-4'>
            {isSuperAdmin && (
              <a
                href='/admin'
                className='rounded-lg bg-purple-600 px-3 py-1.5 text-sm font-medium text-white transition hover:bg-purple-700'
              >
                Admin Panel
              </a>
            )}
            <span className='text-sm text-gray-600 dark:text-slate-300'>{email}</span>
          </div>
        </div>
      </header>
      <main>{children}</main>
    </div>
  );
}
