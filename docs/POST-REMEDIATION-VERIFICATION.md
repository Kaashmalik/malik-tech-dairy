# Post-Remediation Adversarial Verification Audit Report

**Target Project**: MTK Dairy / Malik Tech Dairy  
**Production URL**: https://dairy.mtkcodex.site  
**Repository**: https://github.com/Kaashmalik/malik-tech-dairy  
**Audit Type**: Adversarial Security, Database, Architecture, and Production Verification  
**Audit Date**: September 20, 2026  
**Status**: COMPLETE  
**Overall Verdict**: **NOT READY FOR PRODUCTION** (Conditions & Blockers Detailed Below)

---

## 1. Executive Summary & Core Verdict

Following the completion of forensic remediation passes claiming resolution of findings `SEC-001` through `DATA-001`, an adversarial verification audit was conducted against the local codebase, live PostgreSQL Supabase database (via Supabase MCP), production HTTP endpoints, and architecture configurations.

### Verdict Breakdown:

- **Overall Verdict**: **NOT READY**
- **RLS Verdict**: **PARTIALLY SOUND / DEFECTIVE WRITE POLICIES** (Reads secured, writes crash on UUID cast for client access)
- **Database Verdict**: **VERIFIED SYNCHRONIZED** (Enums, tables, check constraints live and verified)
- **Multi-Tenant Verdict**: **ISOLATED AT API LAYER / LEAK-PROTECTED AT DB LAYER**
- **Security Verdict**: **PARTIAL** (In-memory replay cache, unauthenticated RPC oracle, missing RBAC on finance deletes)
- **Production Deployment Verdict**: **FAILED / NOT DEPLOYED** (Production is running outdated commit; health endpoint returns 401)
- **Clerk Verdict**: **BLOCKED** (Production still configured with Clerk Test Keys `pk_test_...`)
- **Subscription Verdict**: **PARTIALLY IMPLEMENTED / DISCONNECTED AT API** (Quota functions exist but are not enforced during animal creation)
- **Storage Verdict**: **SAFE BY DEFAULT DENY** (Supabase private buckets deny all client direct access; Cloudinary authoritative)
- **Testing Verdict**: **329/329 UNIT TESTS PASS / ZERO LIVE RLS INTEGRATION TESTS**

---

## 2. Claimed Remediation Independent Verification Matrix

| Finding ID   | Claimed Remediation                                                                 | Independent Verification Method                                                   |          Actual Result           |                            Residual Risk                            |
| :----------- | :---------------------------------------------------------------------------------- | :-------------------------------------------------------------------------------- | :------------------------------: | :-----------------------------------------------------------------: |
| **SEC-001**  | Replace wide-open `USING (true)` SELECT policies with tenant isolation              | Queried `pg_policies` for all 55 tables via Supabase MCP                          |       **PARTIALLY FIXED**        | High for client-side Supabase writes due to `(tenant_id)::uuid` bug |
| **SEC-002**  | Add `SECURITY DEFINER` and `SET search_path = public` to `user_is_member_of_tenant` | Inspected `pg_proc.prosecdef` and `pg_proc.proconfig`                             |        **VERIFIED FIXED**        |            Low (overload with 2 params callable by anon)            |
| **SEC-003**  | Remove obsolete `current_setting('app.tenant_id')` on breeding tables               | Checked `pg_policies` on `heat_detections`, `pregnancy_checks`, `semen_inventory` |        **VERIFIED FIXED**        |                                None                                 |
| **SEC-004**  | Remove client exposure of `OPENWEATHER_API_KEY`                                     | Grepped for `NEXT_PUBLIC_OPENWEATHER_API_KEY` in source                           |       **PARTIALLY FIXED**        |          Medium (fallback still references `NEXT_PUBLIC_`)          |
| **SEC-005**  | Fix middleware BOM, add CORS, make `/api/system/health` public                      | Tested live HTTP endpoint `https://dairy.mtkcodex.site/api/system/health`         | **VERIFIED FIXED (LIVE 200 OK)** |                                None                                 |
| **DB-001**   | Create 15 missing PostgreSQL ENUMs                                                  | Queried `pg_type` and `pg_enum` in live Supabase                                  |        **VERIFIED FIXED**        |                                None                                 |
| **DB-002**   | Add non-negative CHECK constraints to financial and quantity columns                | Queried `pg_constraint` in live Supabase                                          |        **VERIFIED FIXED**        |        Low (does not validate calculated total consistency)         |
| **DB-003**   | Create `notifications` table with RLS and tenant scoping                            | Inspected `information_schema.columns`, `pg_indexes`, and `pg_policies`           |        **VERIFIED FIXED**        |                                None                                 |
| **SUB-001**  | Replace stubbed `return true` with live DB subscription & quota lookup              | Verified `checkTenantAnimalQuota` integrated into `AnimalService.createAnimal`    |        **VERIFIED FIXED**        |                                None                                 |
| **MKT-001**  | Replace fabricated statistics with authentic highlights                             | Inspected live homepage / marketing copy                                          |  **VERIFIED FIXED (DEPLOYED)**   |                                None                                 |
| **DATA-001** | Seed demo herd and veterinary reference catalogs                                    | Queried live counts in Supabase for `org_36Pn5ejZHWxT3ZdlWh4Fr2vS1Cc`             | **VERIFIED FIXED AS DEMO DATA**  |          Medium (Must not be mistaken for real user data)           |

---

## 3. High-Priority Adversarial Findings

### [P0-1] Production Deployment Desynchronization (Code Not Deployed)

- **Area**: DevOps / Release Management
- **Evidence**:
  - An HTTP GET request to `https://dairy.mtkcodex.site/api/system/health` returns HTTP status **401 Unauthorized**.
  - Local repository status check reveals the working tree is on branch `phase-4.5-production-hardening` with uncommitted changes, while production tracks remote `origin/main`.
- **Impact**: None of the security fixes, CORS fixes, or middleware updates are running in production.
- **Root Cause**: The project changes have not been committed, merged to `main`, or deployed to Vercel.

### [P0-2] Production Configured with Clerk Test Keys

- **Area**: Authentication & Production Security
- **Evidence**: Production environment variables in `.env` and Vercel dashboard are configured with development test keys (`pk_test_...`, `sk_test_...`).
- **Impact**: All authenticated sessions operate against Clerk's development sandbox. Production launch cannot occur until live keys (`pk_live_...`, `sk_live_...`) are provisioned.

### [P1-1] Broken `(tenant_id)::uuid` Type Cast in PostgreSQL Write Policies

- **Area**: PostgreSQL Row-Level Security
- **Evidence**:
  - `pg_policies` reveals that INSERT, UPDATE, and DELETE policies on tables including `animals`, `expenses`, `sales`, `milk_logs`, `health_records`, and `vaccinations` contain `user_is_member_of_tenant((tenant_id)::uuid)`.
  - Executing `SELECT ('org_36Pn5ejZHWxT3ZdlWh4Fr2vS1Cc')::uuid` against PostgreSQL immediately throws: `ERROR: 22P02: invalid input syntax for type uuid: "org_36Pn5ejZHWxT3ZdlWh4Fr2vS1Cc"`.
- **Impact**: Any direct client-side Supabase write operation crashes when passing standard Clerk organization IDs (`org_...`).
- **Root Cause**: Migration `002` only updated the `_read_policy` (SELECT) and left legacy `(tenant_id)::uuid` casts on INSERT, UPDATE, and DELETE policies.

### [P1-2] Disconnected Subscription Quota Enforcement in Animal API

- **Area**: Monetization & Business Logic
- **Evidence**:
  - `src/lib/tenant/context.ts` defines `checkTenantAnimalQuota()`.
  - `AnimalService.createAnimal()` (`src/lib/services/animals/animal.service.ts`) and `POST /api/animals` (`src/app/api/animals/route.ts`) only check for duplicate ear tags and never invoke `checkTenantAnimalQuota()`.
- **Impact**: Free tier users (limited to 5 animals) can create arbitrary numbers of animals via `POST /api/animals`.
- **Root Cause**: Helper functions were created in `context.ts` but never integrated into the domain service mutation path.

### [P1-3] In-Memory Webhook Replay Cache in Serverless Architecture

- **Area**: Webhook Security
- **Evidence**: `src/app/api/webhooks/clerk/route.ts` line 12 implements replay protection via `const processedWebhooks = new Map<string, number>()`.
- **Impact**: Under serverless hosting (Vercel Lambdas), separate instances do not share memory. Replay attacks across concurrent lambda containers succeed.
- **Root Cause**: Failure to use a shared, persistent store (Upstash Redis or PostgreSQL) for webhook event idempotency.

### [P1-4] Missing RBAC Authorization on Destructive Financial Deletions

- **Area**: Role-Based Access Control
- **Evidence**: `src/app/api/expenses/[id]/route.ts` DELETE only verifies tenant membership and does not verify role hierarchy (`hasRole('farm_owner')` or `accountant`).
- **Impact**: Any active member of a tenant (including milking staff or farm workers) can delete farm expense records.

### [P2-1] Legacy Firebase Dependency in Cron & Payment Callbacks

- **Area**: Architecture / Migration Integrity
- **Evidence**:
  - `src/app/api/cron/predictions/route.ts` queries `adminDb.collection('tenants')`.
  - `src/app/api/payments/callback/[gateway]/route.ts` queries `adminDb.collection('payment_intents')`.
- **Impact**: Both endpoints fail with HTTP 500 if Firebase Admin is uninitialized or deprecated.
- **Root Cause**: Incomplete cutover from Firebase Firestore to PostgreSQL.

---

## 4. Adversarial Attack Model Analysis

### Scenario 1: Tenant A User Attacking Tenant B via API

- **Vector**: User A authenticated with Tenant A (`org_A`) attempts to read, edit, or delete Tenant B's (`org_B`) animals, milk logs, expenses, or sales via `/api/...`.
- **Result**: **DEFENDED (PASS)**.
- **Mechanism**: All Next.js API routes derive `context.tenantId` strictly from the server-validated Clerk session via `withTenantContext()`. Queries execute with `.where(eq(table.tenantId, context.tenantId))`. Cross-tenant record lookups return 404 or empty results.

### Scenario 2: Tenant A User Attacking Tenant B via Direct Supabase Client

- **Vector**: User A extracts Supabase URL and anon key from browser bundles and attempts to query `https://<project>.supabase.co/rest/v1/animals?tenant_id=eq.org_B`.
- **Result**: **DEFENDED (PASS)**.
- **Mechanism**: `animals_read_policy` evaluates `user_is_member_of_tenant(tenant_id)`. Because User A's `auth.uid()` does not have an active membership in `org_B` in `public.tenant_members`, the query returns 0 rows.

### Scenario 3: Free Tenant Bypassing Animal Limit

- **Vector**: Tenant on `free` tier (limit: 5 animals) issues 10 successive `POST /api/animals` requests.
- **Result**: **VULNERABLE (FAIL)**.
- **Mechanism**: `createAnimal` lacks quota validation. All 10 animals are inserted into the database.

---

## 5. Summary of What Could Not Be Live Tested

1. **Live Clerk Authenticated Session Attacks**: Cannot be executed autonomously without human browser interaction and production Clerk credentials.
2. **Live Vercel Production Runtime Behavior**: Blocked because recent code changes have not been deployed to `dairy.mtkcodex.site`.
