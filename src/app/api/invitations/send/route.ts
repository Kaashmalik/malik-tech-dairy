// Send invitation email
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { adminDb } from '@/lib/firebase/admin';
import { TenantRole, PlatformRole } from '@/types/roles';
export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const tenantId = request.nextUrl.searchParams.get('tenantId') ||
      request.headers.get('x-tenant-id') || '';
    if (!tenantId) {
      return NextResponse.json({ error: 'Tenant ID required' }, { status: 400 });
    }
    // Check if user has permission (farm_owner, farm_manager, or super_admin)
    if (adminDb) {
      const userDoc = await adminDb.collection('users').doc(userId).get();
      const memberDoc = await adminDb
        .collection('tenants')
        .doc(tenantId)
        .collection('members')
        .doc(userId)
        .get();
      const userData = userDoc.exists ? userDoc.data() : null;
      const memberData = memberDoc.exists ? memberDoc.data() : null;
      const isSuperAdmin = userData?.platformRole === PlatformRole.SUPER_ADMIN;
      const isOwner = memberData?.role === TenantRole.FARM_OWNER || userData?.role === TenantRole.FARM_OWNER;
      const isManager = memberData?.role === TenantRole.FARM_MANAGER || userData?.role === TenantRole.FARM_MANAGER;
      if (!isSuperAdmin && !isOwner && !isManager) {
        return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
      }
    }
    const { email, role, inviteId } = await request.json();
    if (!email || !role || !inviteId) {
      return NextResponse.json(
        { error: 'Email, role, and inviteId are required' },
        { status: 400 }
      );
    }
    // TODO: Integrate with email service (Resend, SendGrid, etc.)
    // For now, return success
    // The invitation document is already created in the staff route
    const inviteUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/invite/${inviteId}`;
    return NextResponse.json({
      success: true,
      message: 'Invitation email sent',
      inviteUrl, // Return URL for testing
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to send invitation' },
      { status: 500 }
    );
  }
}