# Phase 5.3 — Production Configuration, Domain, CORS & Security Headers Report

**Project:** Malik Tech Dairy SaaS  
**Production Domain:** `https://dairy.mtkcodex.site`  
**Phase:** 5.3 (Hardening, Origin Validation, Headers & Security Baseline)  
**Execution Date:** September 19, 2026  
**Status:** COMPLETE & VERIFIED

---

## 1. Executive Summary

Phase 5.3 systematically hardened the production security posture of Malik Tech Dairy across all web, API, and background worker surfaces. Building upon the Phase 5.2 environment audit, this phase eliminated legacy domain traces, introduced a centralized origin validator (`src/lib/cors.ts`), hardened API CORS preflight handling (`OPTIONS`), refined the Content Security Policy (CSP) to explicit origins, enforced defense-in-depth security headers, audited cookie configurations, and expanded automated security regression tests to 22 dedicated assertions.

All 26 test suites (322 tests) pass, TypeScript compilation passes with 0 errors, ESLint passes with 0 errors, and the Next.js production build succeeds with complete route optimization.

---

## 2. Production Domain Audit

- **Canonical Production Domain:** `https://dairy.mtkcodex.site`
- **Subdomain Routing Scheme:**
  - Apex/Marketing: `https://dairy.mtkcodex.site`
  - Tenant Portals: `https://{subdomain}.dairy.mtkcodex.site`
- **Remediations Executed:**
  - Replaced legacy support email `support@maliktechdairy.com` with `support@dairy.mtkcodex.site` across `src/app/(dashboard)/help/page.tsx`, `src/app/(public)/apply/page.tsx`, `src/app/error.tsx`, `src/app/unsubscribe/page.tsx`, and `src/lib/seo/config.ts`.
  - Replaced legacy domain references in deployment guides and documentation (`README.md`, `SETUP_GUIDE.md`, `VERCEL_DEPLOYMENT_GUIDE.md`, `DEPLOYMENT_GUIDE.md`).
  - Audited `src/middleware.ts` to ensure `subdomain !== 'dairy'` strictly excludes the apex domain from being processed as an organization tenant.
  - Verified PWA manifest start URL is `/` (origin-relative, binding cleanly to `https://dairy.mtkcodex.site`).

---

## 3. CORS Audit & Hardening

### Findings in Pre-Existing Code:

- `next.config.ts` previously permitted `Access-Control-Allow-Origin: *` in non-production, which poses credential exposure risks if tested with browser cookies.
- Preflight `OPTIONS` requests sent to protected API routes were blocked by auth middleware before CORS headers could be returned, causing cross-origin preflight failures on tenant subdomains.
- No dynamic tenant subdomain origin evaluation was implemented.

### Remediations Implemented:

1. **Centralized Origin Validator (`src/lib/cors.ts`):**
   - Strictly accepts `https://dairy.mtkcodex.site` and any valid tenant subdomain `https://*.dairy.mtkcodex.site`.
   - Rejects unencrypted `http://`, unknown domains, spoofed hostnames, and arbitrary origins without reflection.
   - Restricts `localhost` and `127.0.0.1` exclusively to non-production environments (`NODE_ENV !== 'production'`).
2. **Framework-Decoupled Preflight Engine (`handleCorsPreflight`):**
   - Intercepts `OPTIONS` requests in `src/middleware.ts` before Clerk auth evaluation.
   - Returns HTTP 204 No Content with full CORS headers for permitted origins.
   - Returns HTTP 403 Forbidden without CORS headers for unauthorized origins.
3. **Credentials & Wildcard Prohibition:**
   - Every credentialed response sets `Access-Control-Allow-Origin: <origin>` (never `*`).
   - Sets `Access-Control-Allow-Credentials: true`.
   - Sets `Vary: Origin` to ensure intermediate proxy caches do not serve mismatched CORS headers to different origins.

---

## 4. Content Security Policy (CSP) Audit

The Content Security Policy in `next.config.ts` was audited and hardened by replacing wildcard protocols (`https: http:`) with explicit whitelisted origins.

### CSP Directive Matrix:

| Directive                   | Configured Value                                                                                                                                                                                                                                                                                                                                               | Operational Justification                                                                                                                                      |
| :-------------------------- | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | :------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `default-src`               | `'self'`                                                                                                                                                                                                                                                                                                                                                       | Fallback default restricts all resource loading to origin.                                                                                                     |
| `script-src`                | `'self' 'unsafe-eval' 'unsafe-inline' https://clerk.com https://*.clerk.accounts.dev https://js.sentry-cdn.com https://*.posthog.com https://challenges.cloudflare.com`                                                                                                                                                                                        | Next.js runtime bootstrap, Clerk authentication widget, Cloudflare Turnstile anti-bot, Sentry error tracker, PostHog telemetry.                                |
| `style-src`                 | `'self' 'unsafe-inline' https://fonts.googleapis.com`                                                                                                                                                                                                                                                                                                          | Tailwind CSS runtime classes, Radix UI dynamic inline positioning variables, Google Fonts.                                                                     |
| `img-src`                   | `'self' data: blob: https://res.cloudinary.com https://*.supabase.co https://img.clerk.com https://images.clerk.dev https://*.googleusercontent.com https://*.googleapis.com https://*.firebaseapp.com https://openweathermap.org`                                                                                                                             | Replaced open `https: http:` with specific origins for Cloudinary uploads, Supabase assets, Clerk user avatars, Google OAuth photos, and OpenWeatherMap icons. |
| `font-src`                  | `'self' https://fonts.gstatic.com data:`                                                                                                                                                                                                                                                                                                                       | Web fonts from Google Fonts and inline SVG/data font formats.                                                                                                  |
| `connect-src`               | `'self' https://*.clerk.com https://*.clerk.accounts.dev https://clerk-telemetry.com https://*.supabase.co wss://*.supabase.co https://*.firebaseio.com https://*.googleapis.com https://*.sentry.io https://*.posthog.com https://us.i.posthog.com https://api.cloudinary.com https://res.cloudinary.com https://*.upstash.io https://api.openweathermap.org` | Backend APIs, Supabase PostgreSQL REST & Realtime WebSocket (`wss://`), Clerk auth sessions, Sentry ingest, PostHog events, Upstash Redis, OpenWeatherMap API. |
| `media-src`                 | `'self' https://res.cloudinary.com`                                                                                                                                                                                                                                                                                                                            | Uploaded audio/video clips in Cloudinary.                                                                                                                      |
| `frame-src`                 | `'self' https://clerk.com https://*.clerk.accounts.dev https://challenges.cloudflare.com`                                                                                                                                                                                                                                                                      | Clerk authentication iframes and Cloudflare Turnstile challenges.                                                                                              |
| `manifest-src`              | `'self'`                                                                                                                                                                                                                                                                                                                                                       | PWA web manifest file (`/manifest.json`).                                                                                                                      |
| `worker-src`                | `'self' blob:`                                                                                                                                                                                                                                                                                                                                                 | Service Worker runtime for next-pwa and client caching.                                                                                                        |
| `object-src`                | `'none'`                                                                                                                                                                                                                                                                                                                                                       | Blocks legacy Flash, Java, and browser plugins.                                                                                                                |
| `base-uri`                  | `'self'`                                                                                                                                                                                                                                                                                                                                                       | Prevents malicious `<base>` tag injection attacks.                                                                                                             |
| `form-action`               | `'self'`                                                                                                                                                                                                                                                                                                                                                       | Restricts HTML form submissions strictly to current origin.                                                                                                    |
| `frame-ancestors`           | `'none'`                                                                                                                                                                                                                                                                                                                                                       | Completely prohibits embedding in iframes (Clickjacking protection).                                                                                           |
| `upgrade-insecure-requests` | Appended in `NODE_ENV === 'production'`                                                                                                                                                                                                                                                                                                                        | Forces browser to upgrade any mixed content HTTP requests to HTTPS.                                                                                            |

---

## 5. Security Headers Reference

Applied globally across all routes via `next.config.ts`:

| Header                           | Value                                                                                  | Purpose & Compatibility Considerations                                                                                                                                                                                                                  |
| :------------------------------- | :------------------------------------------------------------------------------------- | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Strict-Transport-Security**    | `max-age=63072000; includeSubDomains`                                                  | Enforces HTTPS for 2 years across apex and all tenant subdomains. Conditioned on `NODE_ENV === 'production'` to prevent locking localhost into HTTPS during development. `preload` deferred until domain validation is confirmed across all subdomains. |
| **X-Frame-Options**              | `DENY`                                                                                 | Rejects any attempt to render the application in `<frame>`, `<iframe>`, or `<embed>`. Redundant defense-in-depth alongside CSP `frame-ancestors 'none'`.                                                                                                |
| **X-Content-Type-Options**       | `nosniff`                                                                              | Blocks MIME-type sniffing, forcing browsers to respect declared `Content-Type`. Verified compatible with CSV, PDF, and Cloudinary media downloads.                                                                                                      |
| **X-XSS-Protection**             | `1; mode=block`                                                                        | Legacy filter activation for older browser versions.                                                                                                                                                                                                    |
| **Referrer-Policy**              | `strict-origin-when-cross-origin`                                                      | Sends full URL on same-origin requests, origin-only on HTTPS cross-origin requests, and zero referrer on HTTPS-to-HTTP downgrade. Preserves OAuth and payment gateway redirect tokens.                                                                  |
| **Permissions-Policy**           | `camera=(self), microphone=(), geolocation=(self), payment=(self), interest-cohort=()` | Grants camera/geolocation access only to application origin for livestock photography and farm mapping. Fully disables microphone and FLoC privacy tracking (`interest-cohort`).                                                                        |
| **Cross-Origin-Opener-Policy**   | `same-origin-allow-popups`                                                             | Retains browsing context security while permitting Clerk OAuth and payment authentication popups/redirects.                                                                                                                                             |
| **Cross-Origin-Resource-Policy** | `same-origin`                                                                          | Prevents other origins from reading site resources via `fetch()` or `<img>`.                                                                                                                                                                            |

---

## 6. Cookie & Session Security

1. **CSRF Protection Cookie (`src/lib/csrf.ts`):**
   - `httpOnly: true` (inaccessible to JavaScript)
   - `secure: process.env.NODE_ENV === 'production'` (transmitted only via HTTPS)
   - `sameSite: 'strict'` (blocks cross-site transmission)
   - `maxAge: 86400` (24-hour expiration)
2. **Localization Cookie (`src/components/ui/language-switcher.tsx`):**
   - Updated to append `; Secure` when running over HTTPS.
   - `SameSite=Lax`, `path=/`.
3. **Clerk Identity Session Cookies:**
   - Managed directly by Clerk's secure SDK (`__session`, `__client_uat`).
   - Automatically configured with `HttpOnly`, `Secure`, and `SameSite=Lax`.

---

## 7. Trusted Origin & Header Handling

- **Host Validation:** Hostname and subdomain extraction in `src/middleware.ts` exclusively parses `req.headers.get('host')`.
- **IP & Proxy Identification:** Client IP extraction in `src/lib/audit.ts` and `src/lib/ratelimit.ts` sanitizes `x-forwarded-for` via `.split(',')[0].trim()`, taking the leftmost untrusted-proxy address for rate limiting without blind header trust.
- **No Open Redirects:** All redirection targets in auth middleware and payment callbacks strictly resolve relative paths or prepend `process.env.NEXT_PUBLIC_APP_URL || 'https://dairy.mtkcodex.site'`.

---

## 8. Webhook Security

1. **Clerk Webhooks (`/api/webhooks/clerk`):**
   - Enforces Svix signature verification (`svix-id`, `svix-timestamp`, `svix-signature`).
   - Rejects unconfigured or placeholder `CLERK_WEBHOOK_SECRET`.
   - Replay protection with 5-minute TTL in-memory cache.
2. **Payment Callbacks (`/api/payments/callback/[gateway]`):**
   - In production mode, unconfigured gateway credentials redirect to error status instead of crashing.
   - Redirect targets utilize `https://dairy.mtkcodex.site`.

---

## 9. PWA & Service Worker Security

- **Manifest (`public/manifest.json`):**
  - `"start_url": "/"` (relative origin root).
  - Scope restricted to `/`.
- **Service Worker (`next-pwa` in `next.config.ts`):**
  - Caches only designated offline field APIs (`/api/animals`, `/api/milk`, `/api/health`).
  - Financial, billing, user credentials, and admin routes are excluded from PWA caching.
  - Disabled during local development (`disable: process.env.NODE_ENV === 'development'`).

---

## 10. Development vs Production Separation

| Dimension                | Production (`NODE_ENV === 'production'`)                            | Development (`NODE_ENV === 'development'`)      |
| :----------------------- | :------------------------------------------------------------------ | :---------------------------------------------- |
| **CORS Origins**         | `https://dairy.mtkcodex.site` & `*.dairy.mtkcodex.site` only        | `localhost`, `127.0.0.1`, `*.localhost` allowed |
| **HSTS Header**          | Enabled (`max-age=63072000; includeSubDomains`)                     | Omitted (prevents localhost HTTPS lockout)      |
| **CSP Upgrade Insecure** | Enabled (`upgrade-insecure-requests`)                               | Omitted                                         |
| **Sentry Bundling**      | Enabled if DSN configured                                           | Disabled to preserve compilation memory         |
| **API Error Details**    | Generic message (`'An unexpected error occurred'`), stack undefined | Detailed message and error stack exposed        |
| **Cookies**              | `Secure` attribute enforced on all cookies                          | Permitted over plaintext HTTP                   |
| **Payment Simulation**   | Disabled (fails closed with configuration error)                    | Sandbox simulator allowed                       |

---

## 11. API Security & Error Exposure

- Audited all API route handlers (`src/app/api/**/route.ts`).
- Confirmed zero exposure of database connection strings, credentials, or internal file paths.
- Removed vestigial `errorStack` declaration in `src/app/api/admin/applications/[id]/review/route.ts`.

---

## 12. Security Regression Test Results

Enhanced test suite in `src/lib/__tests__/security-regression.test.ts`:

```text
PASS src/lib/__tests__/security-regression.test.ts
  Phase 4.5 & 5.3 Security Regression Test Suite
    1. Tenant-Scoped Role Resolution
      √ should query tenantMembers with BOTH userId and tenantId
      √ should not allow cross-tenant role inheritance
    2. Cross-Tenant Task Validation Isolation
      √ should reject task assignment if user does not belong to tenant
      √ should reject task assignment if animal belongs to another tenant
    3. Cron Authentication Security
      √ should reject requests when CRON_SECRET is unconfigured
      √ should reject requests when Bearer token does not match
      √ should reject requests with missing Authorization header
      √ should authorize requests with exact Bearer token matching CRON_SECRET
    4. Automated Reminders Multi-Tenant Isolation
      √ should isolate reminder generation per tenant
      √ should prevent duplicate notifications
    5. Production CORS & Origin Validation (Phase 5.3)
      √ should accept the production apex domain https://dairy.mtkcodex.site
      √ should accept production tenant subdomains (*.dairy.mtkcodex.site)
      √ should reject unknown, spoofed, or malicious origins
      √ should never return wildcard * when credentials are used
      √ should return empty headers for rejected origins
      √ should handle OPTIONS preflight with 204 for allowed origin
      √ should reject OPTIONS preflight with 403 for unauthorized origin
      √ should reject localhost origins when NODE_ENV is production
    6. Security Headers & Defense-in-Depth (Phase 5.3)
      √ should verify clickjacking protection via frame-ancestors none and X-Frame-Options DENY
      √ should verify MIME content sniffing protection is nosniff
      √ should verify Referrer-Policy enforces strict-origin-when-cross-origin
      √ should verify Permissions-Policy disables unused sensitive browser features
```

---

## 13. Files Changed in Phase 5.3

1. `src/lib/cors.ts` (NEW): Centralized origin validator, preflight handler, and CORS header generator.
2. `src/middleware.ts`: Integrated CORS preflight handling, attached dynamic CORS headers to API responses, and hardened subdomain isolation.
3. `next.config.ts`: Tightened CSP with explicit image/connect/media sources, hardened security headers (HSTS production condition, COOP, CORP, Permissions-Policy), and eliminated wildcard CORS fallback.
4. `src/components/ui/language-switcher.tsx`: Enforced `Secure` flag on locale cookie over HTTPS.
5. `src/app/api/admin/applications/[id]/review/route.ts`: Removed unused error stack reference.
6. `src/app/api/payments/callback/[gateway]/route.ts`: Updated redirect fallbacks to production domain.
7. `src/app/(dashboard)/help/page.tsx`, `src/app/(public)/apply/page.tsx`, `src/app/error.tsx`, `src/app/unsubscribe/page.tsx`, `src/lib/seo/config.ts`: Updated support email to `support@dairy.mtkcodex.site`.
8. `README.md`, `SETUP_GUIDE.md`, `VERCEL_DEPLOYMENT_GUIDE.md`, `DEPLOYMENT_GUIDE.md`: Updated production domain references.
9. `src/lib/__tests__/security-regression.test.ts`: Added Phase 5.3 CORS and security header regression test suites.

---

## 14. Quality Gates Verification

| Check                         | Command                        | Status   | Result                                                  |
| :---------------------------- | :----------------------------- | :------- | :------------------------------------------------------ |
| **TypeScript**                | `npx tsc --noEmit`             | **PASS** | 0 errors                                                |
| **ESLint**                    | `npm run lint`                 | **PASS** | 0 errors (1377 non-blocking warnings)                   |
| **Unit & Integration Tests**  | `npm test`                     | **PASS** | 26 test suites passed, 322 tests passed                 |
| **Security Regression Tests** | `npx jest security-regression` | **PASS** | 22 tests passed                                         |
| **Next.js Production Build**  | `npm run build`                | **PASS** | Compiled successfully; static & dynamic routes verified |

---

## 15. Remaining Production Risks & Considerations

1. **Third-Party Dashboard DNS & Webhooks:**
   - Clerk Dashboard must verify `https://dairy.mtkcodex.site` and configure the webhook URL `https://dairy.mtkcodex.site/api/webhooks/clerk`.
   - Resend must verify domain DNS records (SPF/DKIM) for `dairy.mtkcodex.site`.
2. **Wildcard DNS / SSL for Subdomains:**
   - Production hosting (Vercel) must configure a wildcard domain `*.dairy.mtkcodex.site` with an active SSL certificate to ensure seamless tenant subdomain routing.
3. **Environment Provisioning:**
   - All 18 required variables cataloged in `docs/PRODUCTION-ENVIRONMENT-MATRIX.md` must be configured in hosting environment secrets.

---

## 16. Scope & Requirements for Phase 5.4

Phase 5.4 will address:

- Production Deployment Pipeline & Hosting Environment Configuration (Vercel / AWS).
- Vercel Cron verification for `/api/cron/predictions` and `/api/cron/reminders`.
- Post-deployment smoke tests and health check validation on live `https://dairy.mtkcodex.site/api/system/health`.
