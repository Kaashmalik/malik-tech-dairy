// Role-based API Middleware
// Tenant and role come from the Clerk session via getTenantContext() (Supabase
// membership + resolveTenantAccess). Never from query params or client headers.
import { auth } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';
import { getTenantContext, TenantAccessError } from '@/lib/tenant/context';
import { logger } from '@/lib/logger';
import { TenantRole, UserRole, PlatformRole, ROLE_PERMISSIONS } from '@/types/roles';

export interface AuthenticatedRequest extends NextRequest {
  user?: {
    id: string;
    role: UserRole;
    tenantId: string;
  };
}
// Context type for Next.js 15 route handlers
export interface RouteContext {
  params: Promise<Record<string, string>>;
}

type Handler = (req: AuthenticatedRequest, context?: RouteContext) => Promise<Response>;

export function withAuth(handler: Handler) {
  return async (req: NextRequest, context?: RouteContext) => {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    // Attach user info to request
    (req as AuthenticatedRequest).user = {
      id: userId,
      role: TenantRole.GUEST as UserRole,
      tenantId: '',
    };
    return handler(req as AuthenticatedRequest, context);
  };
}

/** Resolve the caller's tenant + role, then let `allow(role)` decide. */
function withTenantRole(
  allow: (role: UserRole) => boolean,
  deniedBody: (role: UserRole) => Record<string, unknown>,
  handler: Handler
) {
  return withAuth(async (req: AuthenticatedRequest, context?: RouteContext) => {
    let ctx;
    try {
      ctx = await getTenantContext();
    } catch (error) {
      if (error instanceof TenantAccessError) {
        return NextResponse.json({ error: error.message }, { status: error.status });
      }
      logger.error('Role middleware: tenant resolution failed', error);
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }

    const role = ctx.userRole as UserRole;
    if (role !== PlatformRole.SUPER_ADMIN && !allow(role)) {
      return NextResponse.json(
        { error: 'Insufficient permissions', ...deniedBody(role) },
        {
          status: 403,
        }
      );
    }

    req.user = { id: ctx.userId, role, tenantId: ctx.tenantId };
    return handler(req, context);
  });
}

export function withRole(requiredRoles: UserRole[], handler: Handler) {
  return withTenantRole(
    role => requiredRoles.includes(role),
    role => ({ required: requiredRoles, current: role }),
    handler
  );
}

export function withPermission(
  resource: string,
  action: 'create' | 'read' | 'update' | 'delete',
  handler: Handler
) {
  return withTenantRole(
    role =>
      Boolean(
        ROLE_PERMISSIONS[role as TenantRole]?.some(
          p => p.resource === resource && p.actions.includes(action)
        )
      ),
    role => ({ required: { resource, action }, role }),
    handler
  );
}
