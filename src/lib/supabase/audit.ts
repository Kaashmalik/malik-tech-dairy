// Audit Logging to Supabase
import { getDrizzle } from './server';
import { auditLogs } from '@/db/schema';
import { nanoid } from 'nanoid';
export interface AuditLogData {
  tenantId?: string;
  userId: string;
  action: 'create' | 'update' | 'delete' | 'read' | 'login' | 'logout';
  resource: string;
  resourceId?: string;
  details?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
}
/**
 * Create an audit log entry
 */
export async function createAuditLog(data: AuditLogData): Promise<void> {
  try {
    const db = getDrizzle();
    await db.insert(auditLogs).values({
      id: nanoid(),
      tenantId: data.tenantId || null,
      userId: data.userId,
      action: data.action,
      resource: data.resource,
      resourceId: data.resourceId || null,
      details: data.details || {},
      ipAddress: data.ipAddress || null,
      userAgent: data.userAgent || null,
      createdAt: new Date(),
    });
  } catch (error) {
    // Fail silently - audit logging should not break the application
  }
}
/**
 * Get audit logs for a tenant
 */
export async function getAuditLogs(
  tenantId: string,
  options?: {
    limit?: number;
    offset?: number;
    resource?: string;
    userId?: string;
  }
) {
  const db = getDrizzle();
  const { and, eq, desc } = await import('drizzle-orm');

  // Build conditions array
  const conditions = [eq(auditLogs.tenantId, tenantId)];

  if (options?.resource) {
    conditions.push(eq(auditLogs.resource, options.resource));
  }

  if (options?.userId) {
    conditions.push(eq(auditLogs.userId, options.userId));
  }

  const query = db
    .select()
    .from(auditLogs)
    .where(and(...conditions))
    .orderBy(desc(auditLogs.createdAt))
    .limit(options?.limit || 100)
    .offset(options?.offset || 0);
  return query;
}
