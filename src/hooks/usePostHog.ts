"use client";

import { useEffect, useState } from "react";

/**
 * Custom hook for PostHog analytics with tenant context
 */
export function usePostHogAnalytics() {
  const [posthog, setPosthog] = useState<any>(null);
  
  useEffect(() => {
    if (typeof window !== "undefined" && process.env.NEXT_PUBLIC_POSTHOG_KEY) {
      import("posthog-js").then((module) => {
        setPosthog(module.default);
      }).catch(() => {});
    }
  }, []);

  const userId: string | null = null;
  const organization: { id?: string; slug?: string } | null = null;

  const trackEvent = (
    eventName: string,
    properties?: Record<string, unknown>
  ) => {
    if (!posthog || !process.env.NEXT_PUBLIC_POSTHOG_KEY) return;

    const eventProperties = {
      ...properties,
      tenantId: organization?.id,
      tenantSlug: organization?.slug,
      userId,
    };

    posthog.capture(eventName, eventProperties);
  };

  const trackPageView = (pageName: string, properties?: Record<string, unknown>) => {
    if (!posthog || !process.env.NEXT_PUBLIC_POSTHOG_KEY) return;

    posthog.capture("$pageview", {
      page_name: pageName,
      ...properties,
      tenantId: organization?.id,
      tenantSlug: organization?.slug,
      userId,
    });
  };

  const trackButtonClick = (
    buttonName: string,
    location: string,
    properties?: Record<string, unknown>
  ) => {
    if (!posthog || !process.env.NEXT_PUBLIC_POSTHOG_KEY) return;
    trackEvent("button_clicked", {
      button_name: buttonName,
      location,
      ...properties,
    });
  };

  // Specific event trackers for the app
  const trackMilkLog = (properties?: { animalId?: string; quantity?: number; session?: string }) => {
    trackButtonClick("log_milk", "milk_log_form", {
      event_type: "milk_logged",
      ...properties,
    });
  };

  const trackAnimalCreation = (properties?: { species?: string; breed?: string }) => {
    trackButtonClick("create_animal", "animal_form", {
      event_type: "animal_created",
      ...properties,
    });
  };

  const trackReportDownload = (properties?: { reportType?: string; format?: string }) => {
    trackEvent("report_downloaded", {
      report_type: properties?.reportType,
      format: properties?.format || "pdf",
      ...properties,
    });
  };

  const trackEggLog = (properties?: { quantity?: number; date?: string }) => {
    trackEvent("egg_logged", {
      quantity: properties?.quantity,
      date: properties?.date,
      ...properties,
    });
  };

  const trackSubscriptionUpgrade = (properties?: { 
    fromPlan?: string; 
    toPlan?: string; 
    amount?: number;
    gateway?: string;
  }) => {
    trackEvent("subscription_upgraded", {
      from_plan: properties?.fromPlan,
      to_plan: properties?.toPlan,
      amount: properties?.amount,
      gateway: properties?.gateway,
      ...properties,
    });
  };

  // Feature flags helper
  const getFeatureFlag = (flagName: string): boolean | undefined => {
    if (!posthog || !process.env.NEXT_PUBLIC_POSTHOG_KEY) return undefined;
    return posthog.isFeatureEnabled(flagName);
  };

  const getFeatureFlagValue = (flagName: string): string | boolean | undefined => {
    if (!posthog || !process.env.NEXT_PUBLIC_POSTHOG_KEY) return undefined;
    return posthog.getFeatureFlag(flagName);
  };

  return {
    trackEvent,
    trackPageView,
    trackButtonClick,
    trackMilkLog,
    trackAnimalCreation,
    trackReportDownload,
    trackEggLog,
    trackSubscriptionUpgrade,
    getFeatureFlag,
    getFeatureFlagValue,
    posthog, // Expose posthog instance for feature flags
  };
}

