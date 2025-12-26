// Update or remove team member - Migrated to Supabase
import { NextResponse } from 'next/server';
import { withRole, AuthenticatedRequest, RouteContext } from '@/lib/middleware/roleMiddleware';
import { TenantRole, PlatformRole } from '@/types/roles';
import { getSupabaseClient } from '@/lib/supabase';
import { logger } from '@/lib/logger';

// PUT - Update member role
export const PUT = withRole(
  [PlatformRole.SUPER_ADMIN, TenantRole.FARM_OWNER, TenantRole.FARM_MANAGER],
  async (req: AuthenticatedRequest, context?: RouteContext) => {
    const tenantId = req.user!.tenantId;
    const { memberId } = (await context?.params) as { memberId: string };
    
    if (!tenantId || !memberId) {
      return NextResponse.json({ error: 'Tenant ID and Member ID required' }, { status: 400 });
    }

    const { role, status, salary, permissions } = await req.json();
    
    try {
      const supabase = getSupabaseClient();
      const now = new Date().toISOString();
      
      // Build update object
      const updateData: Record<string, any> = { updated_at: now };
      if (role) updateData.role = role;
      if (status) updateData.status = status;
      if (salary !== undefined) updateData.salary = salary;
      if (permissions) updateData.permissions = permissions;

      const { data, error } = await (supabase.from('tenant_members') as any)
        .update(updateData)
        .eq('id', memberId)
        .eq('tenant_id', tenantId)
        .select()
        .single();

      if (error) {
        logger.error('Failed to update team member', error, { tenantId, memberId });
        return NextResponse.json({ error: 'Failed to update member' }, { status: 500 });
      }

      logger.info('Team member updated', { tenantId, memberId, role, status });
      return NextResponse.json({ 
        success: true, 
        member: data,
        message: 'Member updated successfully' 
      });
    } catch (error) {
      logger.error('Error updating team member', error, { tenantId, memberId });
      return NextResponse.json({ error: 'Failed to update member' }, { status: 500 });
    }
  }
);

// DELETE - Remove team member
export const DELETE = withRole(
  [PlatformRole.SUPER_ADMIN, TenantRole.FARM_OWNER],
  async (req: AuthenticatedRequest, context?: RouteContext) => {
    const tenantId = req.user!.tenantId;
    const { memberId } = (await context?.params) as { memberId: string };
    
    if (!tenantId || !memberId) {
      return NextResponse.json({ error: 'Tenant ID and Member ID required' }, { status: 400 });
    }

    try {
      const supabase = getSupabaseClient();
      
      // Check if trying to remove owner
      const { data: member, error: fetchError } = await (supabase.from('tenant_members') as any)
        .select('role')
        .eq('id', memberId)
        .eq('tenant_id', tenantId)
        .single();

      if (fetchError || !member) {
        return NextResponse.json({ error: 'Member not found' }, { status: 404 });
      }

      if (member.role === 'farm_owner') {
        return NextResponse.json({ error: 'Cannot remove farm owner' }, { status: 400 });
      }

      // Delete the member
      const { error: deleteError } = await (supabase.from('tenant_members') as any)
        .delete()
        .eq('id', memberId)
        .eq('tenant_id', tenantId);

      if (deleteError) {
        logger.error('Failed to remove team member', deleteError, { tenantId, memberId });
        return NextResponse.json({ error: 'Failed to remove member' }, { status: 500 });
      }

      logger.info('Team member removed', { tenantId, memberId });
      return NextResponse.json({ success: true, message: 'Member removed successfully' });
    } catch (error) {
      logger.error('Error removing team member', error, { tenantId, memberId });
      return NextResponse.json({ error: 'Failed to remove member' }, { status: 500 });
    }
  }
);