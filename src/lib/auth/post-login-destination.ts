/**
 * Deterministic post-auth destination for the SaaS user flow.
 * Order: platform admin → active farm → pick farm → application status → apply.
 */

export interface PostLoginApplication {
  id: string;
  status: string;
}

export interface PostLoginContext {
  isSuperAdmin: boolean;
  hasActiveOrg: boolean;
  hasMemberships: boolean;
  latestApplication?: PostLoginApplication | null;
}

export function getPostLoginPath(ctx: PostLoginContext): string {
  if (ctx.isSuperAdmin) {
    return '/super-admin';
  }

  if (ctx.hasActiveOrg) {
    return '/dashboard';
  }

  if (ctx.hasMemberships) {
    return '/select-farm';
  }

  const application = ctx.latestApplication;
  if (application) {
    if (application.status === 'approved') {
      return '/select-farm';
    }
    return `/apply/status?id=${encodeURIComponent(application.id)}`;
  }

  return '/apply';
}

/** Where to send authenticated users who hit a tenant-scoped page without an active org. */
export function getNoOrgFallbackPath(): string {
  return '/select-farm';
}
