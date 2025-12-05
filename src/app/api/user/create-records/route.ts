import { NextRequest, NextResponse } from 'next/server';
import { getDrizzle } from '@/lib/supabase';
import { platformUsers, tenantMembers } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { auth } from '@clerk/nextjs/server';
import { TenantRole } from '@/types/roles';

export async function POST(request: NextRequest) {
  try {
    // Authenticate the user with Clerk
    const { userId } = auth();
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { tenantId, role = TenantRole.FARM_OWNER } = await request.json();

    if (!tenantId) {
      return NextResponse.json(
        { error: 'Missing tenantId' },
        { status: 400 }
      );
    }

    console.log('Creating user records...', { userId, tenantId, role });
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
        firstName: 'User',
        lastName: 'Name',
        platformRole: 'user', // Default platform role
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      console.log('Created platform user record');
    }

    // Check if user already exists in tenant_members
    const existingMember = await db
      .select()
      .from(tenantMembers)
      .where(eq(tenantMembers.userId, userId))
      .where(eq(tenantMembers.tenantId, tenantId))
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
      console.log('Created tenant member record');
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
    console.error('Error creating user records:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}
