# Post-Remediation Adversarial Findings Register

**Audit Project**: MTK Dairy / Malik Tech Dairy  
**Audit Date**: September 20, 2026  
**Total Identified Findings**: 11  
**Severity Breakdown**:

- **P0 (Immediate Production Blocker)**: 2
- **P1 (Serious)**: 4
- **P2 (Important)**: 3
- **P3 (Enhancement)**: 2
- **P4 (Cleanup)**: 0

---

## Findings Inventory

### [FINDING-P0-01] Production Code Stale & Undeployed

- **Severity**: **P0** (Production Blocker)
- **Area**: Release Engineering / DevOps
- **Evidence**:
  - `curl -I https://dairy.mtkcodex.site/api/system/health` returns `HTTP/2 401 Unauthorized`.
  - Local repository state: `git status` shows uncommitted changes on branch `phase-4.5-production-hardening`; production tracks remote `origin/main`.
- **Impact**: All remediation fixes (BOM removal, public health route, CORS headers, RLS migration scripts) are absent from the live production site.
- **Root Cause**: Deployment process requires manual commit, PR merge to `main`, and Vercel build trigger.
- **Recommended Fix**: Commit clean workspace, merge branch `phase-4.5-production-hardening` into `main`, and verify successful deployment on Vercel.
- **Verification**: Check that `https://dairy.mtkcodex.site/api/system/health` returns `HTTP 200 OK` with JSON status.

---

### [FINDING-P0-02] Production Configured with Clerk Development Test Keys

- **Severity**: **P0** (Production Blocker)
- **Area**: Identity & Authentication
- **Evidence**: Production environment variables configure Clerk with `pk_test_...` and `sk_test_...`.
- **Impact**: System operates against Clerk's development environment. Real users, live billing, and production security SLAs cannot be supported.
- **Root Cause**: Live production instance has not been provisioned in Clerk dashboard.
- **Recommended Fix**: Create production Clerk instance, obtain `pk_live_...` and `sk_live_...`, set domain to `dairy.mtkcodex.site`, and configure keys in Vercel project settings.
- **Verification**: Confirm Clerk publishable key in production HTML begins with `pk_live_`.

---

### [FINDING-P1-01] Broken `(tenant_id)::uuid` Type Cast in PostgreSQL Write Policies

- **Severity**: **P1** (Serious)
- **Area**: Database / Row-Level Security
- **Evidence**:
  - `pg_policies` shows `animals_insert_policy`, `animals_update_policy`, `animals_delete_policy`, and 11 other tables contain `user_is_member_of_tenant((tenant_id)::uuid)`.
  - Testing `SELECT ('org_36Pn5ejZHWxT3ZdlWh4Fr2vS1Cc')::uuid` throws `ERROR 22P02: invalid input syntax for type uuid`.
- **Impact**: Any direct client Supabase write operation crashes on valid Clerk organization IDs (`org_...`).
- **Root Cause**: Migration 002 only updated SELECT policies and left legacy UUID casts on INSERT/UPDATE/DELETE.
- **Recommended Fix**: Apply migration recreating all write policies to pass `tenant_id` as text: `user_is_member_of_tenant(tenant_id)`.
- **Verification**: Run `INSERT` and `UPDATE` as an authenticated user with text `tenant_id` without SQL error.

---

### [FINDING-P1-02] Disconnected Animal Quota Gate in Animal Creation Pipeline

- **Severity**: **P1** (Serious)
- **Area**: Monetization & Subscription Enforcement
- **Evidence**: `src/lib/tenant/context.ts` defines `checkTenantAnimalQuota()`, but `AnimalService.createAnimal()` in `src/lib/services/animals/animal.service.ts` never calls it.
- **Impact**: Tenants on the Free plan (limit: 5 animals) can create unlimited animals via `POST /api/animals`.
- **Root Cause**: Quota helper was implemented in isolation without connecting it to the service layer.
- **Recommended Fix**: Add quota validation in `AnimalService.createAnimal()`:
  ```typescript
  const quota = await checkTenantAnimalQuota(ctx.tenantId);
  if (!quota.allowed) {
    throw new Error(
      `QUOTA_EXCEEDED: You have reached your limit of ${quota.limit} animals. Please upgrade your plan.`
    );
  }
  ```
- **Verification**: Test creating 6th animal on a free tier tenant and confirm HTTP 403 / Error response.

---

### [FINDING-P1-03] In-Memory Webhook Replay Protection in Serverless Lambdas

- **Severity**: **P1** (Serious)
- **Area**: Webhook Security
- **Evidence**: `src/app/api/webhooks/clerk/route.ts` line 12 uses `const processedWebhooks = new Map<string, number>()`.
- **Impact**: Memory is isolated per lambda instance and lost on cold start. An attacker can replay webhook payloads across separate lambda containers.
- **Root Cause**: In-memory caching pattern copied from long-running Node servers into serverless environment.
- **Recommended Fix**: Store processed webhook IDs in Upstash Redis with a 5-minute TTL (`SET webhook:<id> 1 EX 300 NX`), or insert into a PostgreSQL `processed_webhooks` table with unique constraint.
- **Verification**: Replay webhook payload against concurrent endpoints and verify duplicate rejection.

---

### [FINDING-P1-04] Missing RBAC Validation on Destructive Financial Deletions

- **Severity**: **P1** (Serious)
- **Area**: Role-Based Access Control
- **Evidence**: `src/app/api/expenses/[id]/route.ts` DELETE only verifies tenant membership and does not check `context.userRole`.
- **Impact**: Any farm employee with basic member access can delete farm expense records.
- **Root Cause**: Lack of permission guard on DELETE handler.
- **Recommended Fix**: Add role check:
  ```typescript
  if (!['farm_owner', 'super_admin', 'accountant'].includes(context.userRole)) {
    return errorResponse(
      new ForbiddenError('Only farm owners and accountants can delete expenses')
    );
  }
  ```
- **Verification**: Send DELETE request with `org:member` / `farm_manager` role and verify HTTP 403.

---

### [FINDING-P2-01] Firebase Firestore Dependency in Payment Callbacks

- **Severity**: **P2** (Important)
- **Area**: Architecture / Migration Debt
- **Evidence**: `src/app/api/payments/callback/[gateway]/route.ts` queries `adminDb.collection('payment_intents')`.
- **Impact**: Payment confirmation crashes if Firebase is unavailable or deprecated.
- **Root Cause**: Payment initiation was written against Firestore during early phases and never cut over to PostgreSQL.
- **Recommended Fix**: Store `payment_intents` in PostgreSQL `payments` table with `status = 'pending'`, and look up via Drizzle in callback.
- **Verification**: Process test payment callback with Firebase disabled.

---

### [FINDING-P2-02] Firebase Firestore Dependency in Prediction Cron

- **Severity**: **P2** (Important)
- **Area**: Architecture / Migration Debt
- **Evidence**: `src/app/api/cron/predictions/route.ts` queries `adminDb.collection('tenants')`.
- **Impact**: Predictions cron fails with 500 error if Firebase Admin is uninitialized.
- **Root Cause**: Cron endpoint still references legacy Firestore collection.
- **Recommended Fix**: Query `db.select({ id: tenants.id }).from(tenants)` from PostgreSQL Drizzle.
- **Verification**: Invoke cron endpoint with Bearer CRON_SECRET and verify tenant iteration from PostgreSQL.

---

### [FINDING-P2-03] Public RPC Exposure of `user_is_member_of_tenant(text, text)`

- **Severity**: **P2** (Important)
- **Area**: Information Disclosure / Database Security
- **Evidence**: `user_is_member_of_tenant(p_user_id text, p_tenant_id text)` has `EXECUTE` granted to `PUBLIC` and `anon`.
- **Impact**: Unauthenticated actors can probe whether arbitrary user IDs belong to arbitrary tenant IDs via Supabase REST RPC.
- **Root Cause**: Default PostgreSQL grant on function creation without revoking `PUBLIC` execute.
- **Recommended Fix**:
  ```sql
  REVOKE EXECUTE ON FUNCTION public.user_is_member_of_tenant(text, text) FROM PUBLIC, anon;
  ```
- **Verification**: Call `/rest/v1/rpc/user_is_member_of_tenant` with anon key and verify permission denied.

---

### [FINDING-P3-01] `NEXT_PUBLIC_OPENWEATHER_API_KEY` Fallback in Weather Service

- **Severity**: **P3** (Enhancement)
- **Area**: Secret Management
- **Evidence**: `src/lib/weather/weather-service.ts` line 301 contains: `process.env.OPENWEATHER_API_KEY || process.env.NEXT_PUBLIC_OPENWEATHER_API_KEY || ''`.
- **Impact**: If `NEXT_PUBLIC_OPENWEATHER_API_KEY` is accidentally set in `.env` or Vercel, Next.js bundles the API key into client-side JavaScript.
- **Root Cause**: Backward compatibility fallback left in code.
- **Recommended Fix**: Remove `process.env.NEXT_PUBLIC_OPENWEATHER_API_KEY` reference entirely; strictly use server-only `process.env.OPENWEATHER_API_KEY`.
- **Verification**: Inspect client bundles for OpenWeather key strings.

---

### [FINDING-P3-02] TypeScript Definition Drift on `medicineFormEnum`

- **Severity**: **P3** (Enhancement)
- **Area**: Type Safety
- **Evidence**: `src/db/diseases-medicines-schema.ts` lacks `'solution'` and `'oral_suspension'`, which are present in the live PostgreSQL `medicine_form` enum.
- **Impact**: TypeScript compiler will reject inserts using `solution` or `oral_suspension` when using Drizzle typed schema.
- **Root Cause**: PostgreSQL enum was altered in database without updating TypeScript schema file.
- **Recommended Fix**: Add `'solution'` and `'oral_suspension'` to `medicineFormEnum` in `src/db/diseases-medicines-schema.ts`.
- **Verification**: Compile with `npx tsc --noEmit`.
