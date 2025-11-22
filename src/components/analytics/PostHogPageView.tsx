"use client";

import { useEffect } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { usePostHogAnalytics } from "@/hooks/usePostHog";

/**
 * Component to automatically track page views
 * Add this to your layout or root component
 */
export function PostHogPageView() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { trackPageView } = usePostHogAnalytics();

  useEffect(() => {
    if (pathname) {
      const url = searchParams?.toString()
        ? `${pathname}?${searchParams.toString()}`
        : pathname;
      
      trackPageView(pathname, {
        url,
      });
    }
  }, [pathname, searchParams, trackPageView]);

  return null;
}

