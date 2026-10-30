// Super Admin Layout
// Protected layout for super admin pages
import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { SuperAdminSidebar } from '@/components/admin/SuperAdminSidebar';
import { SuperAdminHeader } from '@/components/admin/SuperAdminHeader';
import { ensurePlatformUser } from '@/lib/auth/platform-user';
import { logger } from '@/lib/logger';

export const dynamic = 'force-dynamic';

/**
 * Fail closed: access requires a super_admin platform role (granted via DB, or via
 * the allow-list for a *verified* primary email). Any error denies access.
 */
async function checkAndSetupSuperAdmin(userId: string): Promise<boolean> {
  try {
    const platformUser = await ensurePlatformUser(userId);
    return platformUser.isSuperAdmin;
  } catch (error) {
    logger.error('Super admin check failed; denying access', error, { userId });
    return false;
  }
}
export default async function SuperAdminLayout({ children }: { children: React.ReactNode }) {
  const { userId } = await auth();
  if (!userId) {
    redirect('/sign-in');
  }
  const isAdmin = await checkAndSetupSuperAdmin(userId);
  if (!isAdmin) {
    // Redirect non-admins to apply page (they may not have org)
    redirect('/apply');
  }
  return (
    <div className='flex h-screen bg-gray-100 dark:bg-gray-900'>
      {/* Sidebar */}
      <SuperAdminSidebar />
      {/* Main Content */}
      <div className='flex flex-1 flex-col overflow-hidden'>
        {/* Header */}
        <SuperAdminHeader />
        {/* Page Content */}
        <main className='flex-1 overflow-y-auto p-6'>{children}</main>
      </div>
    </div>
  );
}
