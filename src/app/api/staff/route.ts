// Team Management API Routes - Migrated to Supabase
import { NextRequest, NextResponse } from 'next/server';
import { withRole, AuthenticatedRequest } from '@/lib/middleware/roleMiddleware';
import { TenantRole, PlatformRole } from '@/types/roles';
import { clerkClient } from '@clerk/nextjs/server';
import { getSupabaseClient } from '@/lib/supabase/server';
import { tenantDb } from '@/lib/supabase/tenant-db';
import { SubscriptionService } from '@/lib/subscriptions/management';
import { logger } from '@/lib/logger';

// Owners are created by provisioning only; everyone else can be invited
const INVITABLE_ROLES: string[] = Object.values(TenantRole).filter(
  r => r !== TenantRole.FARM_OWNER && r !== TenantRole.GUEST
);
// GET - List all team members
export async function GET(request: NextRequest) {
  const handler = withRole(
    [PlatformRole.SUPER_ADMIN, TenantRole.FARM_OWNER, TenantRole.FARM_MANAGER],
    async (req: AuthenticatedRequest) => {
      const tenantId = req.user?.tenantId;

      if (!tenantId) {
        return NextResponse.json({ error: 'Tenant ID required or unauthorized' }, { status: 401 });
      }

      try {
        const supabase = getSupabaseClient();

        // Get tenant members with user details
        const { data: members, error } = await (supabase.from('tenant_members') as any)
          .select(
            `
          id,
          user_id,
          role,
          status,
          join_date,
          salary,
          permissions,
          created_at,
          updated_at,
          platform_users!inner (
            id,
            email,
            name,
            avatar_url,
            phone
          )
        `
          )
          .eq('tenant_id', tenantId)
          .order('created_at', { ascending: false });

        if (error) {
          logger.error('Failed to fetch team members', error, { tenantId });
          return NextResponse.json({ error: 'Failed to fetch members' }, { status: 500 });
        }

        // Transform to expected format
        const transformedMembers = (members || []).map((m: any) => ({
          id: m.id,
          userId: m.user_id,
          email: m.platform_users?.email,
          name: m.platform_users?.name,
          avatarUrl: m.platform_users?.avatar_url,
          phone: m.platform_users?.phone,
          role: m.role,
          status: m.status || 'active',
          joinDate: m.join_date,
          salary: m.salary,
          permissions: m.permissions,
          createdAt: m.created_at,
          updatedAt: m.updated_at,
        }));

        return NextResponse.json({ success: true, members: transformedMembers });
      } catch (error) {
        logger.error('Error fetching team members', error, { tenantId });
        return NextResponse.json({ error: 'Failed to fetch members' }, { status: 500 });
      }
    }
  );
  return handler(request);
}
// POST - Invite new team member
export async function POST(request: NextRequest) {
  const handler = withRole(
    [PlatformRole.SUPER_ADMIN, TenantRole.FARM_OWNER, TenantRole.FARM_MANAGER],
    async (req: AuthenticatedRequest) => {
      const tenantId = req.user?.tenantId;

      if (!tenantId) {
        return NextResponse.json({ error: 'Tenant ID required or unauthorized' }, { status: 401 });
      }

      const { email, role } = await req.json();
      if (!email || !role) {
        return NextResponse.json({ error: 'Email and role are required' }, { status: 400 });
      }
      const normalizedEmail = String(email).trim().toLowerCase();
      if (!INVITABLE_ROLES.includes(role)) {
        return NextResponse.json({ error: 'Invalid role' }, { status: 400 });
      }

      try {
        // Seat limit: active members + pending invites must fit the plan
        const clerk = await clerkClient();
        const pending = await clerk.organizations.getOrganizationInvitationList({
          organizationId: tenantId,
          status: ['pending'],
        });
        const { count: activeMembers, error: countError } = await tenantDb(tenantId)
          .select('tenant_members', 'id', { count: 'exact', head: true })
          .eq('status', 'active');
        if (countError) throw new Error(`Count members: ${countError.message}`);
        const seatsUsed = (activeMembers || 0) + pending.data.length;
        const allowed = await new SubscriptionService(tenantId).checkLimit('users', seatsUsed);
        if (!allowed) {
          return NextResponse.json(
            {
              error:
                'PLAN_LIMIT_REACHED: Your plan has no free team seats. Upgrade to invite more members.',
            },
            { status: 403 }
          );
        }

        // Clerk sends the email and handles sign-up/sign-in from the link; on
        // acceptance the organizationMembership.created webhook adds tenant_members
        // with the role carried in publicMetadata.
        const invitation = await clerk.organizations.createOrganizationInvitation({
          organizationId: tenantId,
          inviterUserId: req.user!.id,
          emailAddress: normalizedEmail,
          role: 'org:member',
          redirectUrl: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/sign-up`,
          publicMetadata: { tenantRole: role },
        });

        logger.info('Team invitation created', { tenantId, role, invitationId: invitation.id });
        return NextResponse.json({
          success: true,
          inviteId: invitation.id,
          message: `Invitation emailed to ${normalizedEmail}.`,
        });
      } catch (error) {
        const clerkErrors = (error as { errors?: Array<{ code?: string; message?: string }> })
          .errors;
        if (
          clerkErrors?.some(e => e.code === 'duplicate_record' || /already/i.test(e.message || ''))
        ) {
          return NextResponse.json(
            { success: false, error: 'This person is already a member or has a pending invite.' },
            { status: 409 }
          );
        }
        logger.error('Error creating invitation', error, { tenantId });
        return NextResponse.json({ error: 'Failed to create invitation' }, { status: 500 });
      }
    }
  );
  return handler(request);
}
