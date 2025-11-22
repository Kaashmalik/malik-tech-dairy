"use client";

import { useOrganization } from "@clerk/nextjs";
import { useTenantContext } from "@/components/tenant/TenantProvider";

/**
 * Legacy hook - use useTenantContext instead
 * @deprecated Use useTenantContext from TenantProvider
 */
export function useTenant() {
  const { organization, isLoaded } = useOrganization();
  const tenantContext = useTenantContext();

  return {
    tenant: tenantContext.config
      ? {
          id: tenantContext.tenantId || "",
          slug: tenantContext.tenantSlug || "",
          ...tenantContext.config,
        }
      : null,
    tenantId: organization?.id || tenantContext.tenantId,
    tenantSlug: organization?.slug || tenantContext.tenantSlug,
    isLoading: tenantContext.isLoading || !isLoaded,
    isLoaded: isLoaded && !tenantContext.isLoading,
  };
}

