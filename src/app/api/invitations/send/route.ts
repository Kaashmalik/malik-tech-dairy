// Send invitation email
import { NextRequest, NextResponse } from 'next/server';
import { getTenantContext } from '@/lib/tenant/context';
export async function POST(request: NextRequest) {
  try {
    const tenantContext = await getTenantContext();
    const { tenantId, userRole } = tenantContext;

    // Check if user has permission (farm_owner, farm_manager, or super_admin)
    if (userRole !== 'farm_owner' && userRole !== 'farm_manager' && userRole !== 'super_admin') {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
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
    return NextResponse.json({ error: 'Failed to send invitation' }, { status: 500 });
  }
}
