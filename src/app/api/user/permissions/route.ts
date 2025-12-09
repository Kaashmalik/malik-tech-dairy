import { NextRequest, NextResponse } from 'next/server';
import { getDrizzle } from '@/lib/supabase';
import { platformUsers, tenantMembers } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { auth } from '@clerk/nextjs/server';

export async function GET(request: NextRequest) {
  try {
    // Authenticate the user with Clerk
    let authUserId: string | null;

    try {
      const authResult = auth();
      authUserId = authResult.userId;
    } catch (error) {
      console.log('Clerk auth error:', error);
      authUserId = null;
    }

    // Development bypass - allow requests with userId from query params
    if (!authUserId && process.env.NODE_ENV === 'development') {
      const { searchParams } = new URL(request.url);
      authUserId = searchParams.get('userId');
      console.log('Development mode: using userId from query params:', authUserId);
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

    console.log('Fetching permissions from server...', { userId, tenantId });
    const db = getDrizzle();

    // Check if super admin first from platform_users table
    const platformUserResult = await db
      .select()
      .from(platformUsers)
      .where(eq(platformUsers.id, userId))
      .limit(1);

    console.log('Platform user result:', platformUserResult);

    if (platformUserResult.length > 0) {
      const platformUser = platformUserResult[0];
      console.log('Platform user found:', platformUser);

      // Check for platform-level super admin
      if (platformUser.platformRole === 'super_admin') {
        console.log('User is super admin');
        return NextResponse.json({
          userRole: 'super_admin',
          isSuperAdmin: true,
          loading: false,
        });
      }
    }

    // Get tenant-specific role from tenant_members table
    const memberResult = await db
      .select()
      .from(tenantMembers)
      .where(and(eq(tenantMembers.userId, userId), eq(tenantMembers.tenantId, tenantId)))
      .limit(1);

    console.log('Tenant member result:', memberResult);

    if (memberResult.length > 0) {
      const member = memberResult[0];
      console.log('Tenant member found:', member);
      return NextResponse.json({
        userRole: member.role,
        isSuperAdmin: false,
        loading: false,
      });
    } else {
      console.log('No tenant member found for user');
      return NextResponse.json({
        userRole: null,
        isSuperAdmin: false,
        loading: false,
      });
    }
  } catch (error) {
    console.error('Error fetching permissions from server:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
