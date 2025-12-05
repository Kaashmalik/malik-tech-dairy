"use client";

import { useTenantContext } from "./TenantProvider";
import { useEffect } from "react";

/**
 * Applies dynamic branding (colors, logo) from tenant config
 */
export function DynamicBranding() {
  const { config } = useTenantContext();

  useEffect(() => {
    if (!config) return;

    const root = document.documentElement;

    // Apply primary color
    if (config.primaryColor) {
      root.style.setProperty("--tenant-primary", config.primaryColor);
    }

    // Apply accent color
    if (config.accentColor) {
      root.style.setProperty("--tenant-accent", config.accentColor);
    }

    // Apply language direction
    if (config.language === "ur") {
      document.documentElement.setAttribute("dir", "rtl");
      document.documentElement.setAttribute("lang", "ur");
    } else {
      document.documentElement.setAttribute("dir", "ltr");
      document.documentElement.setAttribute("lang", "en");
    }
  }, [config]);

  return null;
}

/**
 * Tenant Logo Component
 */
export function TenantLogo({ className }: { className?: string }) {
  const { config } = useTenantContext();

  if (config?.logoUrl) {
    return (
      <img
        src={config.logoUrl}
        alt={config.farmName || "Farm Logo"}
        className={className}
      />
    );
  }

  // Default logo
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
        <span className="text-primary-foreground font-bold text-lg">M</span>
      </div>
      <span className="font-semibold text-lg">
        {config?.farmName || "MTK Dairy"}
      </span>
    </div>
  );
}

