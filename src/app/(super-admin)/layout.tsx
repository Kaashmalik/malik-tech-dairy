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
  const clerkUser = await client.users.getUser(userId);
  const email = clerkUser.emailAddresses[0]?.emailAddress || '';
  const isSuperAdminEmail = SUPER_ADMIN_EMAILS.includes(email.toLowerCase());
  
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
      console.error('Error fetching user:', fetchError);
    }

    if (!user) {
      // Create user with appropriate role
      const newUser = {
        id: userId,
        email: email,
        name: `${clerkUser.firstName || ''} ${clerkUser.lastName || ''}`.trim() || null,
        platform_role: isSuperAdminEmail ? 'super_admin' : 'user',
        is_active: true,
        email_verified: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error: insertError } = await (supabase.from('platform_users') as any).insert([newUser]);
      
      if (insertError) {
        console.error('Error creating user:', insertError);
      }
      return isSuperAdminEmail;
    }

    // If user exists but should be super admin, upgrade
    if (isSuperAdminEmail && user.platform_role !== 'super_admin') {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error: updateError } = await (supabase.from('platform_users') as any)
        .update({ platform_role: 'super_admin', updated_at: new Date().toISOString() })
        .eq('id', userId);
      
      if (updateError) {
        console.error('Error upgrading user:', updateError);
      }
      return true;
    }

    return user.platform_role === 'super_admin';
  } catch (error) {
    console.error('Error in checkAndSetupSuperAdmin:', error);
    return isSuperAdminEmail; // Return based on email even if DB fails
  }
}

export default async function SuperAdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
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
    <div className="flex h-screen bg-gray-100 dark:bg-gray-900">
      {/* Sidebar */}
      <SuperAdminSidebar />

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <SuperAdminHeader />

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
