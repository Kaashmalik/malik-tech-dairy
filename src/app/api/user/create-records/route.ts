import { NextRequest, NextResponse } from 'next/server';
import { getDrizzle } from '@/lib/supabase/server';
import { platformUsers, tenantMembers } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { auth } from '@clerk/nextjs/server';
import { TenantRole } from '@/types/roles';
export async function POST(request: NextRequest) {
  try {
    // Authenticate the user with Clerk
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const { tenantId, role = TenantRole.FARM_OWNER } = await request.json();
    if (!tenantId) {
      return NextResponse.json({ error: 'Missing tenantId' }, { status: 400 });
    }
    const db = getDrizzle();
    // Check if user already exists in platform_users
    const existingPlatformUser = await db
      .select()
      .from(platformUsers)
      .where(eq(platformUsers.id, userId))
      .limit(1);
    if (existingPlatformUser.length === 0) {
      // Create platform user record
      await db.insert(platformUsers).values({
        id: userId,
        email: 'user@example.com', // Will be updated by Clerk webhook
        name: 'User',
        platformRole: 'user', // Default platform role
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    }
    // Check if user already exists in tenant_members
    const existingMember = await db
      .select()
      .from(tenantMembers)
      .where(and(eq(tenantMembers.userId, userId), eq(tenantMembers.tenantId, tenantId)))
      .limit(1);
    if (existingMember.length === 0) {
      // Create tenant member record
      await db.insert(tenantMembers).values({
        id: `${tenantId}_${userId}`,
        tenantId,
        userId,
        role,
        status: 'active',
        joinDate: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    }
    return NextResponse.json({
      success: true,
      message: 'User records created successfully',
      data: {
        userId,
        tenantId,
        role,
        platformUserCreated: existingPlatformUser.length === 0,
        tenantMemberCreated: existingMember.length === 0,
      },
    });
  } catch (error) {
    const err = error as Error;
    return NextResponse.json(
      { error: 'Internal server error', details: err.message },
      { status: 500 }
    );
  }
}
