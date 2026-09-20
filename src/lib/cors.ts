/**
 * Centralized CORS & Origin Validation Utility
 * Target Production Domain: https://dairy.mtkcodex.site
 */

export const PRODUCTION_DOMAIN = 'dairy.mtkcodex.site';
export const PRODUCTION_ORIGIN = `https://${PRODUCTION_DOMAIN}`;

/**
 * Validate if an origin is permitted to access API resources
 */
export function isAllowedOrigin(origin: string | null): boolean {
  if (!origin) return false;

  try {
    const url = new URL(origin);

    // Production environment checks
    if (url.protocol === 'https:') {
      // Direct production apex domain
      if (url.hostname === PRODUCTION_DOMAIN) {
        return true;
      }
      // Subdomain check: *.dairy.mtkcodex.site
      if (url.hostname.endsWith(`.${PRODUCTION_DOMAIN}`)) {
        return true;
      }
    }

    // Explicit configured APP_URL check if provided
    if (process.env.NEXT_PUBLIC_APP_URL) {
      try {
        const appUrl = new URL(process.env.NEXT_PUBLIC_APP_URL);
        if (url.origin === appUrl.origin) {
          return true;
        }
      } catch {}
    }

    // Local development origins (strictly excluded in production)
    if (process.env.NODE_ENV !== 'production') {
      if (
        (url.protocol === 'http:' || url.protocol === 'https:') &&
        (url.hostname === 'localhost' ||
          url.hostname === '127.0.0.1' ||
          url.hostname.endsWith('.localhost'))
      ) {
        return true;
      }
    }

    return false;
  } catch {
    return false;
  }
}

/**
 * Generate standard CORS headers for an allowed origin
 */
export function getCorsHeaders(origin: string | null): Record<string, string> {
  if (!origin || !isAllowedOrigin(origin)) {
    return {};
  }

  return {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Credentials': 'true',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, PATCH, OPTIONS',
    'Access-Control-Allow-Headers':
      'Content-Type, Authorization, X-Request-ID, X-Tenant-ID, X-CSRF-Token, Sentry-Trace, Baggage',
    'Access-Control-Max-Age': '86400',
    Vary: 'Origin',
  };
}

export interface PreflightResult {
  status: number;
  headers: Record<string, string>;
}

/**
 * Handle OPTIONS preflight requests
 */
export function handleCorsPreflight(request: {
  method?: string;
  headers: { get(name: string): string | null };
}): PreflightResult | null {
  if (request.method?.toUpperCase() !== 'OPTIONS') {
    return null;
  }

  const origin = request.headers.get('origin');
  if (origin && isAllowedOrigin(origin)) {
    return {
      status: 204,
      headers: getCorsHeaders(origin),
    };
  }

  // Unknown origin preflight: reject with 403 without CORS headers
  return {
    status: 403,
    headers: {},
  };
}
