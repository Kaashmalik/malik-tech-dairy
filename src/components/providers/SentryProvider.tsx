"use client";

import { useEffect } from "react";
import * as Sentry from "@sentry/nextjs";
import { useAuth, useOrganization } from "@clerk/nextjs";

/**
 * Component to automatically set Sentry context from Clerk
 * This ensures tenantId and userId are attached to all events
 */
export function SentryProvider({ children }: { children: React.ReactNode }) {
  const { userId } = useAuth();
  const { organization } = useOrganization();

  useEffect(() => {
    // Set user context in Sentry
    if (userId) {
      Sentry.setUser({ id: userId });
      
      // Store in window for client-side error handling
      if (typeof window !== "undefined") {
        (window as any).__CLERK_USER_ID__ = userId;
      }
    } else {
      Sentry.setUser(null);
      if (typeof window !== "undefined") {
        delete (window as any).__CLERK_USER_ID__;
      }
    }

    // Set tenant context in Sentry
    if (organization) {
      Sentry.setTag("tenantId", organization.id);
      Sentry.setContext("tenant", {
        id: organization.id,
        slug: organization.slug,
        name: organization.name,
      });
      
      // Store in window for client-side error handling
      if (typeof window !== "undefined") {
        (window as any).__CLERK_ORG_ID__ = organization.id;
        (window as any).__TENANT_ID__ = organization.id;
      }
    } else {
      Sentry.setTag("tenantId", undefined);
      Sentry.setContext("tenant", undefined);
      if (typeof window !== "undefined") {
        delete (window as any).__CLERK_ORG_ID__;
        delete (window as any).__TENANT_ID__;
      }
    }
  }, [userId, organization]);

  return <>{children}</>;
}

