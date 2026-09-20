# MTK DAIRY — SECURITY FORENSIC AUDIT

## 2026-09-20 — Supabase MCP + Code Verified

---

## 1. RLS POLICY SECURITY CLASSIFICATION

### 🔴 CRITICAL — Open SELECT (qual = `true`)

Any Supabase-authenticated user can read ALL rows from ALL tenants:

| Table              | Policy                         | Roles  | Risk Level          |
| ------------------ | ------------------------------ | ------ | ------------------- |
| animals            | animals_read_policy            | public | **CRITICAL**        |
| expenses           | expenses_read_policy           | public | **CRITICAL**        |
| sales              | sales_read_policy              | public | **CRITICAL**        |
| milk_logs          | milk_logs_read_policy          | public | **CRITICAL**        |
| health_records     | health_records_read_policy     | public | **CRITICAL**        |
| feed_logs          | feed_logs_read_policy          | public | **HIGH**            |
| vaccinations       | vaccinations_read_policy       | public | **HIGH**            |
| medicine_inventory | medicine_inventory_read_policy | public | **HIGH**            |
| medicine_logs      | medicine_logs_read_policy      | public | **HIGH**            |
| weather_data       | weather_data_read_policy       | public | **MEDIUM**          |
| assets             | assets_read_policy             | public | **HIGH**            |
| feature_flags      | read access                    | public | **LOW** (by design) |

### Mitigating Factor

The application uses `SUPABASE_SERVICE_ROLE_KEY` for all server-side queries, which bypasses RLS entirely. Tenant isolation is enforced in application code via `getTenantContext()` → service layer → Drizzle queries with `.where(eq(table.tenantId, tenantId))`.

### Residual Risk

- Client-side Supabase (anon key) is not used for data queries — but the anon key IS exposed in `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- If any developer uses `createBrowserSupabaseClient()` with the anon key for queries, ALL data becomes readable
- A defense-in-depth failure: one layer of protection instead of two

### Recommended Fix

Replace all `true` SELECT policies with tenant-scoped variants:

```sql
CREATE POLICY "animals_read_tenant" ON animals
FOR SELECT USING (user_is_member_of_tenant(tenant_id::uuid));
```

---

## 2. AUTHENTICATION AUDIT

| Check                       | Status      | Evidence                               |
| --------------------------- | ----------- | -------------------------------------- |
| Clerk middleware present    | ✅ PASS     | `src/middleware.ts`                    |
| Public routes defined       | ✅ PASS     | 10 public route patterns               |
| Auth-only routes defined    | ✅ PASS     | apply, onboarding, admin               |
| Org-required routes defined | ✅ PASS     | dashboard, animals, milk, etc.         |
| 401 for unauthenticated API | ✅ PASS     | Code verified                          |
| 403 for no-org API          | ✅ PASS     | Code verified                          |
| **Production keys**         | ❌ **FAIL** | `pk_test_` key in production HTML      |
| Webhook verification        | ⚠️ PARTIAL  | Svix library present, endpoint exists  |
| Firebase Auth usage         | ⚠️ LEGACY   | Firebase SDK in deps, not primary auth |

---

## 3. IDOR / BROKEN ACCESS CONTROL

### API Pattern Analysis

The animals API (representative pattern):

1. ✅ `auth()` → userId check
2. ✅ `getTenantContext()` → tenantId extraction from Clerk
3. ✅ Service layer receives `tenantContext` object
4. ✅ Service queries filter by `tenantId`

### Potential IDOR Vectors

- `/api/animals/[id]` — If the service fetches by ID without tenant constraint, IDOR possible
- `/api/milk/[id]` — Same risk
- `/api/health/[id]` — Same risk
- Bulk import/export — If IDs in request body aren't validated against tenant

### Status

WITHOUT inspecting every `[id]` route handler and corresponding service method, IDOR status is **NOT FULLY VERIFIED**.

---

## 4. CSP ANALYSIS

| Directive                 | Value                                                                                        | Assessment                            |
| ------------------------- | -------------------------------------------------------------------------------------------- | ------------------------------------- |
| default-src               | 'self'                                                                                       | ✅                                    |
| script-src                | 'self' 'unsafe-eval' 'unsafe-inline' + Clerk + Sentry + PostHog + Cloudflare                 | ⚠️ unsafe-eval required by frameworks |
| style-src                 | 'self' 'unsafe-inline' + Google Fonts                                                        | ⚠️ unsafe-inline needed for CSS-in-JS |
| img-src                   | 'self' data: blob: + Cloudinary + Supabase + Clerk + Firebase + Google + OpenWeather         | ✅ Scoped                             |
| connect-src               | 'self' + Clerk + Supabase + Firebase + Sentry + PostHog + Cloudinary + Upstash + OpenWeather | ✅ All legitimate                     |
| frame-ancestors           | 'none'                                                                                       | ✅ Clickjacking protection            |
| object-src                | 'none'                                                                                       | ✅                                    |
| base-uri                  | 'self'                                                                                       | ✅                                    |
| form-action               | 'self'                                                                                       | ✅                                    |
| upgrade-insecure-requests | Production only                                                                              | ✅                                    |

### Concerns

- `unsafe-eval` is required by Clerk SDK and Next.js dev mode. In production, investigate if it can be removed.
- `unsafe-inline` is required for styled-components/Tailwind. Consider nonces if possible.
- Firebase domains still in CSP even though it's legacy.

---

## 5. SECRETS AUDIT

### Environment Variable Inventory (from `.env.example`)

| Variable                          | Category   | NEXT_PUBLIC? | Server Secret?             |
| --------------------------------- | ---------- | ------------ | -------------------------- |
| CLERK_SECRET_KEY                  | Auth       | No           | ✅ Critical                |
| CLERK_WEBHOOK_SECRET              | Auth       | No           | ✅ Critical                |
| SUPABASE_SERVICE_ROLE_KEY         | Database   | No           | ✅ Critical                |
| SUPABASE_DATABASE_URL             | Database   | No           | ✅ Critical                |
| CRON_SECRET                       | Security   | No           | ✅ Critical                |
| ENCRYPTION_KEY                    | Security   | No           | ✅ Critical                |
| CLOUDINARY_API_SECRET             | Storage    | No           | ✅ High                    |
| RESEND_API_KEY                    | Email      | No           | ✅ High                    |
| GROQ_API_KEY                      | AI         | No           | ✅ Medium                  |
| JAZZCASH_PASSWORD                 | Payment    | No           | ✅ Critical                |
| JAZZCASH_INTEGRETY_SALT           | Payment    | No           | ✅ Critical                |
| EASYPAISA_HASH_KEY                | Payment    | No           | ✅ Critical                |
| XPAY_MERCHANT_KEY                 | Payment    | No           | ✅ Critical                |
| FIREBASE_ADMIN_PRIVATE_KEY        | Legacy     | No           | ✅ Critical                |
| NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY | Auth       | ✅ Yes       | Public                     |
| NEXT_PUBLIC_SUPABASE_URL          | Database   | ✅ Yes       | Public                     |
| NEXT_PUBLIC_SUPABASE_ANON_KEY     | Database   | ✅ Yes       | Public (RLS protected)     |
| NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME | Storage    | ✅ Yes       | Public                     |
| NEXT_PUBLIC_SENTRY_DSN            | Monitoring | ✅ Yes       | Public                     |
| NEXT_PUBLIC_POSTHOG_KEY           | Analytics  | ✅ Yes       | Public                     |
| NEXT_PUBLIC_OPENWEATHER_API_KEY   | Weather    | ✅ Yes       | ⚠️ Should be server-only   |
| NEXT*PUBLIC_FIREBASE*\*           | Legacy     | ✅ Yes       | Public (Firebase standard) |

### Concerns

- `NEXT_PUBLIC_OPENWEATHER_API_KEY` exposes API key to browser — should be server-only
- Firebase config keys are public by design but increase attack surface
- `WEATHER_SYNC_SECRET` is properly server-only

---

## 6. PAYMENT SECURITY

### Provider Implementation Status

| Provider      | Code Exists | HMAC Verification | Callback Handler                 | Sandbox Tested | Production |
| ------------- | ----------- | ----------------- | -------------------------------- | -------------- | ---------- |
| JazzCash      | ✅          | Code present      | /api/payments/callback/jazzcash  | NOT VERIFIED   | BLOCKED    |
| EasyPaisa     | ✅          | Code present      | /api/payments/callback/easypaisa | NOT VERIFIED   | BLOCKED    |
| XPay          | ✅          | Code present      | /api/payments/callback/xpay      | NOT VERIFIED   | BLOCKED    |
| Bank Transfer | ✅          | N/A (manual)      | N/A                              | NOT VERIFIED   | BLOCKED    |

### Payment Security Concerns

- Callback endpoints are in the public route matcher (correct — callbacks don't have user sessions)
- HMAC signature verification code exists but cannot be verified without merchant credentials
- No idempotency key enforcement visible in payment routes
- No replay protection timestamp validation visible

---

## 7. SECURITY DEFINER FUNCTION ANALYSIS

All SECURITY DEFINER functions have been through search_path fixes (3 migration rounds):

- `fix_function_search_path_security`
- `fix_function_search_paths`
- `fix_function_search_paths_batch_2`
- `fix_remaining_functions_v2`
- `fix_security_definer_views` (2 batches)

**Status**: PARTIAL — Migrations indicate search_path was addressed, but the actual function bodies weren't inspected via MCP to verify `SET search_path = public` is in place.
