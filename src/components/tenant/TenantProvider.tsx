'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { useOrganization } from '@clerk/nextjs';
import { useQuery } from '@tanstack/react-query';
import type { TenantConfig, TenantSubscription, TenantLimits } from '@/types';

interface TenantContextValue {
  config: TenantConfig | null;
  subscription: TenantSubscription | null;
  limits: TenantLimits | null;
  isLoading: boolean;
  tenantId: string | null;
  tenantSlug: string | null;
}

const TenantContext = createContext<TenantContextValue | undefined>(undefined);

export function TenantProvider({ children }: { children: React.ReactNode }) {
  const { organization, isLoaded } = useOrganization();
  const [tenantId, setTenantId] = useState<string | null>(null);
  const [tenantSlug, setTenantSlug] = useState<string | null>(null);

  useEffect(() => {
    if (organization) {
      setTenantId(organization.id);
      setTenantSlug(organization.slug || null);
    }
  }, [organization]);

  // Fetch tenant config
  const { data: config, isLoading: configLoading } = useQuery({
    queryKey: ['tenant-config', tenantId],
    queryFn: async () => {
      if (!tenantId) return null;

      const res = await fetch('/api/tenants/config');
      if (!res.ok) return null;
      return res.json() as Promise<TenantConfig>;
    },
    enabled: !!tenantId && isLoaded,
  });

  // Fetch tenant subscription
  const { data: subscription, isLoading: subLoading } = useQuery({
    queryKey: ['tenant-subscription', tenantId],
    queryFn: async () => {
      if (!tenantId) return null;

      const res = await fetch('/api/tenants/subscription');
      if (!res.ok) return null;
      return res.json() as Promise<TenantSubscription>;
    },
    enabled: !!tenantId && isLoaded,
  });

  // Fetch tenant limits
  const { data: limits, isLoading: limitsLoading } = useQuery({
    queryKey: ['tenant-limits', tenantId],
    queryFn: async () => {
      if (!tenantId) return null;

      const res = await fetch('/api/tenants/limits');
      if (!res.ok) return null;
      return res.json() as Promise<TenantLimits>;
    },
    enabled: !!tenantId && isLoaded,
  });

  const isLoading = configLoading || subLoading || limitsLoading || !isLoaded;

  return (
    <TenantContext.Provider
      value={{
        config: config || null,
        subscription: subscription || null,
        limits: limits || null,
        isLoading,
        tenantId,
        tenantSlug,
      }}
    >
      {children}
    </TenantContext.Provider>
  );
}

export function useTenantContext() {
  const context = useContext(TenantContext);
  if (!context) {
    throw new Error('useTenantContext must be used within TenantProvider');
  }
  return context;
}
