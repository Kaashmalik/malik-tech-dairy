"use client";

import { useTenantContext } from "@/components/tenant/TenantProvider";
import { useUser } from "@clerk/nextjs";
import { useEffect, useState } from "react";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase/client";
import { ROLE_PERMISSIONS, TenantRole, UserRole, PlatformRole, MODULE_ACCESS } from "@/types/roles";

export function usePermissions() {
  const { user } = useUser();
  const { tenantId } = useTenantContext();
  const [userRole, setUserRole] = useState<UserRole | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchUserRole() {
      if (!user?.id || !tenantId) {
        setLoading(false);
        return;
      }

      try {
        // Check if super admin first
        const userDoc = await getDoc(doc(db, "users", user.id));
        
        if (userDoc.exists()) {
          const userData = userDoc.data();
          
          // Check for platform-level super admin
          if (userData.platformRole === PlatformRole.SUPER_ADMIN) {
            setUserRole(PlatformRole.SUPER_ADMIN);
            setLoading(false);
            return;
          }
        }

        // Get tenant-specific role from members collection
        const memberDoc = await getDoc(
          doc(db, `tenants/${tenantId}/members`, user.id)
        );

        if (memberDoc.exists()) {
          const memberData = memberDoc.data();
          setUserRole(memberData.role as TenantRole);
        } else {
          // Fallback: check legacy users collection
          if (userDoc.exists()) {
            const userData = userDoc.data();
            if (userData.tenantId === tenantId && userData.role) {
              setUserRole(userData.role as TenantRole);
            }
          }
        }
      } catch (error) {
        console.error("Error fetching user role:", error);
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

    const resourcePerm = permissions.find((p) => p.resource === resource);
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

