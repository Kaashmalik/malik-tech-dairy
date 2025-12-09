// Public Layout - Requires authentication but NOT organization
// Used for: /apply, /apply/success, /apply/status

import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

// Super admin emails - users with these emails get super_admin role
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

// Ensure user exists in Supabase after Clerk signup
// Returns true if user is super admin
async function ensureUserExists(userId: string, email: string, name?: string): Promise<boolean> {
  // Determine if user should be super admin
  const isSuperAdmin = SUPER_ADMIN_EMAILS.includes(email.toLowerCase());

  try {
    // Use Supabase REST API instead of direct postgres (more reliable)
    const { getSupabaseClient } = await import('@/lib/supabase');
    const supabase = getSupabaseClient();

    // Check if user already exists
    const { data, error: fetchError } = await supabase
      .from('platform_users')
      .select('*')
      .eq('id', userId)
      .single();

    const existingUser = data as PlatformUser | null;

    if (fetchError && fetchError.code !== 'PGRST116') {
      console.error('Error fetching user:', fetchError);
    }

    if (!existingUser) {
      // Create user in Supabase
      const newUser: Partial<PlatformUser> = {
        id: userId,
        email: email,
        name: name || null,
        platform_role: isSuperAdmin ? 'super_admin' : 'user',
        is_active: true,
        email_verified: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      const { error: insertError } = await supabase
        .from('platform_users')
        .insert(newUser as PlatformUser);

      if (insertError) {
        console.error('Error creating user:', insertError);
        return isSuperAdmin;
      }

      return isSuperAdmin;
    } else if (isSuperAdmin && existingUser.platform_role !== 'super_admin') {
      // Upgrade existing user to super admin if email matches
      const { error: updateError } = await supabase
        .from('platform_users')
        .update({
          platform_role: 'super_admin',
          updated_at: new Date().toISOString(),
        } as Partial<PlatformUser>)
        .eq('id', userId);

      if (updateError) {
        console.error('Error upgrading user:', updateError);
      }
      return true;
    }

    return existingUser.platform_role === 'super_admin';
  } catch (error) {
    console.error('Error ensuring user exists:', error);
    return isSuperAdmin;
  }
}

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

  // Get user email from Clerk
  const { clerkClient } = await import('@clerk/nextjs/server');
  const client = await clerkClient();
  const user = await client.users.getUser(userId);
  const email = user.emailAddresses[0]?.emailAddress || '';
  const name = `${user.firstName || ''} ${user.lastName || ''}`.trim();

  // Ensure user exists in Supabase and check if super admin
  const isSuperAdmin = await ensureUserExists(userId, email, name);

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
