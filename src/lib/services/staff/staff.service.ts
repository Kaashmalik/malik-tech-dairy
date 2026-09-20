import { getDrizzle } from '@/lib/supabase/server';
import { tenantMembers, platformUsers } from '@/db/schema';
import { eq, and, sql, desc, count } from 'drizzle-orm';
import { ServiceContext } from '../types';
import { SubscriptionService } from '@/lib/subscriptions/management';
import { TenantRole } from '@/types/roles';
import { logAuditEvent } from '@/lib/audit';

export class StaffService {
  /**
   * List all members for current tenant strictly from server context
   */
  static async listMembers(ctx: ServiceContext) {
    const db = getDrizzle();

    const rows = await db
      .select({
        id: tenantMembers.id,
        tenantId: tenantMembers.tenantId,
        userId: tenantMembers.userId,
        role: tenantMembers.role,
        permissions: tenantMembers.permissions,
        joinDate: tenantMembers.joinDate,
        status: tenantMembers.status,
        createdAt: tenantMembers.createdAt,
        userEmail: platformUsers.email,
        userName: platformUsers.name,
        userAvatar: platformUsers.avatarUrl,
        userPhone: platformUsers.phone,
      })
      .from(tenantMembers)
      .leftJoin(platformUsers, eq(tenantMembers.userId, platformUsers.id))
      .where(eq(tenantMembers.tenantId, ctx.tenantId))
      .orderBy(desc(tenantMembers.createdAt));

    return rows.map(r => ({
      id: r.id,
      tenantId: r.tenantId,
      userId: r.userId,
      email: r.userEmail || '',
      name: r.userName || '',
      phone: r.userPhone || '',
      avatarUrl: r.userAvatar || null,
      role: r.role as TenantRole,
      permissions: r.permissions || [],
      status: r.status || 'active',
      isActive: r.status === 'active',
      joinedAt: r.joinDate,
      createdAt: r.createdAt,
    }));
  }

  /**
   * Invite a new team member with subscription quota check
   */
  static async inviteMember(ctx: ServiceContext, email: string, role: TenantRole) {
    const subscriptionService = new SubscriptionService(ctx.tenantId);
    const allowed = await subscriptionService.checkLimit('users');
    if (!allowed) {
      throw new Error(
        'PLAN_LIMIT_REACHED: You have reached the maximum staff members allowed on your plan. Please upgrade to invite more team members.'
      );
    }

    const db = getDrizzle();

    // Check if user with email exists or create placeholder
    const [existingUser] = await db
      .select({ id: platformUsers.id })
      .from(platformUsers)
      .where(eq(platformUsers.email, email.trim().toLowerCase()))
      .limit(1);

    const userId =
      existingUser?.id || `user_inv_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;

    if (!existingUser) {
      await db
        .insert(platformUsers)
        .values({
          id: userId,
          email: email.trim().toLowerCase(),
          platformRole: 'user',
          isActive: false,
          emailVerified: false,
          createdAt: new Date(),
          updatedAt: new Date(),
        })
        .onConflictDoNothing();
    }

    // Check if already a member of this tenant
    const existingMembership = await db
      .select({ id: tenantMembers.id })
      .from(tenantMembers)
      .where(and(eq(tenantMembers.tenantId, ctx.tenantId), eq(tenantMembers.userId, userId)))
      .limit(1);

    if (existingMembership.length > 0) {
      throw new Error('CONFLICT: This user is already a member of your farm team.');
    }

    const memberId = `tm_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

    const [created] = await db
      .insert(tenantMembers)
      .values({
        id: memberId,
        tenantId: ctx.tenantId,
        userId,
        role,
        permissions: [],
        joinDate: new Date(),
        status: 'active',
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();

    try {
      await logAuditEvent({
        tenantId: ctx.tenantId,
        userId: ctx.userId,
        action: 'create',
        resource: 'tenant_members',
        resourceId: created.id,
        details: { invitedEmail: email, role },
      });
    } catch {
      // Ignore audit failure
    }

    return created;
  }

  /**
   * Update member role
   */
  static async updateMemberRole(ctx: ServiceContext, memberId: string, newRole: TenantRole) {
    const db = getDrizzle();

    const [member] = await db
      .select()
      .from(tenantMembers)
      .where(and(eq(tenantMembers.id, memberId), eq(tenantMembers.tenantId, ctx.tenantId)))
      .limit(1);

    if (!member) {
      throw new Error('NOT_FOUND: Team member not found.');
    }

    const [updated] = await db
      .update(tenantMembers)
      .set({
        role: newRole,
        updatedAt: new Date(),
      })
      .where(and(eq(tenantMembers.id, memberId), eq(tenantMembers.tenantId, ctx.tenantId)))
      .returning();

    try {
      await logAuditEvent({
        tenantId: ctx.tenantId,
        userId: ctx.userId,
        action: 'update',
        resource: 'tenant_members',
        resourceId: memberId,
        details: { newRole, previousRole: member.role },
      });
    } catch {
      // Ignore audit failure
    }

    return updated;
  }
}
