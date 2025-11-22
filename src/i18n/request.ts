import { getRequestConfig } from "next-intl/server";
import { routing } from "./routing";
import { headers } from "next/headers";
import { getTenantConfig } from "@/lib/supabase/tenant";

/**
 * Auto-detect language from:
 * 1. URL locale segment (if present)
 * 2. Tenant config (if tenant context available)
 * 3. Accept-Language header
 * 4. Default locale
 */
function detectLocale(
  requestLocale: string | undefined,
  acceptLanguage: string | null,
  tenantLanguage?: string
): string {
  // Priority 1: Explicit locale in URL
  if (requestLocale && routing.locales.includes(requestLocale as any)) {
    return requestLocale;
  }

  // Priority 2: Tenant config language
  if (tenantLanguage && routing.locales.includes(tenantLanguage as any)) {
    return tenantLanguage;
  }

  // Priority 3: Browser Accept-Language header
  if (acceptLanguage) {
    // Parse Accept-Language header (e.g., "en-US,en;q=0.9,ur;q=0.8")
    const languages = acceptLanguage
      .split(",")
      .map((lang) => {
        const [code, q = "1.0"] = lang.trim().split(";q=");
        return { code: code.split("-")[0].toLowerCase(), quality: parseFloat(q) };
      })
      .sort((a, b) => b.quality - a.quality);

    for (const lang of languages) {
      if (routing.locales.includes(lang.code as any)) {
        return lang.code;
      }
    }
  }

  // Priority 4: Default locale
  return routing.defaultLocale;
}

export default getRequestConfig(async ({ requestLocale }) => {
  const headersList = await headers();
  const acceptLanguage = headersList.get("accept-language");
  const tenantId = headersList.get("x-tenant-id");

  // Try to get tenant language if tenant context is available
  let tenantLanguage: string | undefined;
  if (tenantId) {
    try {
      const tenantConfig = await getTenantConfig(tenantId);
      tenantLanguage = tenantConfig?.language;
    } catch (error) {
      // Fail silently if tenant config not available
      console.error("Error fetching tenant config for language detection:", error);
    }
  }

  const locale = detectLocale(requestLocale, acceptLanguage, tenantLanguage);

  return {
    locale,
    messages: (await import(`../../messages/${locale}.json`)).default,
  };
});

