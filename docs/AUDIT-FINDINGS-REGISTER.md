# MTK DAIRY — AUDIT FINDINGS REGISTER

## 2026-09-20 — Complete Finding List

---

## P0 — CATASTROPHIC / IMMEDIATE PRODUCTION BLOCKER

### SEC-001: Clerk Development Keys in Production

- **Area**: Authentication
- **Location**: Production HTML, Vercel environment variables
- **Evidence**: `data-clerk-publishable-key="pk_test_..."` and `hardy-manatee-88.clerk.accounts.dev` in production page source
- **Impact**: Production users authenticate against Clerk development environment. Dev environments may be rate-limited, disabled, or have different security properties. User data mixes between dev and prod.
- **Exploit Scenario**: Clerk may disable dev instances; all users lose authentication
- **Root Cause**: Production environment not configured with Clerk production keys
- **Fix**: Set `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` and `CLERK_SECRET_KEY` to production values in Vercel
- **Verification**: Check production HTML source for `pk_live_` prefix

### SEC-002: Open RLS SELECT Policies Allow Cross-Tenant Data Reading

- **Area**: Database Security / Multi-Tenancy
- **Location**: Supabase RLS policies on 12+ tables
- **Evidence**: MCP query shows `qual: "true"` on SELECT policies for animals, expenses, sales, milk_logs, health_records, feed_logs, vaccinations, medicine_inventory, medicine_logs, weather_data, assets
- **Impact**: Any Supabase-authenticated client (including anon key in browser) can read ALL data from ALL tenants
- **Exploit Scenario**: Attacker uses exposed `NEXT_PUBLIC_SUPABASE_ANON_KEY` to query `animals` table directly via Supabase REST API, retrieving all tenants' animal data
- **Root Cause**: RLS policies were likely set to `true` for development convenience and not tightened
- **Fix**: SQL migration replacing `true` with `user_is_member_of_tenant(tenant_id::uuid)` on all SELECT policies
- **Verification**: Attempt cross-tenant SELECT with anon key after fix

### SEC-003: Subscription Enforcement is Placeholder

- **Area**: Business Logic / Quota Enforcement
- **Location**: `src/lib/tenant/context.ts` lines 170-179
- **Evidence**: `checkTenantSubscription()` body contains comment "For now, return true as placeholder" and `return true;`
- **Impact**: All plan limits (animal count, user count, feature access) are bypassed. Any free-tier user can use enterprise features.
- **Exploit Scenario**: User on free plan creates unlimited animals, exceeding plan limits
- **Root Cause**: Feature never implemented beyond stub
- **Fix**: Query subscriptions table, compare plan against requested operation
- **Verification**: Verify free plan user is blocked from exceeding 5 animals

### SEC-004: Marketing Page Displays Fabricated Statistics

- **Area**: Trust / Legal
- **Location**: `src/app/(marketing)/page.tsx` (landing page)
- **Evidence**: Page displays "500+ Active Farms", "50K+ Animals Tracked", "1M+ Milk Logs", "4.9/5 from 127 reviews" — all database tables have 0 rows
- **Impact**: Materially misleading to potential customers. Could constitute false advertising.
- **Exploit Scenario**: Customer signs up based on false social proof, discovers empty system
- **Root Cause**: Marketing copy written aspirationally, never updated to reflect reality
- **Fix**: Replace with honest messaging ("New platform", "Growing community") or make dynamic from DB
- **Verification**: Visual inspection of marketing page

---

## P1 — SERIOUS PRODUCTION RISK

### DB-001: Incompatible RLS Mechanism on 3 Tables

- **Area**: Database / Multi-Tenancy
- **Location**: heat_detections, pregnancy_checks, semen_inventory RLS policies
- **Evidence**: Policies use `current_setting('app.tenant_id', true)` but application never calls `SET app.tenant_id`
- **Impact**: These tables will return empty results for all non-service-role queries
- **Fix**: Replace with `user_is_member_of_tenant()` function
- **Verification**: Query these tables with authenticated client

### DB-002: Zero Supabase Storage Buckets

- **Area**: Storage
- **Location**: Supabase storage
- **Evidence**: `SELECT * FROM storage.buckets` returns empty array via MCP
- **Impact**: If any code attempts Supabase Storage uploads, they will fail
- **Fix**: Create buckets via Supabase dashboard or document Cloudinary as sole storage
- **Verification**: Check storage.buckets count

### DB-003: 15 Drizzle Enums Missing from Database

- **Area**: Database Schema Drift
- **Location**: `src/db/schema.ts` vs actual database
- **Evidence**: disease_category, disease_severity, treatment_outcome, vaccine_type, vaccination_status, protocol_type, feed_type, feed_unit, task_status, task_priority, attendance_status, device_type, device_status, quality_grade, test_status — all in Drizzle schema but NOT in pg_type
- **Impact**: Any INSERT/UPDATE using these enums will fail with "type does not exist"
- **Fix**: SQL migration creating all missing enum types
- **Verification**: Re-query pg_enum after migration

### API-001: Health Endpoint Returns 401

- **Area**: Monitoring / Operations
- **Location**: `/api/system/health`
- **Evidence**: `curl https://dairy.mtkcodex.site/api/system/health` returns HTTP 401
- **Impact**: Uptime monitoring, load balancers, and health checks fail
- **Fix**: Verify the endpoint is in middleware's public routes (it IS listed but may need path matching fix)
- **Verification**: HTTP 200 response without authentication

### AUTH-001: Firebase SDK Legacy

- **Area**: Architecture / Attack Surface
- **Location**: `package.json` (firebase 12.6.0, firebase-admin 13.6.0), `src/lib/firebase/`
- **Evidence**: Firebase client and admin SDKs in dependencies, initialization files exist
- **Impact**: Increased bundle size, additional attack surface, developer confusion about auth provider
- **Fix**: Document Firebase purpose. If only for activity feeds, add clear comments. If unused, remove.
- **Verification**: Check if any runtime code path uses Firebase

### DATA-001: Zero Production Data

- **Area**: Quality Assurance
- **Location**: All 54 public tables
- **Evidence**: MCP `list_tables` shows `rows: 0` for every table
- **Impact**: No end-to-end flow has ever been verified with real data. Unknown behavior at any scale.
- **Fix**: Create seed script with realistic test data, perform manual E2E testing
- **Verification**: Row counts > 0 in core tables after seeding

---

## P2 — IMPORTANT ENGINEERING ISSUE

### ARCH-001: Dual Authentication Architecture

- **Area**: Architecture
- **Evidence**: Both Clerk and Firebase Auth SDKs present
- **Fix**: Document clearly which is authoritative

### ARCH-002: Service Role Bypasses All RLS

- **Area**: Architecture
- **Evidence**: `getSupabaseClient()` uses `SUPABASE_SERVICE_ROLE_KEY`
- **Impact**: All RLS policies are decorative for server-side queries
- **Fix**: Consider using row-level-security aware queries or accept app-level filtering model

### TEST-001: All 329 Tests Are Mocked

- **Area**: Testing
- **Evidence**: No test connects to real Supabase, Clerk, or external service
- **Impact**: Tests verify code structure but not production behavior
- **Fix**: Add integration tests with test Supabase instance

### PERF-001: No Load Testing Evidence

- **Area**: Performance
- **Evidence**: k6 scripts exist but no results files found
- **Fix**: Run load tests, document results

### DEP-001: xlsx Vulnerability

- **Area**: Dependencies
- **Evidence**: `xlsx@0.18.5` has known prototype pollution (CVE-2023-30533)
- **Fix**: Replace with `exceljs` or `SheetJS Pro`

### DEP-002: next-pwa Unmaintained

- **Area**: Dependencies
- **Evidence**: `next-pwa@5.6.0` is archived
- **Fix**: Migrate to `@serwist/next`

---

## P3 — IMPROVEMENT

### UX-001: Placeholder Verification Codes in Meta Tags

- **Location**: Production HTML
- **Evidence**: `your-google-verification-code`, `your-yandex-verification-code`, `your-bing-verification-code`
- **Fix**: Replace with actual codes or remove

### UX-002: Unused Headers in Middleware

- **Evidence**: `x-tenant-id` and `x-user-id` headers set but not consumed by API routes
- **Fix**: Remove or document usage

### OBS-001: Console.error Instead of Structured Logging

- **Evidence**: API routes use `console.error` for error logging
- **Fix**: Use `src/lib/logger.ts` consistently

---

## P4 — CLEANUP

### CLEAN-001: `.next_corrupted_backup` Directory

- **Location**: Project root
- **Fix**: Remove and add to .gitignore

### CLEAN-002: Build Log Files in Root

- **Location**: `build.log`, `build_log.txt`, `build_log_2.txt`, `build_output.txt`, `debug.log`, `typecheck_errors.txt`, `typecheck_final.txt`
- **Fix**: Remove from repository

### CLEAN-003: Loose Fix Scripts in Root

- **Location**: `apply-complete-fix.js`, `final-fix.js`, `quick-fix-guide.js`, `quick-fix.js`, `restart-dev.js`, `restart-server.js`, `test-env-load.js`, `test-weather-api.js`
- **Fix**: Move to `scripts/` or remove

### CLEAN-004: Session File

- **Location**: `session-ses_4565.mdx` (255KB)
- **Fix**: Remove — appears to be an accidental commit of an IDE session

### CLEAN-005: Duplicate Documentation

- **Location**: `DEPLOYMENT-GUIDE.md` + `DEPLOYMENT_GUIDE.md` + `deploy-to-vercel.md`
- **Fix**: Consolidate into one guide
