# Production Environment Matrix — Malik Tech Dairy

**Target Production Domain:** `https://dairy.mtkcodex.site`  
**Application Platform:** Next.js 15 (App Router), PostgreSQL (Supabase), Clerk Authentication  
**Audit Phase:** Phase 5.2 — Production Environment Audit  
**Date:** September 2026

---

## A. Production Environment Overview

The Malik Tech Dairy platform operates on the authoritative production domain:
`https://dairy.mtkcodex.site`

- **Root & Marketing Domain:** `https://dairy.mtkcodex.site`
- **Tenant Subdomain Structure:** `https://{tenant-slug}.dairy.mtkcodex.site`
- **Protected Organization Routes:** `/dashboard/*`, `/animals/*`, `/milk/*`, `/health/*`, `/reports/*`, etc.
- **Super-Admin Console:** `/admin/*`, `/super-admin/*`
- **Public Routes:** `/`, `/pricing`, `/about`, `/sign-in`, `/sign-up`, `/apply`, `/onboarding`, `/api/webhooks/*`

---

## B. Complete Environment Variable Matrix

| Variable Name                              | Required?           | Client/Server | Service     | Production Purpose                                             | Example Placeholder                                                                           | Source References                                                          |
| :----------------------------------------- | :------------------ | :------------ | :---------- | :------------------------------------------------------------- | :-------------------------------------------------------------------------------------------- | :------------------------------------------------------------------------- |
| `NODE_ENV`                                 | REQUIRED_PRODUCTION | Server/Client | Next.js     | Runtime environment execution mode                             | `production`                                                                                  | `next.config.ts`, `src/lib/csrf.ts`, etc.                                  |
| `NEXT_PUBLIC_APP_URL`                      | REQUIRED_PRODUCTION | Client/Server | Core        | Base canonical URL for tenant URLs & email links               | `https://dairy.mtkcodex.site`                                                                 | `src/lib/utils/tenant.ts`, `src/lib/emails/templates.ts`, `next.config.ts` |
| `NEXT_PUBLIC_APP_NAME`                     | REQUIRED_PRODUCTION | Client/Server | Core        | Brand name for UI & notification templates                     | `MTK Dairy`                                                                                   | `src/lib/seo/config.ts`, `src/lib/emails/templates.ts`                     |
| `NEXT_PUBLIC_SUPPORT_EMAIL`                | OPTIONAL_PRODUCTION | Client/Server | Support     | Customer-facing support email address                          | `support@dairy.mtkcodex.site`                                                                 | `src/app/(dashboard)/settings/domain/page.tsx`                             |
| `LOG_LEVEL`                                | OPTIONAL_PRODUCTION | Server        | Logging     | Structured logger verbosity (error, warn, info, debug)         | `info`                                                                                        | `src/lib/logger.ts`                                                        |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`        | REQUIRED_PRODUCTION | Client        | Clerk Auth  | Browser initialization for Clerk identity provider             | `pk_live_your_clerk_key`                                                                      | `src/app/layout.tsx`, `src/middleware.ts`                                  |
| `CLERK_SECRET_KEY`                         | REQUIRED_PRODUCTION | Server-Only   | Clerk Auth  | Server-side authentication and session verification            | `sk_live_your_clerk_secret`                                                                   | `@clerk/nextjs/server`, `src/lib/env.ts`                                   |
| `CLERK_WEBHOOK_SECRET`                     | REQUIRED_PRODUCTION | Server-Only   | Clerk Auth  | Svix signature verification for user/org lifecycle webhooks    | `whsec_your_webhook_secret`                                                                   | `src/app/api/webhooks/clerk/route.ts`                                      |
| `NEXT_PUBLIC_CLERK_SIGN_IN_URL`            | REQUIRED_PRODUCTION | Client        | Clerk Auth  | Client redirect path for sign-in                               | `/sign-in`                                                                                    | `src/middleware.ts`                                                        |
| `NEXT_PUBLIC_CLERK_SIGN_UP_URL`            | REQUIRED_PRODUCTION | Client        | Clerk Auth  | Client redirect path for sign-up                               | `/sign-up`                                                                                    | `src/middleware.ts`                                                        |
| `NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL`      | REQUIRED_PRODUCTION | Client        | Clerk Auth  | Client destination after successful authentication             | `/dashboard`                                                                                  | `src/middleware.ts`                                                        |
| `NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL`      | REQUIRED_PRODUCTION | Client        | Clerk Auth  | Client destination after user registration                     | `/apply`                                                                                      | `src/middleware.ts`                                                        |
| `NEXT_PUBLIC_SUPABASE_URL`                 | REQUIRED_PRODUCTION | Client/Server | Supabase    | Supabase Project API endpoint                                  | `https://your-project.supabase.co`                                                            | `src/lib/supabase/client.ts`, `src/lib/supabase/server.ts`                 |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY`            | REQUIRED_PRODUCTION | Client        | Supabase    | Client-side anon key restricted by Row-Level Security          | `eyJhbGciOi...anon_key`                                                                       | `src/lib/supabase/client.ts`                                               |
| `SUPABASE_SERVICE_ROLE_KEY`                | REQUIRED_PRODUCTION | Server-Only   | Supabase    | Privileged administrative bypass key (Server only)             | `eyJhbGciOi...service_key`                                                                    | `src/lib/supabase/server.ts`                                               |
| `SUPABASE_DATABASE_URL`                    | REQUIRED_PRODUCTION | Server-Only   | PostgreSQL  | Pooled connection string for Drizzle ORM                       | `postgresql://postgres.xxx:yyy@aws-0-region.pooler.supabase.com:6543/postgres?pgbouncer=true` | `src/lib/supabase/server.ts`, `drizzle.config.ts`                          |
| `CRON_SECRET`                              | REQUIRED_PRODUCTION | Server-Only   | Security    | Bearer token authenticating Vercel cron endpoints              | `min_32_chars_random_secret`                                                                  | `/api/cron/predictions`, `/api/cron/reminders`, `/api/migration/schedule`  |
| `WEATHER_SYNC_SECRET`                      | OPTIONAL_PRODUCTION | Server-Only   | Weather API | Shared secret authenticating weather sync endpoints            | `min_32_chars_random_secret`                                                                  | `src/app/api/weather/sync/route.ts`                                        |
| `ENCRYPTION_KEY`                           | REQUIRED_PRODUCTION | Server-Only   | AES-256     | 64-hex-char encryption key for sensitive data at rest          | `0123456789abcdef...` (64 chars)                                                              | `src/lib/encryption.ts`                                                    |
| `CLOUDINARY_CLOUD_NAME`                    | REQUIRED_PRODUCTION | Server-Only   | Cloudinary  | Cloudinary tenant account name                                 | `your-cloud-name`                                                                             | `src/lib/cloudinary/index.ts`, `src/app/api/upload/route.ts`               |
| `CLOUDINARY_API_KEY`                       | REQUIRED_PRODUCTION | Server-Only   | Cloudinary  | API access key for signed uploads & deletions                  | `your-api-key`                                                                                | `src/lib/cloudinary/index.ts`, `src/app/api/upload/route.ts`               |
| `CLOUDINARY_API_SECRET`                    | REQUIRED_PRODUCTION | Server-Only   | Cloudinary  | API secret key used for signing upload requests                | `your-api-secret`                                                                             | `src/lib/cloudinary/index.ts`, `src/app/api/upload/route.ts`               |
| `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME`        | REQUIRED_PRODUCTION | Client        | Cloudinary  | Browser-safe cloud name for image URL transformations          | `your-cloud-name`                                                                             | `src/lib/cloudinary/index.ts`, `src/app/api/upload/route.ts`               |
| `RESEND_API_KEY`                           | REQUIRED_PRODUCTION | Server-Only   | Resend      | API key for transactional emails                               | `re_your_api_key`                                                                             | `src/lib/emails/sender.ts`, `src/lib/queue.ts`                             |
| `RESEND_FROM_EMAIL`                        | REQUIRED_PRODUCTION | Server-Only   | Resend      | Default authorized sender address for emails                   | `MTK Dairy <noreply@dairy.mtkcodex.site>`                                                     | `src/lib/emails/sender.ts`, `src/lib/queue.ts`                             |
| `GROQ_API_KEY`                             | OPTIONAL_PRODUCTION | Server-Only   | Groq AI     | LLM inference API key for milk yield predictions               | `gsk_your_groq_key`                                                                           | `src/lib/ai/groq.ts`, `src/lib/ai/prediction.ts`                           |
| `NEXT_PUBLIC_OPENWEATHER_API_KEY`          | OPTIONAL_PRODUCTION | Client/Server | Weather     | API key for localized dairy weather forecasts                  | `your-openweather-key`                                                                        | `src/components/weather/WeatherWidget.tsx`                                 |
| `UPSTASH_REDIS_REST_URL`                   | OPTIONAL_PRODUCTION | Server-Only   | Redis Cache | Upstash Redis REST URL for distributed caching & rate-limiting | `https://your-redis.upstash.io`                                                               | `src/lib/cache/redis-cache.ts`, `src/lib/cache.ts`                         |
| `UPSTASH_REDIS_REST_TOKEN`                 | OPTIONAL_PRODUCTION | Server-Only   | Redis Cache | Upstash Redis REST bearer token                                | `your_upstash_token`                                                                          | `src/lib/cache/redis-cache.ts`, `src/lib/cache.ts`                         |
| `SENTRY_DSN`                               | OPTIONAL_PRODUCTION | Server-Only   | Sentry      | Sentry ingest DSN for server-side error logging                | `https://key@sentry.io/project`                                                               | `src/lib/sentry.ts`, `next.config.ts`                                      |
| `NEXT_PUBLIC_SENTRY_DSN`                   | OPTIONAL_PRODUCTION | Client        | Sentry      | Sentry ingest DSN for browser error logging                    | `https://key@sentry.io/project`                                                               | `sentry.client.config.ts`, `next.config.ts`                                |
| `SENTRY_ORG`                               | OPTIONAL_PRODUCTION | Server-Only   | Sentry      | Sentry organization slug for source maps upload                | `your-org-slug`                                                                               | `next.config.ts`                                                           |
| `SENTRY_PROJECT`                           | OPTIONAL_PRODUCTION | Server-Only   | Sentry      | Sentry project slug for source maps upload                     | `your-project-slug`                                                                           | `next.config.ts`                                                           |
| `SENTRY_AUTH_TOKEN`                        | OPTIONAL_PRODUCTION | Server-Only   | Sentry      | Auth token for Sentry CLI release upload                       | `sntrys_your_token`                                                                           | Sentry release pipeline                                                    |
| `NEXT_PUBLIC_POSTHOG_KEY`                  | OPTIONAL_PRODUCTION | Client        | PostHog     | PostHog product telemetry key                                  | `phc_your_key`                                                                                | `src/components/providers/PostHogProvider.tsx`                             |
| `NEXT_PUBLIC_POSTHOG_HOST`                 | OPTIONAL_PRODUCTION | Client        | PostHog     | PostHog ingestion host URL                                     | `https://us.i.posthog.com`                                                                    | `src/components/providers/PostHogProvider.tsx`                             |
| `JAZZCASH_MERCHANT_ID`                     | OPTIONAL_PRODUCTION | Server-Only   | Payments    | JazzCash merchant account ID                                   | `your_merchant_id`                                                                            | `src/lib/payments/provider-registry.ts`                                    |
| `JAZZCASH_PASSWORD`                        | OPTIONAL_PRODUCTION | Server-Only   | Payments    | JazzCash merchant gateway password                             | `your_password`                                                                               | `src/lib/payments/provider-registry.ts`                                    |
| `JAZZCASH_INTEGRETY_SALT`                  | OPTIONAL_PRODUCTION | Server-Only   | Payments    | JazzCash hash HMAC salt                                        | `your_salt`                                                                                   | `src/lib/payments/provider-registry.ts`                                    |
| `JAZZCASH_RETURN_URL`                      | OPTIONAL_PRODUCTION | Server-Only   | Payments    | Callback return URL for JazzCash redirect                      | `https://dairy.mtkcodex.site/api/payments/callback/jazzcash`                                  | `src/lib/payments/provider-registry.ts`                                    |
| `EASYPAISA_STORE_ID`                       | OPTIONAL_PRODUCTION | Server-Only   | Payments    | EasyPaisa merchant store ID                                    | `your_store_id`                                                                               | `src/lib/payments/provider-registry.ts`                                    |
| `EASYPAISA_HASH_KEY`                       | OPTIONAL_PRODUCTION | Server-Only   | Payments    | EasyPaisa transaction hash secret                              | `your_hash_key`                                                                               | `src/lib/payments/provider-registry.ts`                                    |
| `EASYPAISA_RETURN_URL`                     | OPTIONAL_PRODUCTION | Server-Only   | Payments    | Callback return URL for EasyPaisa redirect                     | `https://dairy.mtkcodex.site/api/payments/callback/easypaisa`                                 | `src/lib/payments/provider-registry.ts`                                    |
| `XPAY_MERCHANT_ID`                         | OPTIONAL_PRODUCTION | Server-Only   | Payments    | XPAY merchant identifier                                       | `your_xpay_id`                                                                                | `src/app/api/payments/callback/[gateway]/route.ts`                         |
| `XPAY_MERCHANT_KEY`                        | OPTIONAL_PRODUCTION | Server-Only   | Payments    | XPAY merchant secret key                                       | `your_xpay_key`                                                                               | `src/app/api/payments/callback/[gateway]/route.ts`                         |
| `BANK_NAME`                                | OPTIONAL_PRODUCTION | Server-Only   | Payments    | Offline bank account institution name                          | `Bank Alfalah`                                                                                | `src/lib/payments/bank-transfer.ts`                                        |
| `BANK_ACCOUNT_NAME`                        | OPTIONAL_PRODUCTION | Server-Only   | Payments    | Offline bank account title                                     | `MTK Dairy Pvt Ltd`                                                                           | `src/lib/payments/bank-transfer.ts`                                        |
| `BANK_ACCOUNT_NUMBER`                      | OPTIONAL_PRODUCTION | Server-Only   | Payments    | Offline bank account number                                    | `1234567890123`                                                                               | `src/lib/payments/bank-transfer.ts`                                        |
| `BANK_IBAN`                                | OPTIONAL_PRODUCTION | Server-Only   | Payments    | Offline bank account international IBAN                        | `PK12ALFH1234567890123456`                                                                    | `src/lib/payments/bank-transfer.ts`                                        |
| `BANK_BRANCH`                              | OPTIONAL_PRODUCTION | Server-Only   | Payments    | Offline bank branch name / city                                | `Main Branch, Lahore`                                                                         | `src/lib/payments/bank-transfer.ts`                                        |
| `NEXT_PUBLIC_FIREBASE_API_KEY`             | OPTIONAL_PRODUCTION | Client        | Firebase    | Realtime activity feed client init                             | `your-firebase-key`                                                                           | `src/lib/firebase/client.ts`                                               |
| `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`         | OPTIONAL_PRODUCTION | Client        | Firebase    | Realtime activity feed auth domain                             | `project.firebaseapp.com`                                                                     | `src/lib/firebase/client.ts`                                               |
| `NEXT_PUBLIC_FIREBASE_PROJECT_ID`          | OPTIONAL_PRODUCTION | Client        | Firebase    | Realtime activity feed project ID                              | `your-project-id`                                                                             | `src/lib/firebase/client.ts`                                               |
| `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`      | OPTIONAL_PRODUCTION | Client        | Firebase    | Storage bucket for worker-generated reports                    | `project.firebasestorage.app`                                                                 | `src/lib/firebase/client.ts`, `src/lib/workers/processors/reports.ts`      |
| `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` | OPTIONAL_PRODUCTION | Client        | Firebase    | Push messaging sender identifier                               | `1234567890`                                                                                  | `src/lib/firebase/client.ts`                                               |
| `NEXT_PUBLIC_FIREBASE_APP_ID`              | OPTIONAL_PRODUCTION | Client        | Firebase    | Firebase App ID                                                | `1:1234567890:web:abcdef`                                                                     | `src/lib/firebase/client.ts`                                               |
| `NEXT_PUBLIC_FIREBASE_DATABASE_URL`        | OPTIONAL_PRODUCTION | Client        | Firebase    | Realtime Database URL                                          | `https://project.firebaseio.com`                                                              | `src/lib/firebase/client.ts`                                               |
| `FIREBASE_ADMIN_PROJECT_ID`                | OPTIONAL_PRODUCTION | Server-Only   | Firebase    | Firebase Admin service account project ID                      | `your-project-id`                                                                             | `src/lib/firebase/admin.ts`                                                |
| `FIREBASE_ADMIN_CLIENT_EMAIL`              | OPTIONAL_PRODUCTION | Server-Only   | Firebase    | Firebase Admin client email                                    | `sa@project.iam.gserviceaccount.com`                                                          | `src/lib/firebase/admin.ts`                                                |
| `FIREBASE_ADMIN_PRIVATE_KEY`               | OPTIONAL_PRODUCTION | Server-Only   | Firebase    | Firebase Admin private RSA key                                 | `-----BEGIN PRIVATE KEY-----\n...`                                                            | `src/lib/firebase/admin.ts`                                                |
| `TWILIO_ACCOUNT_SID`                       | OPTIONAL_PRODUCTION | Server-Only   | SMS         | Twilio Account SID for SMS dispatch                            | `your_account_sid`                                                                            | `src/lib/workers/processors/sms.ts`                                        |
| `TWILIO_AUTH_TOKEN`                        | OPTIONAL_PRODUCTION | Server-Only   | SMS         | Twilio Auth Token for SMS dispatch                             | `your_auth_token`                                                                             | `src/lib/workers/processors/sms.ts`                                        |
| `TWILIO_PHONE_NUMBER`                      | OPTIONAL_PRODUCTION | Server-Only   | SMS         | Twilio origin phone number                                     | `+1234567890`                                                                                 | `src/lib/workers/processors/sms.ts`                                        |
| `REQUIRE_ADMIN_APPROVAL`                   | REQUIRED_PRODUCTION | Server        | Control     | Gate new farm applications behind admin approval               | `true`                                                                                        | `src/lib/env.ts`                                                           |
| `FREE_PLAN_FEATURE_LIMITS`                 | REQUIRED_PRODUCTION | Server        | Control     | Enforce feature gates on Free tier                             | `true`                                                                                        | `src/lib/env.ts`                                                           |
| `PROFESSIONAL_PLAN_FEATURE_LIMITS`         | REQUIRED_PRODUCTION | Server        | Control     | Enforce feature gates on Professional tier                     | `true`                                                                                        | `src/lib/env.ts`                                                           |
| `FARM_PLAN_FEATURE_LIMITS`                 | REQUIRED_PRODUCTION | Server        | Control     | Enforce feature gates on Farm tier                             | `true`                                                                                        | `src/lib/env.ts`                                                           |
| `ENTERPRISE_PLAN_FEATURE_LIMITS`           | REQUIRED_PRODUCTION | Server        | Control     | Enforce feature gates on Enterprise tier                       | `true`                                                                                        | `src/lib/env.ts`                                                           |

---

## C. Minimum Required Production Variables (Strict Checklist)

The platform cannot boot or function securely without the following 17 variables configured:

1. **`NODE_ENV=production`**
2. **`NEXT_PUBLIC_APP_URL=https://dairy.mtkcodex.site`**
3. **`NEXT_PUBLIC_APP_NAME="MTK Dairy"`**
4. **`NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`**
5. **`CLERK_SECRET_KEY`**
6. **`CLERK_WEBHOOK_SECRET`**
7. **`NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in`**
8. **`NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up`**
9. **`NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/dashboard`**
10. **`NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/apply`**
11. **`NEXT_PUBLIC_SUPABASE_URL`**
12. **`NEXT_PUBLIC_SUPABASE_ANON_KEY`**
13. **`SUPABASE_SERVICE_ROLE_KEY`**
14. **`SUPABASE_DATABASE_URL`**
15. **`CRON_SECRET`** (Minimum 32 random characters)
16. **`ENCRYPTION_KEY`** (64 hex characters / 32 bytes)
17. **`CLOUDINARY_CLOUD_NAME`**, **`CLOUDINARY_API_KEY`**, **`CLOUDINARY_API_SECRET`**
18. **`RESEND_API_KEY`** & **`RESEND_FROM_EMAIL`**

---

## D. Optional Variables & Degradation Behavior

- **Payments (JazzCash, EasyPaisa, XPAY):** In production mode, missing credentials will safely fail checkout creation with descriptive errors rather than allowing unauthenticated simulation. Bank transfer remains active via manual slip uploads.
- **Monitoring (Sentry & PostHog):** If omitted, the build completes cleanly with zero runtime penalties; errors log to standard output.
- **Upstash Redis:** If omitted, caching gracefully falls back to in-memory/noop mode, and rate-limiting is handled in middleware memory.
- **Firebase Dual-Write:** If omitted, primary database operations continue unobstructed on Supabase PostgreSQL.

---

## E. Secret Handling & Security Hygiene Rules

1. **Client Isolation:** Never prefix sensitive tokens (`CLERK_SECRET_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `CLOUDINARY_API_SECRET`, `RESEND_API_KEY`, `ENCRYPTION_KEY`, `CRON_SECRET`) with `NEXT_PUBLIC_`.
2. **Git Hygiene:** Local configuration files (`.env`, `.env.local`, `.env.production`) must remain strictly excluded via `.gitignore`.
3. **Server-Side Enforcement:** Server connection modules (`src/lib/supabase/server.ts`, `src/lib/firebase/admin.ts`) explicitly assert `typeof window === 'undefined'` to block client bundle leakage.
4. **No Documentation Secrets:** Real API keys, database connection strings, or personal bank accounts must NEVER be documented in markdown, comments, or commit history.

---

## F. Cron Configuration & Requirements

Endpoints requiring authentication:

1. `/api/cron/predictions` (Triggers AI milk yield forecasting for active herds)
2. `/api/cron/reminders` (Scans vaccination schedules, breeding checks, and feed thresholds)
3. `/api/migration/schedule` (Monitors reconciliation discrepancies)

**Authentication Standard:**  
All cron routes require HTTP Authorization header:

```http
Authorization: Bearer <CRON_SECRET>
```

If `CRON_SECRET` is unset or header does not match, all cron routes return HTTP 401 Unauthorized (`{ "error": "Unauthorized" }`), failing closed.
