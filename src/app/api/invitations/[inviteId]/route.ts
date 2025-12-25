// Accept invitation
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { adminDb } from '@/lib/firebase/admin';
import { TenantRole } from '@/types/roles';
export async function GET(req: NextRequest, { params }: { params: Promise<{ inviteId: string }> }) {
  const { inviteId } = await params;
  if (!adminDb) {
    return NextResponse.json({ error: 'Database not initialized' }, { status: 500 });
  }
  try {
    const inviteDoc = await adminDb.collection('invitations').doc(inviteId).get();
    if (!inviteDoc.exists) {
      return NextResponse.json({ error: 'Invitation not found' }, { status: 404 });
    }
    const inviteData = inviteDoc.data();
    // Check if expired
    if (inviteData?.expiresAt?.toDate() < new Date()) {
      return NextResponse.json({ error: 'Invitation has expired' }, { status: 400 });
    }
    // Check if already accepted
    if (inviteData?.status !== 'pending') {
      return NextResponse.json(
        { error: `Invitation already ${inviteData?.status}` },
        { status: 400 }
      );
    }
    return NextResponse.json({
      invite: {
        id: inviteDoc.id,
        ...inviteData,
      },
    });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch invitation' }, { status: 500 });
  }
}
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ inviteId: string }> }
) {
  const { userId } = await auth();
  const { inviteId } = await params;
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  if (!adminDb) {
    return NextResponse.json({ error: 'Database not initialized' }, { status: 500 });
  }
  try {
    const inviteDoc = await adminDb.collection('invitations').doc(inviteId).get();
    if (!inviteDoc.exists) {
      return NextResponse.json({ error: 'Invitation not found' }, { status: 404 });
    }
    const inviteData = inviteDoc.data();
    const tenantId = inviteData?.tenantId;
    const role = inviteData?.role as TenantRole;
    // Check if expired
    if (inviteData?.expiresAt?.toDate() < new Date()) {
      return NextResponse.json({ error: 'Invitation has expired' }, { status: 400 });
    }
    // Check if already accepted
    if (inviteData?.status !== 'pending') {
      return NextResponse.json(
        { error: `Invitation already ${inviteData?.status}` },
        { status: 400 }
      );
    }
    // Get user email from Clerk (you might need to fetch this differently)
    // For now, we'll use the email from the invitation
    const userEmail = inviteData?.email;
    // Add user to tenant members
    await adminDb.collection('tenants').doc(tenantId).collection('members').doc(userId).set({
      userId,
      email: userEmail,
      role,
      tenantId,
      joinedAt: new Date(),
      invitedBy: inviteData?.invitedBy,
      status: 'active',
    });
    // Update invitation status
    await adminDb.collection('invitations').doc(inviteId).update({
      status: 'accepted',
      acceptedAt: new Date(),
      acceptedBy: userId,
    });
    // Get tenant subdomain for redirect
    const tenantDoc = await adminDb
      .collection('tenants')
      .doc(tenantId)
      .collection('config')
      .doc('main')
      .get();
    const tenantConfig = tenantDoc.data();
    const subdomain = tenantConfig?.subdomain || tenantId;
    return NextResponse.json({
      success: true,
      tenantId,
      subdomain,
      message: 'Invitation accepted successfully',
    });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to accept invitation' }, { status: 500 });
  }
}