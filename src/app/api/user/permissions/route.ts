import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/lib/supabase';
import { auth } from '@clerk/nextjs/server';
export async function GET(request: NextRequest) {
  try {
    // Authenticate the user with Clerk
    let authUserId: string | null;
    try {
      const authResult = await auth();
      authUserId = authResult.userId;
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
      }
      authUserId = null;
    }
    // Development bypass - allow requests with userId from query params
    if (!authUserId && process.env.NODE_ENV === 'development') {
      const { searchParams } = new URL(request.url);
      authUserId = searchParams.get('userId');
    }
    if (!authUserId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    // Get tenant ID from query params (but use authenticated user ID)
    const { searchParams } = new URL(request.url);
    const tenantId = searchParams.get('tenantId');
    if (!tenantId) {
      return NextResponse.json({ error: 'Missing tenantId' }, { status: 400 });
    }
    // Use authenticated user ID instead of passed userId for security
    const userId = authUserId;
    const supabase = getSupabaseClient();
    // Check if super admin first from platform_users table
    const { data: platformUser, error: platformError } = await supabase
      .from('platform_users')
      .select('platform_role')
      .eq('id', userId)
      .single() as { data: { platform_role: string } | null; error: unknown };
    if (!platformError && platformUser?.platform_role === 'super_admin') {
      return NextResponse.json({
        userRole: 'super_admin',
        isSuperAdmin: true,
        loading: false,
      });
    }
    // Get tenant-specific role from tenant_members table
    const { data: member, error: memberError } = await supabase
      .from('tenant_members')
      .select('role')
      .eq('user_id', userId)
      .eq('tenant_id', tenantId)
      .single() as { data: { role: string } | null; error: unknown };
    if (!memberError && member) {
      return NextResponse.json({
        userRole: member.role,
        isSuperAdmin: false,
        loading: false,
      });
    }
    // No role found - return null (user might be new or not a member)
    return NextResponse.json({
      userRole: null,
      isSuperAdmin: false,
      loading: false,
    });
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}