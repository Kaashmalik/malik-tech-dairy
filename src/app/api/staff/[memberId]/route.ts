// Update or remove team member
import { NextRequest, NextResponse } from 'next/server';
import { clerkClient } from '@clerk/nextjs/server';
import { withRole, AuthenticatedRequest, RouteContext } from '@/lib/middleware/roleMiddleware';
import { TenantRole, PlatformRole } from '@/types/roles';
import { tenantDb, unwrap } from '@/lib/supabase/tenant-db';
import { logger } from '@/lib/logger';

// Ownership is never assigned through this API; farm_owner/super_admin are excluded
const ASSIGNABLE_ROLES: string[] = Object.values(TenantRole).filter(
  r => r !== TenantRole.FARM_OWNER && r !== TenantRole.GUEST
);
const MEMBER_STATUSES = ['active', 'inactive'];

interface MemberRow {
  id: string;
  user_id: string;
  role: string;
}

async function loadMember(tenantId: string, memberId: string) {
  return unwrap(
    await tenantDb(tenantId)
      .select('tenant_members', 'id, user_id, role')
      .eq('id', memberId)
      .maybeSingle(),
    'Load member'
  ) as MemberRow | null;
}

// PUT - Update member role
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ memberId: string }> }
) {
  const routeHandler = withRole(
    [PlatformRole.SUPER_ADMIN, TenantRole.FARM_OWNER, TenantRole.FARM_MANAGER],
    async (req: AuthenticatedRequest, context?: RouteContext) => {
      const { tenantId, id: actorId, role: actorRole } = req.user!;
      const { memberId } = (await context!.params) as { memberId: string };

      const { role, status, salary, permissions } = await req.json();
      if (role !== undefined && !ASSIGNABLE_ROLES.includes(role)) {
        return NextResponse.json({ error: 'Invalid role' }, { status: 400 });
      }
      if (status !== undefined && !MEMBER_STATUSES.includes(status)) {
        return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
      }

      try {
        const member = await loadMember(tenantId, memberId);
        if (!member) {
          return NextResponse.json({ error: 'Member not found' }, { status: 404 });
        }
        if (member.role === TenantRole.FARM_OWNER) {
          return NextResponse.json({ error: 'The farm owner cannot be changed' }, { status: 403 });
        }
        // Managers cannot change their own role or create peers/superiors
        if (
          actorRole === TenantRole.FARM_MANAGER &&
          (member.user_id === actorId || role === TenantRole.FARM_MANAGER)
        ) {
          return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
        }

        const updateData: Record<string, unknown> = { updated_at: new Date().toISOString() };
        if (role) updateData.role = role;
        if (status) updateData.status = status;
        if (salary !== undefined) updateData.salary = salary;
        if (permissions) updateData.permissions = permissions;

        const data = unwrap(
          await tenantDb(tenantId)
            .update('tenant_members', updateData)
            .eq('id', memberId)
            .select()
            .single(),
          'Update member'
        );

        logger.info('Team member updated', { tenantId, memberId, role, status });
        return NextResponse.json({
          success: true,
          member: data,
          message: 'Member updated successfully',
        });
      } catch (error) {
        logger.error('Error updating team member', error, { tenantId, memberId });
        return NextResponse.json({ error: 'Failed to update member' }, { status: 500 });
      }
    }
  );
  return routeHandler(request, { params });
}

// DELETE - Remove team member
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ memberId: string }> }
) {
  const routeHandler = withRole(
    [PlatformRole.SUPER_ADMIN, TenantRole.FARM_OWNER],
    async (req: AuthenticatedRequest, context?: RouteContext) => {
      const tenantId = req.user!.tenantId;
      const { memberId } = (await context!.params) as { memberId: string };

      try {
        const member = await loadMember(tenantId, memberId);
        if (!member) {
          return NextResponse.json({ error: 'Member not found' }, { status: 404 });
        }
        if (member.role === TenantRole.FARM_OWNER) {
          return NextResponse.json({ error: 'Cannot remove farm owner' }, { status: 400 });
        }

        // Revoke the Clerk membership first: otherwise the session keeps the org and
        // tenant resolution falls back to the Clerk role (org:member -> farm_manager).
        try {
          const clerk = await clerkClient();
          await clerk.organizations.deleteOrganizationMembership({
            organizationId: tenantId,
            userId: member.user_id,
          });
        } catch (error) {
          const status = (error as { status?: number }).status;
          if (status !== 404) throw error; // already gone in Clerk
        }

        unwrap(
          await tenantDb(tenantId).delete('tenant_members').eq('id', memberId),
          'Remove member'
        );

        logger.info('Team member removed', { tenantId, memberId });
        return NextResponse.json({ success: true, message: 'Member removed successfully' });
      } catch (error) {
        logger.error('Error removing team member', error, { tenantId, memberId });
        return NextResponse.json({ error: 'Failed to remove member' }, { status: 500 });
      }
    }
  );
  return routeHandler(request, { params });
}
