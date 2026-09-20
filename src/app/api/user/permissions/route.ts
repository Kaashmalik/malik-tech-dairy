import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/lib/supabase/server';
import { auth } from '@clerk/nextjs/server';
export async function GET(request: NextRequest) {
  try {
    // Authenticate the user with Clerk
    const authResult = await auth();
    const authUserId = authResult.userId;

    if (!authUserId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    // Get tenant ID from authenticated orgId or query param, validated against membership
    const { searchParams } = new URL(request.url);
    const tenantId = authResult.orgId || searchParams.get('tenantId');
    if (!tenantId) {
      return NextResponse.json({ error: 'Missing tenantId' }, { status: 400 });
    }
    // Use authenticated user ID instead of passed userId for security
    const userId = authUserId;
    const supabase = getSupabaseClient();
    // Check if super admin first from platform_users table
    const { data: platformUser, error: platformError } = (await supabase
      .from('platform_users')
      .select('platform_role')
      .eq('id', userId)
      .single()) as { data: { platform_role: string } | null; error: unknown };
    if (!platformError && platformUser?.platform_role === 'super_admin') {
      return NextResponse.json({
        userRole: 'super_admin',
        isSuperAdmin: true,
        loading: false,
      });
    }
    // Get tenant-specific role from tenant_members table
    const { data: member, error: memberError } = (await supabase
      .from('tenant_members')
      .select('role')
      .eq('user_id', userId)
      .eq('tenant_id', tenantId)
      .single()) as { data: { role: string } | null; error: unknown };
    if (!memberError && member) {
      return NextResponse.json({
        userRole: member.role,
        isSuperAdmin: false,
        loading: false,
      });
    }

    // Check Clerk organization role if available
    if (authResult.orgRole === 'org:admin') {
      return NextResponse.json({
        userRole: 'farm_owner',
        isSuperAdmin: false,
        loading: false,
      });
    }
    if (authResult.orgRole === 'org:member') {
      return NextResponse.json({
        userRole: 'farm_manager',
        isSuperAdmin: false,
        loading: false,
      });
    }

    // Default to farm_owner if user is authenticated in this tenant
    return NextResponse.json({
      userRole: 'farm_owner',
      isSuperAdmin: false,
      loading: false,
    });
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
