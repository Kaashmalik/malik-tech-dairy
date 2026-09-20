# MTK DAIRY — PRODUCTION READINESS MATRIX

## 2026-09-20

---

## READINESS GATES

| #   | Gate                  | Status           | Evidence                                                        | Verdict                       |
| --- | --------------------- | ---------------- | --------------------------------------------------------------- | ----------------------------- |
| A   | Security              | **FAIL**         | Dev Clerk keys, open RLS SELECT, placeholder subscription check | Must fix before launch        |
| B   | Database Integrity    | **PARTIAL**      | Schema correct, 0 data, 15 missing enums, 0 storage buckets     | Needs migration + seed        |
| C   | Multi-Tenancy         | **PARTIAL**      | Code-level tenant isolation, RLS bypassed by service_role       | Architecturally fragile       |
| D   | Authentication        | **FAIL**         | `pk_test_` key in production                                    | Immediate fix required        |
| E   | Authorization         | **PARTIAL**      | Role hierarchy in `context.ts`, not enforced on every route     | Audit all routes              |
| F   | Core Business Logic   | **PARTIAL**      | Services for animals, milk, health, breeding exist              | Never tested with real data   |
| G   | Financial Integrity   | **PARTIAL**      | Integer money storage (correct), no DB-level constraints        | Add CHECK constraints         |
| H   | Payments              | **BLOCKED**      | JazzCash/EasyPaisa/XPay code present                            | No merchant credentials       |
| I   | Storage               | **FAIL**         | 0 Supabase buckets, Cloudinary code present                     | Configure buckets or document |
| J   | Notifications         | **PARTIAL**      | Email templates in code, no notifications DB table              | Missing table                 |
| K   | Cron                  | **PARTIAL**      | `/api/cron/predictions`, `/api/cron/reminders` routes exist     | CRON_SECRET dependent         |
| L   | PWA                   | **PARTIAL**      | next-pwa configured, manifest present                           | Offline sync not tested       |
| M   | Localization          | **PARTIAL**      | next-intl, `messages/en.json` + `messages/ur.json` exist        | Coverage % unknown            |
| N   | Performance           | **NOT VERIFIED** | Indexes on key columns                                          | No load test evidence         |
| O   | Observability         | **PARTIAL**      | Sentry + PostHog conditional on env vars                        | Depends on DSN/keys           |
| P   | Backup/DR             | **NOT VERIFIED** | Supabase default backups                                        | No restoration test           |
| Q   | CI/CD                 | **PARTIAL**      | Husky + lint-staged, no `.github/workflows` CI                  | Local only                    |
| R   | External Integrations | **BLOCKED**      | 9 services depend on credentials                                | Not verifiable                |
| S   | Testing               | **PARTIAL**      | 329 Jest tests pass (all unit/mock)                             | No integration/E2E            |
| T   | Documentation         | **PARTIAL**      | 30+ docs exist, many outdated/optimistic                        | Needs truth update            |

---

## TEST COVERAGE REALITY

### What Jest Tests Actually Cover (329 passing)

| Test Suite                           | Tests              | Real DB? | Real API? | Real External? |
| ------------------------------------ | ------------------ | -------- | --------- | -------------- |
| AnimalForm.test.tsx                  | Component render   | No       | No        | No             |
| medicine/page.test.tsx               | Component render   | No       | No        | No             |
| sanitization.test                    | Input sanitization | No       | No        | No             |
| security-regression.test             | Security patterns  | No       | No        | No             |
| diseases-medicines.test              | Supabase mock      | No       | No        | No             |
| integration.test (animals API)       | Mocked             | No       | No        | No             |
| plan.service.test                    | Service mock       | No       | No        | No             |
| payment-registry.test                | Provider registry  | No       | No        | No             |
| notification.service.test            | Mock               | No       | No        | No             |
| domain-services.test                 | Service mocks      | No       | No        | No             |
| utils.test, limits.test, tenant.test | Pure functions     | N/A      | N/A       | N/A            |
| logger.test, audit.test              | Mock               | No       | No        | No             |
| Various hook tests                   | React hooks        | No       | No        | No             |

### Untested Areas (Critical)

- ❌ Real database queries
- ❌ Real Supabase RLS enforcement
- ❌ Real Clerk authentication flow
- ❌ Real payment transactions
- ❌ Real email sending
- ❌ Real file upload/download
- ❌ Cross-tenant isolation
- ❌ Concurrent operations / race conditions
- ❌ End-to-end user flows
- ❌ Browser/Cypress E2E tests
- ❌ Production deployment verification

---

## PREVIOUS PHASE CLAIMS vs CURRENT REALITY

| Previous Claim                 | Current Evidence                        | Actual Status                                   |
| ------------------------------ | --------------------------------------- | ----------------------------------------------- |
| "RLS enabled on all tables"    | ✅ RLS enabled on all 54 tables         | **PASS** (enabled) but **FAIL** (policies open) |
| "Tenant isolation complete"    | Code-level yes, RLS SELECT = true       | **PARTIAL**                                     |
| "Production ready"             | Dev keys, 0 data, fake stats            | **FAIL**                                        |
| "Security hardened"            | Multiple security migrations applied    | **PARTIAL** — good foundation, gaps remain      |
| "Payment integration complete" | Code exists, no credential verification | **BLOCKED**                                     |
| "329 tests passing"            | ✅ Confirmed: 329/329 pass              | **PASS** — but all mocked                       |
| "PWA ready"                    | Config exists, not tested               | **PARTIAL**                                     |
| "Bilingual (EN/UR)"            | Infrastructure exists                   | **PARTIAL** — coverage unknown                  |
