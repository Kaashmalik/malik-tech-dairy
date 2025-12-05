"use client";

import { useEffect, useState } from "react";

interface PostHogProviderProps {
  children: React.ReactNode;
}

// Check if PostHog is configured
const isPostHogEnabled = !!process.env.NEXT_PUBLIC_POSTHOG_KEY;

export function PostHogProvider({ children }: PostHogProviderProps) {
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined" || !isPostHogEnabled) return;

    import("posthog-js").then((posthogModule) => {
      const posthog = posthogModule.default;
      
      if (!posthog.__loaded) {
        posthog.init(process.env.NEXT_PUBLIC_POSTHOG_KEY!, {
          api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST || "https://us.i.posthog.com",
          loaded: () => {
            setIsReady(true);
          },
          capture_pageview: false,
          capture_pageleave: true,
        });
      } else {
        setIsReady(true);
      }
    }).catch(() => {
      // PostHog not available, ignore
    });
  }, []);

  return <>{children}</>;
}

