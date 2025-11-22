"use client";

import posthog from "posthog-js";
import { PostHogProvider as PHProvider } from "posthog-js/react";
import { useEffect } from "react";
import { useAuth, useOrganization } from "@clerk/nextjs";

interface PostHogProviderProps {
  children: React.ReactNode;
}

export function PostHogProvider({ children }: PostHogProviderProps) {
  useEffect(() => {
    if (
      typeof window !== "undefined" &&
      process.env.NEXT_PUBLIC_POSTHOG_KEY &&
      !posthog.__loaded
    ) {
      posthog.init(process.env.NEXT_PUBLIC_POSTHOG_KEY!, {
        api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST || "https://us.i.posthog.com",
        loaded: (posthog) => {
          if (process.env.NODE_ENV === "development") {
            posthog.debug();
          }
        },
        capture_pageview: false, // We'll capture manually
        capture_pageleave: true,
      });
    }
  }, []);

  return (
    <PHProvider client={posthog}>
      <PostHogUserIdentifier />
      {children}
    </PHProvider>
  );
}

/**
 * Component to identify users and set organization context
 */
function PostHogUserIdentifier() {
  const { userId } = useAuth();
  const { organization } = useOrganization();

  useEffect(() => {
    if (
      typeof window !== "undefined" &&
      posthog.__loaded &&
      process.env.NEXT_PUBLIC_POSTHOG_KEY
    ) {
      if (userId) {
        posthog.identify(userId, {
          // Add any user properties here
        });
      } else {
        posthog.reset();
      }

      if (organization) {
        posthog.group("organization", organization.id, {
          name: organization.name,
          slug: organization.slug,
        });
      }
    }
  }, [userId, organization]);

  return null;
}

