# Phase 5.2 — Production Environment Audit Report

**Project:** Malik Tech Dairy SaaS  
**Production Domain:** `https://dairy.mtkcodex.site`  
**Execution Date:** September 19, 2026  
**Status:** AUDIT COMPLETE & RECONCILED

---

## 1. Executive Summary

Phase 5.2 conducted an exhaustive audit of all environment variables, configuration files, authentication boundaries, storage services, payment integrations, scheduled automation, CORS policies, and secret hygiene across the entire codebase.

All blockers previously identified in Phase 5.1 have been systematically resolved:

1. **Production Domain Transition:** Hardcoded legacy domain references to `maliktechdairy.com` have been eliminated across middleware, tenant URL generators, domain management UI, OpenAPI docs, and onboarding screens in favor of the production domain `https://dairy.mtkcodex.site`.
2. **Subdomain Isolation Fixed in Middleware:** Resolved a critical logic issue in `src/middleware.ts` where root domain visits to `dairy.mtkcodex.site` were evaluated as tenant slug `"dairy"`, resulting in recursive redirect loops.
3. **Cron Job Hardening:** Strictly enforced `CRON_SECRET` validation across `/api/cron/predictions`, `/api/cron/reminders`, and `/api/migration/schedule`. All routes fail closed if `CRON_SECRET` is missing or the Bearer token does not match.
4. **Environment Matrix & Safe Templates:** Cataloged 65 variables across 12 distinct services in `docs/PRODUCTION-ENVIRONMENT-MATRIX.md`. Rebuilt `.env.example` and `.env.production.example` to remove sensitive sample accounts/project IDs and provide clean, production-grade templates.
5. **Quality Gates & Test Suites:** 26 of 26 test suites passed (317 tests total), including tenant URL tests, payment registry suites, security regression tests, and sanitization checks.

---

## 2. Production Domain Verification

- **Production Domain:** `https://dairy.mtkcodex.site`
- **Subdomain Routing Scheme:**
  - Root: `https://dairy.mtkcodex.site`
  - Tenants: `https://{tenant-subdomain}.dairy.mtkcodex.site`
- **Legacy References Addressed:**
  - `src/lib/utils/tenant.ts`: Swapped default fallback to `https://dairy.mtkcodex.site` and added URL sanitation for protocol and trailing slashes.
  - `src/middleware.ts`: Added `subdomain !== 'dairy'` guard to ensure apex domain is not misidentified as a farm tenant.
  - `src/app/(dashboard)/settings/domain/page.tsx`: CNAME instruction and support contact updated to `dairy.mtkcodex.site`.
  - `src/components/admin/AdminDashboard.tsx`: Tenant preview URL updated to `{tenant.subdomain}.dairy.mtkcodex.site`.
  - `src/components/onboarding/OnboardingWizard.tsx`: Subdomain reservation display updated to `.dairy.mtkcodex.site`.
  - `src/lib/openapi.ts`: Production API server URL set to `https://dairy.mtkcodex.site`.
  - `src/lib/queue.ts`: Default sender updated to `noreply@dairy.mtkcodex.site`.
  - Unit tests updated to validate `https://{subdomain}.dairy.mtkcodex.site`.

---

## 3. Environment-Variable Inventory

The audit discovered 65 distinct `process.env` references throughout the application.

### Grouping by Category:

- **Core Platform & Routing:** `NODE_ENV`, `NEXT_PUBLIC_APP_URL`, `NEXT_PUBLIC_APP_NAME`, `NEXT_PUBLIC_SUPPORT_EMAIL`, `LOG_LEVEL`
- **Clerk Authentication:** `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`, `CLERK_SECRET_KEY`, `CLERK_WEBHOOK_SECRET`, `NEXT_PUBLIC_CLERK_SIGN_IN_URL`, `NEXT_PUBLIC_CLERK_SIGN_UP_URL`, `NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL`, `NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL`
- **Supabase PostgreSQL & Pooler:** `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_DATABASE_URL`, `DATABASE_URL`
- **Automation & Security Secrets:** `CRON_SECRET`, `WEATHER_SYNC_SECRET`, `ENCRYPTION_KEY`
- **Media & File Storage:** `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`, `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME`
- **Transactional Email:** `RESEND_API_KEY`, `RESEND_FROM_EMAIL`
- **AI & Forecasts:** `GROQ_API_KEY`, `NEXT_PUBLIC_OPENWEATHER_API_KEY`
- **Cache & Rate Limiting:** `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN`
- **Observability:** `SENTRY_DSN`, `NEXT_PUBLIC_SENTRY_DSN`, `SENTRY_ORG`, `SENTRY_PROJECT`, `SENTRY_AUTH_TOKEN`, `NEXT_PUBLIC_POSTHOG_KEY`, `NEXT_PUBLIC_POSTHOG_HOST`
- **Payment Gateways:** `JAZZCASH_MERCHANT_ID`, `JAZZCASH_PASSWORD`, `JAZZCASH_INTEGRETY_SALT`, `JAZZCASH_RETURN_URL`, `EASYPAISA_STORE_ID`, `EASYPAISA_HASH_KEY`, `EASYPAISA_RETURN_URL`, `XPAY_MERCHANT_ID`, `XPAY_MERCHANT_KEY`, `BANK_NAME`, `BANK_ACCOUNT_NAME`, `BANK_ACCOUNT_NUMBER`, `BANK_IBAN`, `BANK_BRANCH`
- **Firebase (Legacy / Activity Feed):** `NEXT_PUBLIC_FIREBASE_API_KEY`, `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`, `NEXT_PUBLIC_FIREBASE_PROJECT_ID`, `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`, `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`, `NEXT_PUBLIC_FIREBASE_APP_ID`, `NEXT_PUBLIC_FIREBASE_DATABASE_URL`, `FIREBASE_ADMIN_PROJECT_ID`, `FIREBASE_ADMIN_CLIENT_EMAIL`, `FIREBASE_ADMIN_PRIVATE_KEY`
- **Enterprise Flags & Limits:** `REQUIRE_ADMIN_APPROVAL`, `FREE_PLAN_FEATURE_LIMITS`, `PROFESSIONAL_PLAN_FEATURE_LIMITS`, `FARM_PLAN_FEATURE_LIMITS`, `ENTERPRISE_PLAN_FEATURE_LIMITS`, and individual module feature flags.

---

## 4. Required Production Variables

A minimum of 18 environment variables are mandatory for deployment:

1. `NODE_ENV=production`
2. `NEXT_PUBLIC_APP_URL=https://dairy.mtkcodex.site`
3. `NEXT_PUBLIC_APP_NAME="MTK Dairy"`
4. `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
5. `CLERK_SECRET_KEY`
6. `CLERK_WEBHOOK_SECRET`
7. `NEXT_PUBLIC_CLERK_SIGN_IN_URL`
8. `NEXT_PUBLIC_CLERK_SIGN_UP_URL`
9. `NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL`
10. `NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL`
11. `NEXT_PUBLIC_SUPABASE_URL`
12. `NEXT_PUBLIC_SUPABASE_ANON_KEY`
13. `SUPABASE_SERVICE_ROLE_KEY`
14. `SUPABASE_DATABASE_URL`
15. `CRON_SECRET`
16. `ENCRYPTION_KEY`
17. `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`
18. `RESEND_API_KEY`, `RESEND_FROM_EMAIL`

---

## 5. Optional Production Variables

- **Payments (JazzCash / EasyPaisa / XPAY):** In production mode, missing merchant credentials fail gracefully with an explicit error rather than silently faking successful payments.
- **Monitoring (Sentry / PostHog):** Completely optional; the Next.js webpack configuration conditionally excludes Sentry wrappers if DSN is not configured.
- **Upstash Redis:** Optional; the middleware and cache layers fall back to in-memory caching without crashing.
- **Groq AI & OpenWeatherMap:** Optional; if omitted, AI predictions and weather widgets display standard graceful offline states.

---

## 6. Deprecated / Unused Variables

- **Firebase Auth (`firebase/auth`):** Identified as completely UNUSED. The platform uses Clerk exclusively for authentication.
- **Legacy Duplicate Names:** `ACCOUNT_HOLDER` and `ACCOUNT_NUMBER` in earlier templates have been unified to `BANK_ACCOUNT_NAME` and `BANK_ACCOUNT_NUMBER` (with fallback support in `bank-transfer.ts`).

---

## 7. Client vs Server Exposure

- **Strict Server-Only Protection:**
  - `SUPABASE_SERVICE_ROLE_KEY` is loaded exclusively inside `src/lib/supabase/server.ts`, which enforces `if (typeof window !== 'undefined') throw new Error('Supabase pool can only be used server-side')`.
  - `CLERK_SECRET_KEY` and `CLERK_WEBHOOK_SECRET` are never referenced in client components.
  - `CLOUDINARY_API_SECRET` is used only in server-side upload routes and for signing upload tokens.
  - `RESEND_API_KEY` is restricted to server actions and background job processors.
- **Client-Safe (`NEXT_PUBLIC_`):**
  - Only non-sensitive public keys (`NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `NEXT_PUBLIC_APP_URL`, `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME`, `NEXT_PUBLIC_POSTHOG_KEY`) are exposed to the browser bundle.

---

## 8. Clerk Authentication Audit

- **Multi-Tenant Model:** Uses Clerk Organizations. Tenant ID maps to `orgId`, tenant slug maps to `orgSlug`.
- **Public Routes:** `/`, `/pricing`, `/about`, `/sign-in`, `/sign-up`, `/api/webhooks(.*)`.
- **Protected Routes:** All `/dashboard/*` and entity APIs enforce both user authentication and active organization membership.
- **Redirects:** Auth redirects properly target `https://dairy.mtkcodex.site`.

---

## 9. Supabase / Database Audit

- **Primary Database:** PostgreSQL hosted on Supabase with Drizzle ORM.
- **Connection Pooling:** Server queries utilize `SUPABASE_DATABASE_URL` with connection pooling (`max: 20`, `idle_timeout: 20`, `connect_timeout: 10`).
- **Tenant Isolation:** All database tables enforce `tenantId` columns and queries explicitly filter by `context.tenantId`.

---

## 10. Cloudinary / Storage Audit

- **Upload Endpoint:** `/api/upload` enforces Clerk authentication and file size limits (5MB max for images/payment slips, 10MB for documents).
- **Direct Client Uploads:** `generateSignedUploadParams` performs server-side signature generation using `CLOUDINARY_API_SECRET`. The secret is never exposed.

---

## 11. Resend Email Audit

- **Sender Configuration:** Configured to `MTK Dairy <noreply@dairy.mtkcodex.site>`.
- **Templates:** All template links (`/onboarding`, `/animals/${id}`, `/dashboard`, `/unsubscribe`) dynamically resolve against `process.env.NEXT_PUBLIC_APP_URL`.
- **Production Prerequisite:** Domain verification (DKIM, SPF, CNAME records) for `dairy.mtkcodex.site` must be active in the Resend console.

---

## 12. Sentry Audit

- **Configuration:** Handled via `sentry.client.config.ts` and `src/lib/sentry.ts`.
- **Dynamic Gating:** In `next.config.ts`, `withSentryConfig` only runs if `SENTRY_DSN` or `NEXT_PUBLIC_SENTRY_DSN` is present. Development builds explicitly omit Sentry to conserve memory.

---

## 13. Payment Environment Audit

| Provider          | Required Variables                                                                            | Server-Only? | Sandbox/Production Status                        | Current Behavior                           |
| :---------------- | :-------------------------------------------------------------------------------------------- | :----------- | :----------------------------------------------- | :----------------------------------------- |
| **JazzCash**      | `JAZZCASH_MERCHANT_ID`, `JAZZCASH_PASSWORD`, `JAZZCASH_INTEGRETY_SALT`, `JAZZCASH_RETURN_URL` | Yes          | Sandbox Simulator in Dev; Safe rejection in Prod | Throws error in production if unconfigured |
| **EasyPaisa**     | `EASYPAISA_STORE_ID`, `EASYPAISA_HASH_KEY`, `EASYPAISA_RETURN_URL`                            | Yes          | Sandbox Simulator in Dev; Safe rejection in Prod | Throws error in production if unconfigured |
| **Stripe**        | Stripe SDK integration / Webhook secret                                                       | Yes          | Production-ready abstraction                     | Checkout session generation                |
| **Bank Transfer** | `BANK_NAME`, `BANK_ACCOUNT_NAME`, `BANK_ACCOUNT_NUMBER`, `BANK_IBAN`, `BANK_BRANCH`           | Yes          | Production Active                                | Manual receipt upload with manual review   |

---

## 14. Firebase Audit

- **Firebase Admin (`adminDb`):** OPTIONAL. Used for dual-write data reconciliation during migration and Firestore activity logs.
- **Firebase Auth:** UNUSED / DEPRECATED. Authentication is handled by Clerk.
- **Firebase Realtime Database:** OPTIONAL. Primarily utilized for legacy real-time milk logging; superseded by Supabase Realtime in `src/lib/supabase/realtime.ts`.
- **Firebase Storage:** OPTIONAL. Fallback storage bucket for background worker reports.

---

## 15. Cron Configuration Audit

- **Routes:**
  - `/api/cron/predictions`
  - `/api/cron/reminders`
  - `/api/migration/schedule`
- **Security Check:**
  - All routes enforce `Authorization: Bearer <CRON_SECRET>`.
  - Requests without the matching secret return HTTP 401 Unauthorized immediately.
  - Vercel Cron specification exists in `vercel.json` for migration schedule; `/api/cron/predictions` and `/api/cron/reminders` should be added to `vercel.json` upon scheduling final job intervals.

---

## 16. CORS & Header Security Audit

- **CORS Allow Origin:**
  - Production: `process.env.NEXT_PUBLIC_APP_URL || 'https://dairy.mtkcodex.site'`
  - Development: `*`
- **Security Headers:**
  - `Content-Security-Policy`: Restricts scripts, frames, and connections to trusted origins (Clerk, Supabase, Cloudinary, Sentry, PostHog).
  - `Strict-Transport-Security`: `max-age=63072000; includeSubDomains; preload`
  - `X-Frame-Options`: `DENY`
  - `X-Content-Type-Options`: `nosniff`
  - `Referrer-Policy`: `strict-origin-when-cross-origin`
- **CSRF Protection:** State-changing methods (`POST`, `PUT`, `PATCH`, `DELETE`) verified via HttpOnly cookies and constant-time token comparison (`src/lib/csrf.ts`).

---

## 17. Security Configuration & Secret Hygiene

- **Git Repositories:** Confirmed zero committed secrets or live `.env` files.
- **Git Ignore:** Verified `.env*` is ignored with explicit exemptions only for `.env.example`.
- **Placeholders:** `.env.example` and `.env.production.example` sanitized to contain safe, generic placeholders only.

---

## 18. Changes Made in Phase 5.2

1. `src/lib/utils/tenant.ts`: Set base URL default to `https://dairy.mtkcodex.site` and sanitized URL formatting.
2. `src/middleware.ts`: Added `subdomain !== 'dairy'` check to prevent recursive redirect on apex domain.
3. `src/app/(dashboard)/settings/domain/page.tsx`: Replaced hardcoded `maliktechdairy.com` with `dairy.mtkcodex.site` and configurable support email.
4. `src/components/admin/AdminDashboard.tsx`: Fixed tenant URL display to `.dairy.mtkcodex.site`.
5. `src/components/onboarding/OnboardingWizard.tsx`: Fixed subdomain display to `.dairy.mtkcodex.site`.
6. `src/lib/openapi.ts`: Updated production API server URL to `https://dairy.mtkcodex.site` and support contact.
7. `src/lib/queue.ts`: Updated default email from address to `noreply@dairy.mtkcodex.site`.
8. `src/app/api/migration/schedule/route.ts`: Enforced `CRON_SECRET` validation supporting Bearer auth and `x-cron-secret`.
9. `src/lib/payments/bank-transfer.ts`: Added backward-compatible fallback for bank account environment variables.
10. `src/lib/payments/provider-registry.ts`: Added safe fail-closed behavior in production for unconfigured payment gateways.
11. `src/lib/__tests__/utils/tenant.test.ts` & `src/lib/utils/__tests__/tenant.test.ts`: Updated test expectations for `dairy.mtkcodex.site`.
12. `.env.example` & `.env.production.example`: Fully modernized, structured into 12 sections with safe placeholders.
13. Created `docs/PRODUCTION-ENVIRONMENT-MATRIX.md`.

---

## 19. Quality Gate Results

- **Unit & Integration Tests:**
  - Test Suites: 26 passed, 26 total
  - Tests: 317 passed, 317 total
  - Snapshots: 0 total
  - Time: ~24.5s
- **Security Regression Tests:** PASSED (`src/lib/__tests__/security-regression.test.ts`)
- **Sanitization Tests:** PASSED (`src/lib/__tests__/sanitization.test.ts`)
- **Payment Registry Tests:** PASSED (`src/lib/payments/__tests__/payment-registry.test.ts`)

---

## 20. Remaining Production Blockers

Before initiating deployment to the production server:

1. **Third-Party Dashboard Configuration:**
   - **Clerk:** Verify production instance is linked to `dairy.mtkcodex.site` and webhook endpoint `https://dairy.mtkcodex.site/api/webhooks/clerk` is active.
   - **Resend:** Domain `dairy.mtkcodex.site` DNS records (DKIM, SPF) must be verified in the Resend console.
   - **Cloudinary:** Production cloud credentials must be created and added to the host provider environment variables.
   - **Supabase:** Apply any pending migrations to the production PostgreSQL instance.
2. **Environment Variable Provisioning:** Populate the 18 required variables into the production hosting platform (e.g. Vercel).

---

## 21. Scope for Phase 5.3

Phase 5.3 will focus on:

- Production Deployment Pipeline & Hosting Configuration
- Vercel Cron configuration alignment in `vercel.json` for predictions and reminders
- Smoke testing deployment builds on staging/preview environments
- Live health check verification on `https://dairy.mtkcodex.site/api/system/health`
