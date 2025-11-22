"use client";

import { usePermissions } from "@/hooks/usePermissions";
import { UserRole } from "@/types/roles";

interface RoleGuardProps {
  children: React.ReactNode;
  roles?: UserRole[];
  permission?: { resource: string; action: string };
  fallback?: React.ReactNode;
}

export function RoleGuard({
  children,
  roles,
  permission,
  fallback = null,
}: RoleGuardProps) {
  const { hasRole, hasPermission, loading } = usePermissions();

  if (loading) return null;

  // Check role-based access
  if (roles && !hasRole(...roles)) {
    return <>{fallback}</>;
  }

  // Check permission-based access
  if (permission && !hasPermission(permission.resource, permission.action)) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}

