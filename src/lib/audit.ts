/**
 * Audit Logging System
 * Logs all sensitive operations for security and compliance
 */

import { getSupabaseClient } from '@/lib/supabase/server';

export interface AuditEventParams {
  tenantId: string;
  userId: string;
  action: 'create' | 'update' | 'delete' | 'read' | 'login' | 'logout' | 'export' | 'import';
  resource: string;
  resourceId?: string;
  details?: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
}

/**
 * Log an audit event to the database
 */
export async function logAuditEvent(params: AuditEventParams): Promise<void> {
  try {
    const supabase = getSupabaseClient();

    await supabase.from('audit_logs').insert({
      tenant_id: params.tenantId,
      user_id: params.userId,
      action: params.action,
      resource: params.resource,
      resource_id: params.resourceId || null,
      details: params.details || null,
      ip_address: params.ipAddress || null,
      user_agent: params.userAgent || null,
      created_at: new Date().toISOString(),
    });
  } catch (error) {
    // Log to console if database insert fails
    console.error('Failed to log audit event:', error);
    console.error('Audit event details:', params);
  }
}

/**
 * Log user login
 */
export async function logUserLogin(params: {
  userId: string;
  tenantId?: string;
  ipAddress?: string;
  userAgent?: string;
}): Promise<void> {
  await logAuditEvent({
    tenantId: params.tenantId || 'system',
    userId: params.userId,
    action: 'login',
    resource: 'user',
    resourceId: params.userId,
    details: { timestamp: new Date().toISOString() },
    ipAddress: params.ipAddress,
    userAgent: params.userAgent,
  });
}

/**
 * Log user logout
 */
export async function logUserLogout(params: {
  userId: string;
  tenantId?: string;
  ipAddress?: string;
  userAgent?: string;
}): Promise<void> {
  await logAuditEvent({
    tenantId: params.tenantId || 'system',
    userId: params.userId,
    action: 'logout',
    resource: 'user',
    resourceId: params.userId,
    details: { timestamp: new Date().toISOString() },
    ipAddress: params.ipAddress,
    userAgent: params.userAgent,
  });
}

/**
 * Log data creation
 */
export async function logCreate(params: {
  tenantId: string;
  userId: string;
  resource: string;
  resourceId: string;
  details?: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
}): Promise<void> {
  await logAuditEvent({
    tenantId: params.tenantId,
    userId: params.userId,
    action: 'create',
    resource: params.resource,
    resourceId: params.resourceId,
    details: params.details,
    ipAddress: params.ipAddress,
    userAgent: params.userAgent,
  });
}

/**
 * Log data update
 */
export async function logUpdate(params: {
  tenantId: string;
  userId: string;
  resource: string;
  resourceId: string;
  changes?: Record<string, { from: unknown; to: unknown }>;
  details?: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
}): Promise<void> {
  await logAuditEvent({
    tenantId: params.tenantId,
    userId: params.userId,
    action: 'update',
    resource: params.resource,
    resourceId: params.resourceId,
    details: {
      ...params.details,
      changes: params.changes,
    },
    ipAddress: params.ipAddress,
    userAgent: params.userAgent,
  });
}

/**
 * Log data deletion
 */
export async function logDelete(params: {
  tenantId: string;
  userId: string;
  resource: string;
  resourceId: string;
  details?: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
}): Promise<void> {
  await logAuditEvent({
    tenantId: params.tenantId,
    userId: params.userId,
    action: 'delete',
    resource: params.resource,
    resourceId: params.resourceId,
    details: params.details,
    ipAddress: params.ipAddress,
    userAgent: params.userAgent,
  });
}

/**
 * Log data export
 */
export async function logExport(params: {
  tenantId: string;
  userId: string;
  resource: string;
  details?: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
}): Promise<void> {
  await logAuditEvent({
    tenantId: params.tenantId,
    userId: params.userId,
    action: 'export',
    resource: params.resource,
    details: params.details,
    ipAddress: params.ipAddress,
    userAgent: params.userAgent,
  });
}

/**
 * Get client IP from request headers
 */
export function getClientIp(request: Request): string {
  const headers = request.headers;
  const forwarded = headers.get('x-forwarded-for');
  const realIp = headers.get('x-real-ip');

  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }

  if (realIp) {
    return realIp;
  }

  return 'unknown';
}

/**
 * Get user agent from request headers
 */
export function getUserAgent(request: Request): string {
  return request.headers.get('user-agent') || 'unknown';
}

/**
 * Get audit logs for a tenant
 */
export async function getAuditLogs(params: {
  tenantId: string;
  limit?: number;
  offset?: number;
  userId?: string;
  resource?: string;
  action?: string;
  startDate?: Date;
  endDate?: Date;
}): Promise<{ logs: unknown[]; total: number }> {
  const supabase = getSupabaseClient();

  let query = supabase
    .from('audit_logs')
    .select('*', { count: 'exact' })
    .eq('tenant_id', params.tenantId)
    .order('created_at', { ascending: false });

  if (params.userId) {
    query = query.eq('user_id', params.userId);
  }

  if (params.resource) {
    query = query.eq('resource', params.resource);
  }

  if (params.action) {
    query = query.eq('action', params.action);
  }

  if (params.startDate) {
    query = query.gte('created_at', params.startDate.toISOString());
  }

  if (params.endDate) {
    query = query.lte('created_at', params.endDate.toISOString());
  }

  const limit = params.limit || 50;
  const offset = params.offset || 0;

  query = query.range(offset, offset + limit - 1);

  const { data, count, error } = await query;

  if (error) {
    throw new Error('Failed to fetch audit logs');
  }

  return {
    logs: data || [],
    total: count || 0,
  };
}
