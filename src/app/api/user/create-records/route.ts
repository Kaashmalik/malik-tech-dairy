import { NextRequest, NextResponse } from 'next/server';
import { getDrizzle } from '@/lib/supabase/server';
import { platformUsers, tenantMembers } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { auth } from '@clerk/nextjs/server';
import { mapClerkOrgRole } from '@/lib/tenant/resolve-access';

export async function POST(request: NextRequest) {
  try {
    const { userId, orgId, orgRole } = await auth();
    if (!userId) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }
    if (!orgId) {
      return NextResponse.json(
        { success: false, error: 'No organization (tenant) found. Please complete onboarding.' },
        { status: 403 }
      );
    }

    let body: { tenantId?: string } = {};
    try {
      body = await request.json();
    } catch {
      body = {};
    }

    if (body.tenantId && body.tenantId !== orgId) {
      return NextResponse.json(
        { success: false, error: 'Forbidden: Tenant mismatch' },
        { status: 403 }
      );
    }

    const tenantId = orgId;
    const role = mapClerkOrgRole(orgRole);
    const db = getDrizzle();

    const existingPlatformUser = await db
      .select()
      .from(platformUsers)
      .where(eq(platformUsers.id, userId))
      .limit(1);
    if (existingPlatformUser.length === 0) {
      await db.insert(platformUsers).values({
        id: userId,
        email: 'user@example.com',
        name: 'User',
        platformRole: 'user',
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    }

    const existingMember = await db
      .select()
      .from(tenantMembers)
      .where(and(eq(tenantMembers.userId, userId), eq(tenantMembers.tenantId, tenantId)))
      .limit(1);
    if (existingMember.length === 0) {
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

    const persistedRole = existingMember[0]?.role || role;

    return NextResponse.json({
      success: true,
      message: 'User records created successfully',
      data: {
        userId,
        tenantId,
        role: persistedRole,
        platformUserCreated: existingPlatformUser.length === 0,
        tenantMemberCreated: existingMember.length === 0,
      },
    });
  } catch (error) {
    const err = error as Error;
    console.error('create-records error:', err);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
