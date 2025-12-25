// Super Admin Layout
// Protected layout for super admin pages
import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { SuperAdminSidebar } from '@/components/admin/SuperAdminSidebar';
import { SuperAdminHeader } from '@/components/admin/SuperAdminHeader';
// Super admin emails for auto-detection
const SUPER_ADMIN_EMAILS = ['mtkdairy@gmail.com'];
// Type for platform_users table
interface PlatformUser {
  id: string;
  email: string;
  name: string | null;
  platform_role: 'super_admin' | 'admin' | 'user';
  is_active: boolean;
  email_verified: boolean;
  created_at: string;
  updated_at: string;
}
async function checkAndSetupSuperAdmin(userId: string): Promise<boolean> {
  // Get user from Clerk to check email
  const { clerkClient } = await import('@clerk/nextjs/server');
  const client = await clerkClient();
  
  let email = '';
  let isSuperAdminEmail = false;
  
  try {
    const clerkUser = await client.users.getUser(userId);
    email = clerkUser.emailAddresses[0]?.emailAddress || '';
    isSuperAdminEmail = SUPER_ADMIN_EMAILS.includes(email.toLowerCase());
  } catch (clerkError) {
    // If Clerk fails, we can't verify the user
    if (process.env.NODE_ENV === 'development') {
    }
    return false;
  }
  // If email matches super admin list, grant access even if DB fails
  // This ensures super admin can always access the panel
  if (!isSuperAdminEmail) {
    return false;
  }
  try {
    // Use Supabase REST API instead of direct postgres
    const { getSupabaseClient } = await import('@/lib/supabase');
    const supabase = getSupabaseClient();
    // Check if user exists in DB
    const { data, error: fetchError } = await supabase
      .from('platform_users')
      .select('*')
      .eq('id', userId)
      .single();
    const user = data as PlatformUser | null;
    if (fetchError && fetchError.code !== 'PGRST116') {
      if (process.env.NODE_ENV === 'development') {
      }
    }
    if (!user) {
      // Create user with appropriate role
      const newUser = {
        id: userId,
        email: email,
        name: null,
        platform_role: 'super_admin',
        is_active: true,
        email_verified: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error: insertError } = await (supabase.from('platform_users') as any).insert([
        newUser,
      ]);
      // Ignore duplicate key error (23505) - user already exists
      if (insertError && insertError.code !== '23505' && process.env.NODE_ENV === 'development') {
      }
      return true; // Super admin email, allow access
    }
    // If user exists but should be super admin, upgrade
    if (user.platform_role !== 'super_admin') {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error: updateError } = await (supabase.from('platform_users') as any)
        .update({ platform_role: 'super_admin', updated_at: new Date().toISOString() })
        .eq('id', userId);
      if (updateError && process.env.NODE_ENV === 'development') {
      }
    }
    return true;
  } catch (error) {
    // DB connection failed but email is in super admin list - allow access
    if (process.env.NODE_ENV === 'development') {
      console.error('[SuperAdmin] DB error (allowing based on email):', error);
    }
    return isSuperAdminEmail;
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