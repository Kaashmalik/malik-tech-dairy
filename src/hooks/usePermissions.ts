'use client';

import { useTenantContext } from '@/components/tenant/TenantProvider';
import { useUser } from '@clerk/nextjs';
import { useEffect, useState } from 'react';
import { ROLE_PERMISSIONS, TenantRole, UserRole, PlatformRole, MODULE_ACCESS } from '@/types/roles';

export function usePermissions() {
  const { user } = useUser();
  const { tenantId } = useTenantContext();
  const [userRole, setUserRole] = useState<UserRole | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchUserRole() {
      if (!user?.id || !tenantId) {
        console.log('Missing user or tenantId', { userId: user?.id, tenantId });
        setLoading(false);
        return;
      }

      try {
        console.log('Fetching user role from server API...', { userId: user?.id, tenantId });

        // Fetch permissions from server-side API
        const response = await fetch(
          `/api/user/permissions?userId=${user.id}&tenantId=${tenantId}`
        );

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        console.log('Permissions API response:', data);

        setUserRole(data.userRole);
      } catch (error) {
        console.error('Error fetching user role from API:', error);
        setUserRole(null);
      } finally {
        setLoading(false);
      }
    }

    fetchUserRole();
  }, [user?.id, tenantId]);

  const hasPermission = (resource: string, action: string): boolean => {
    if (userRole === PlatformRole.SUPER_ADMIN) return true;
    if (!userRole) return false;

    const permissions = ROLE_PERMISSIONS[userRole as TenantRole];
    if (!permissions) return false;

    const resourcePerm = permissions.find(p => p.resource === resource);
    return resourcePerm?.actions.includes(action as any) ?? false;
  };

  const hasRole = (...roles: UserRole[]): boolean => {
    if (!userRole) return false;
    return roles.includes(userRole);
  };

  const canAccessModule = (module: string): boolean => {
    if (userRole === PlatformRole.SUPER_ADMIN) return true;
    if (!userRole) return false;

    const allowedRoles = MODULE_ACCESS[module];
    return allowedRoles?.includes(userRole) ?? false;
  };

  return {
    userRole,
    loading,
    hasPermission,
    hasRole,
    canAccessModule,
    isSuperAdmin: userRole === PlatformRole.SUPER_ADMIN,
    isOwner: userRole === TenantRole.FARM_OWNER,
    isManager: userRole === TenantRole.FARM_MANAGER,
    isVet: userRole === TenantRole.VETERINARIAN,
    isBreeder: userRole === TenantRole.BREEDER,
    isWorker: userRole === TenantRole.MILKING_STAFF,
    isFeedManager: userRole === TenantRole.FEED_MANAGER,
    isAccountant: userRole === TenantRole.ACCOUNTANT,
    isGuest: userRole === TenantRole.GUEST,
  };
}
