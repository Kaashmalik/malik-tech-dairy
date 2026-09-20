# MTK DAIRY — ENHANCEMENT ROADMAP

## Based on Post-Phase-6 Forensic Audit — 2026-09-20

---

## RECOMMENDED NEXT DEVELOPMENT ORDER

### Phase A — Critical Security/Database Fixes (MUST DO BEFORE LAUNCH)

**Priority**: P0/P1 — Production Blockers

| #   | Item                                            | Files/DB                                        | Risk                              |
| --- | ----------------------------------------------- | ----------------------------------------------- | --------------------------------- |
| A1  | Switch Clerk to production keys                 | Vercel env vars, `.env.production`              | LOW — config change only          |
| A2  | Fix RLS SELECT policies (12 tables)             | SQL migration: replace `true` with tenant check | MEDIUM — policy change            |
| A3  | Implement `checkTenantSubscription()`           | `src/lib/tenant/context.ts` L170-179            | MEDIUM — business logic           |
| A4  | Fix `current_setting('app.tenant_id')` policies | SQL migration: 3 tables                         | LOW — align with existing pattern |
| A5  | Add missing database enums (15)                 | SQL migration                                   | LOW — additive only               |
| A6  | Add CHECK constraints on financial fields       | SQL migration: amounts >= 0                     | LOW — additive                    |
| A7  | Remove fabricated marketing statistics          | `src/app/(marketing)/page.tsx`                  | LOW — UI change                   |
| A8  | Fix health endpoint 401                         | Verify middleware matcher, check route handler  | LOW                               |
| A9  | Remove placeholder verification meta tags       | Layout or marketing page                        | LOW                               |
| A10 | Add `notifications` table                       | SQL migration                                   | LOW — additive                    |

### Phase B — Production Integration Completion

**Priority**: P1/P2

| #   | Item                                                             | Dependencies             |
| --- | ---------------------------------------------------------------- | ------------------------ |
| B1  | Verify & configure Clerk webhooks for user/org sync              | Clerk dashboard          |
| B2  | Create Supabase storage buckets OR document Cloudinary-only      | Supabase dashboard       |
| B3  | Verify Resend email delivery                                     | Resend API key + domain  |
| B4  | Configure Sentry for production                                  | Sentry DSN               |
| B5  | Configure Upstash Redis for rate limiting                        | Upstash credentials      |
| B6  | Test at least one payment provider end-to-end                    | Merchant sandbox         |
| B7  | Verify cron jobs with CRON_SECRET                                | Vercel cron config       |
| B8  | Seed reference data (diseases, medicines, vaccination schedules) | SQL or seed script       |
| B9  | Create 3 test tenants with realistic data                        | Application flow test    |
| B10 | Remove OpenWeatherMap API key from NEXT_PUBLIC                   | Move to server-side only |

### Phase C — Automated Integration/E2E Tests

**Priority**: P2

| #   | Item                                     | Tools                                      |
| --- | ---------------------------------------- | ------------------------------------------ |
| C1  | Add real database integration tests      | Jest + test Supabase instance              |
| C2  | Add RLS enforcement tests                | Direct Supabase queries as different roles |
| C3  | Add Cypress E2E tests for critical flows | Cypress + test account                     |
| C4  | Add cross-tenant isolation tests         | Multiple test tenants                      |
| C5  | Add payment callback simulation tests    | Mock webhook payloads                      |
| C6  | Add concurrent operation tests           | Race condition scenarios                   |
| C7  | Set up GitHub Actions CI pipeline        | `.github/workflows/ci.yml`                 |

### Phase D — Performance/Reliability

**Priority**: P3

| #   | Item                                                           |
| --- | -------------------------------------------------------------- |
| D1  | Run load tests with k6 (scripts already exist)                 |
| D2  | Add database query explain analysis for complex reports        |
| D3  | Implement proper transaction wrapping for financial operations |
| D4  | Add database connection pool monitoring                        |
| D5  | Add structured logging (replace `console.error`)               |
| D6  | Configure Supabase PITR and test restoration                   |
| D7  | Add uptime monitoring (e.g., Better Uptime)                    |

### Phase E — UX/Product Enhancements

**Priority**: P4

| #   | Item                                                 |
| --- | ---------------------------------------------------- |
| E1  | Measure and improve Urdu translation coverage        |
| E2  | Test RTL layout for Urdu                             |
| E3  | Verify PDF/CSV exports with real data                |
| E4  | Test PWA offline behavior and sync                   |
| E5  | Remove Firebase SDK if activity feeds are not used   |
| E6  | Replace `xlsx` with `exceljs` (security)             |
| E7  | Replace `next-pwa` with `@serwist/next` (maintained) |

### Phase F — Advanced SaaS Features

**Priority**: P4/P5

| #   | Item                                                 |
| --- | ---------------------------------------------------- |
| F1  | Complete RBAC enforcement on ALL API routes          |
| F2  | Add API key authentication for external integrations |
| F3  | Implement subscription upgrade/downgrade flows       |
| F4  | Add payment receipt generation                       |
| F5  | Implement audit log dashboard                        |
| F6  | Add data export (GDPR-style)                         |
| F7  | Complete IoT device integration                      |
| F8  | Implement AI predictive analytics with Groq          |

---

## DATABASE MIGRATION PLAN

### Migration 1: Fix RLS SELECT Policies

```
Name: fix_rls_select_policies_tenant_isolation
Affected: animals, expenses, sales, milk_logs, health_records, feed_logs,
          vaccinations, medicine_inventory, medicine_logs, weather_data, assets
Action: DROP open SELECT policies, CREATE tenant-scoped SELECT policies
Rollback: Restore `true` policies (less secure fallback)
Risk: LOW — additive policy change
```

### Migration 2: Fix current_setting Policies

```
Name: fix_current_setting_rls_policies
Affected: heat_detections, pregnancy_checks, semen_inventory
Action: Replace current_setting with user_is_member_of_tenant
Rollback: Restore current_setting policies
Risk: LOW
```

### Migration 3: Add Missing Enums

```
Name: add_missing_drizzle_enums
Affected: New enum types (15)
Action: CREATE TYPE for all missing enums
Rollback: DROP TYPE
Risk: LOW — additive only
```

### Migration 4: Add CHECK Constraints

```
Name: add_financial_check_constraints
Affected: expenses.amount, sales.total, payments.amount
Action: ALTER TABLE ADD CONSTRAINT
Rollback: ALTER TABLE DROP CONSTRAINT
Risk: LOW — no existing data to violate
```

### Migration 5: Create Notifications Table

```
Name: create_notifications_table
Affected: New table
Action: CREATE TABLE with RLS policies
Rollback: DROP TABLE
Risk: LOW — additive
```
