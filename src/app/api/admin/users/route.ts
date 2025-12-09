// Admin API - List all users
import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';

export async function GET() {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { getSupabaseClient } = await import('@/lib/supabase');
    const supabase = getSupabaseClient();

    const { data: users, error } = await supabase
      .from('platform_users')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching users:', error);
      return NextResponse.json({ success: false, error: 'Failed to fetch users' }, { status: 500 });
    }

    // Get farm counts per user
    const usersWithStats = await Promise.all(
      (users || []).map(async (user: Record<string, unknown>) => {
        const { count: farmCount } = await supabase
          .from('tenant_members')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user.id);

        return {
          id: user.id,
          name: user.name || 'Unknown',
          email: user.email,
          avatarUrl: user.avatar_url,
          platformRole: user.platform_role,
          isActive: user.is_active,
          emailVerified: user.email_verified,
          farmCount: farmCount || 0,
          lastLoginAt: user.last_login_at,
          createdAt: user.created_at,
        };
      })
    );

    return NextResponse.json({ success: true, data: usersWithStats });
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json({ success: false, error: 'Server error' }, { status: 500 });
  }
}
