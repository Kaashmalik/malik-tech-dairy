// Team Management API Routes - Migrated to Supabase
import { NextRequest, NextResponse } from 'next/server';
import { withRole, AuthenticatedRequest } from '@/lib/middleware/roleMiddleware';
import { TenantRole, PlatformRole } from '@/types/roles';
import { getSupabaseClient } from '@/lib/supabase';
import { logger } from '@/lib/logger';
import { v4 as uuidv4 } from 'uuid';
// GET - List all team members
export const GET = withRole(
  [PlatformRole.SUPER_ADMIN, TenantRole.FARM_OWNER, TenantRole.FARM_MANAGER],
  async (req: AuthenticatedRequest) => {
    const tenantId =
      req.user!.tenantId ||
      req.nextUrl.searchParams.get('tenantId') ||
      req.headers.get('x-tenant-id') ||
      '';
    
    if (!tenantId) {
      return NextResponse.json({ error: 'Tenant ID required' }, { status: 400 });
    }

    try {
      const supabase = getSupabaseClient();
      
      // Get tenant members with user details
      const { data: members, error } = await (supabase.from('tenant_members') as any)
        .select(`
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
        `)
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
// POST - Invite new team member
export const POST = withRole(
  [PlatformRole.SUPER_ADMIN, TenantRole.FARM_OWNER, TenantRole.FARM_MANAGER],
  async (req: AuthenticatedRequest) => {
    const tenantId =
      req.user!.tenantId ||
      req.nextUrl.searchParams.get('tenantId') ||
      req.headers.get('x-tenant-id') ||
      '';
    
    if (!tenantId) {
      return NextResponse.json({ error: 'Tenant ID required' }, { status: 400 });
    }

    const { email, role, name } = await req.json();
    if (!email || !role) {
      return NextResponse.json({ error: 'Email and role are required' }, { status: 400 });
    }

    try {
      const supabase = getSupabaseClient();
      const inviteId = uuidv4();
      const now = new Date().toISOString();
      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(); // 7 days

      // Check if user already exists in platform_users
      const { data: existingUser } = await (supabase.from('platform_users') as any)
        .select('id')
        .eq('email', email)
        .single();

      // Check if already a member of this tenant
      if (existingUser) {
        const { data: existingMember } = await (supabase.from('tenant_members') as any)
          .select('id')
          .eq('tenant_id', tenantId)
          .eq('user_id', existingUser.id)
          .single();
        
        if (existingMember) {
          return NextResponse.json({ 
            success: false, 
            error: 'User is already a member of this farm' 
          }, { status: 409 });
        }
      }

      // Create invitation in a dedicated invitations table or use tenant_members with pending status
      const { data: invitation, error } = await (supabase.from('tenant_members') as any)
        .insert({
          id: inviteId,
          tenant_id: tenantId,
          user_id: existingUser?.id || null, // Will be linked when user accepts
          role: role,
          status: 'invited',
          permissions: { invited_email: email, invited_name: name },
          created_at: now,
          updated_at: now,
        })
        .select()
        .single();

      if (error) {
        logger.error('Failed to create invitation', error, { tenantId, email });
        return NextResponse.json({ error: 'Failed to create invitation' }, { status: 500 });
      }

      // TODO: Send invitation email via Resend
      logger.info('Team invitation created', { tenantId, email, role, inviteId });

      return NextResponse.json({
        success: true,
        inviteId,
        message: 'Invitation created successfully. Email notification pending.',
      });
    } catch (error) {
      logger.error('Error creating invitation', error, { tenantId });
      return NextResponse.json({ error: 'Failed to create invitation' }, { status: 500 });
    }
  }
);