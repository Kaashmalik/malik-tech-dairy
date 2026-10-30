# MTK Dairy — Master Plan (2026)

Single source of truth for the remediation and growth roadmap. Older phase/audit
documents in the repo root and `docs/` are superseded by this file.

_Last updated: 2026-10-30_

## Review findings

### Signup, free tier, tenancy (critical)

1. **Free signup never yields a farm.** Every plan, including Free, goes through
   `/apply` and waits for manual super-admin approval. Users see a "pending" wall.
2. **Approval can create a ghost tenant.** `api/admin/applications/[id]/review`
   falls back to a fake `tenant_…` ID when Clerk org creation fails. That ID never
   matches a Clerk `orgId`, so the owner can never open the dashboard. Subscription
   and membership errors are swallowed (`catch (e) {}`).
3. **Clerk webhook imports Firebase Admin** and uses a direct Postgres connection.
   If either fails, `platform_users` is never written and later steps fail with
   "Failed to verify user account".
4. **Middleware only enforces org context on `/dashboard`** and a few APIs.
   `/animals`, `/milk`, `/health`, `/breeding`, `/reports`, `/api/sales`,
   `/api/staff`, `/api/feed-*`, `/api/veterinary/*` etc. rely on per-route checks.
5. **Super-admin check uses `emailAddresses[0]`** (not the verified primary email)
   and grants access when the database errors.

### Data layer (source of recurring prod 500s)

6. Animals and milk were moved to Supabase REST to fix serverless 500s, but ~35
   files still use Drizzle / direct Postgres (reports, breeding, health, finance,
   feed, staff, veterinary, cron, payments, subscriptions, tenant context).
7. Firebase is still used in 11 places (analytics, photo upload, invitations,
   tenant export/delete, NPS survey).
8. All DB access uses the service-role key, so RLS is bypassed and tenant
   isolation depends on every query remembering `tenant_id`.

### Repo hygiene

9. `public/debug.html`, `public/api-test.html`, logs, `.bak` files,
   `route.ts.95072101` and a 255 KB session dump are committed; ~50 overlapping
   status/audit markdown files.

### SEO and AdSense

10. No AdSense setup: no `ads.txt`, no publisher ID, no consent management (CMP).
11. No content hub — about 8 public pages. AdSense needs substantial original content.
12. Sitemap lists `/sign-in` and `/sign-up`; `robots.ts` uses `host` (Yandex only);
    `/contact` is a client component and exports no metadata.

## Phases

### Phase 0 — Cleanup and guardrails

- Remove debug HTML, logs, `.bak`, session dumps; tighten `.gitignore`.
- Consolidate status docs into `README.md` + `docs/ARCHITECTURE.md`.
- CI gate: `typecheck`, `lint`, `build` on every PR.

### Phase 1 — Signup, onboarding, tenancy (critical)

- Free plan: instant farm provisioning (Clerk org + tenant + owner membership +
  free subscription) and redirect to the dashboard.
- Paid plans keep the application → payment slip → approval flow.
- One shared, idempotent `provisionFarm()` used by both paths: no fake org IDs,
  compensating rollback, surfaced errors.
- Clerk webhook on Supabase REST only (no Firebase), idempotent upserts.
- `ensurePlatformUser()` on first login so a missed webhook never blocks users.
- Middleware: tenant routes protected by default (allow-list of exceptions).
- Super admin: verified primary email; deny on DB errors.
- Tests: post-login routing, provisioning helpers, route matching.

### Phase 2 — One data layer

- Migrate the remaining Drizzle/Postgres call sites to Supabase REST (or Postgres
  RPC for heavy reports).
- Remove Firebase entirely (Cloudinary for photos, Supabase for data).
- Single `tenantQuery(ctx)` helper that always applies `tenant_id`.
- Enable and verify Postgres RLS as defense in depth.

### Phase 3 — Core modules

- **Animals:** CRUD, photos, pedigree, CSV import/export, search/filter/pagination,
  plan limit with upgrade CTA.
- **Milk:** AM/PM per animal, bulk herd entry, fat/SNF, duplicate guard,
  daily/monthly totals.
- **Reports:** milk (daily/monthly/per animal), herd, health and vaccinations due,
  breeding calendar, P&L; PDF + CSV export with Urdu and PKR formatting.
- **Health and breeding:** complete field mapping, due/heat alerts, expected
  calving from pregnancy checks.
- **Dashboard:** real KPIs, empty states, skeletons.

### Phase 4 — Super-admin dashboard

- Application queue (approve/reject with reason + email).
- Farm management: suspend, change plan, read-only impersonation, usage.
- Users and roles, payments and slip verification, coupons, audit log viewer,
  platform KPIs (signups, active farms, MRR, churn).

### Phase 5 — SaaS hardening

- Server-side plan limits on every write.
- Team invitations and roles (owner, manager, vet, worker) with permission checks.
- Rate limiting, Zod on every route, consistent error envelope, Sentry with tenant tag.
- Data export and account deletion; backup policy.

### Phase 6 — SEO (2026)

- Server-rendered marketing pages, per-page metadata, canonicals, `hreflang` en/ur.
- JSON-LD: `SoftwareApplication`, `Organization`, `FAQPage`, `BreadcrumbList`, `Article`.
- `/guides` content hub: 25–40 original EN/UR articles (breeds of Pakistan,
  vaccination schedules for FMD/HS/LSD, milk-yield improvement, fat/SNF pricing,
  heat detection, feed formulas) plus calculators (milk yield, gestation).
- Sitemap with guides only, no auth pages; fix `robots.ts`; keep `llms.txt`
  current; IndexNow on publish.
- Core Web Vitals: INP < 200 ms, LCP < 2.5 s, optimized images and fonts.
- Breadcrumbs, internal linking, author/E-E-A-T bylines, OG images,
  Search Console + Bing Webmaster.

### Phase 7 — AdSense readiness

- Ads only on public content pages (`/guides`, calculators), never in the app,
  auth pages or thin pages.
- `ads.txt`; publisher ID via env var.
- Google-certified CMP with Consent Mode v2 (EEA/UK/CH).
- Privacy policy updated for cookies/ads/third parties; real About/Contact with
  business identity; disclaimer.
- Reserved ad slot sizes (no CLS), lazy-loaded units.

### Phase 8 — QA and launch

- Unit tests (tenant resolution, plan limits), cross-tenant isolation integration
  test, Cypress for signup and core modules.
- k6 load test on milk and animals APIs; uptime and error alerting.
- Launch checklist; apply to AdSense once at least 25 guides are indexed.

## Sequencing

| Order | Phase | Effort                    |
| ----- | ----- | ------------------------- |
| 1     | 0 + 1 | 1–2 days                  |
| 2     | 2     | 2–3 days                  |
| 3     | 3     | 3–5 days                  |
| 4     | 4 + 5 | 3–4 days                  |
| 5     | 6 + 7 | 1–2 weeks (content-bound) |
| 6     | 8     | 2 days                    |

## Progress log

- **2026-10-30** — Phase 1 implemented:
  - `src/lib/tenant/provision.ts`: shared `provisionFarm()` / `upsertTenantRecords()`
    (real Clerk org IDs only, idempotent upserts, rollback). Free subscriptions no
    longer expire after 30 days.
  - `src/lib/auth/platform-user.ts`: `ensurePlatformUser()` used by auth redirect,
    public and super-admin layouts, applications and webhook. Super admin requires a
    verified primary email (`SUPER_ADMIN_EMAILS`) and fails closed.
  - Free plan on `/apply` provisions the farm instantly and opens the dashboard;
    paid plans keep review. Duplicate open applications return 409.
  - Approval route: atomic claim (no double farms), surfaced errors.
  - Clerk webhook: raw-body signature verification, Supabase REST only (no
    Firebase), duplicate deliveries acknowledged, failed deliveries retryable.
  - Middleware: tenant scope is the default for every authenticated route;
    identity headers (`x-tenant-id`, `x-user-id`) stripped from client requests;
    fixed subdomain redirect loop.
  - Deferred to Phase 2: `api/tenants/initialize` and `lib/supabase/tenant.ts`
    still use Drizzle.
- **2026-10-30** — Phase 2 implemented (commits "Phase 2A/2B/2C"):
  - Runtime data access is Supabase REST only. `getDrizzle()` and the postgres pool
    are gone from `lib/supabase/server.ts`; Drizzle remains for schema/migrations.
  - `lib/supabase/tenant-db.ts`: `tenantDb(tenantId)` (always filters/stamps
    `tenant_id`, `tenant_id` immutable on update), `unwrap()`, `fetchAllRows()`
    (pages past the 1000-row cap), `listActiveTenants()`.
  - Silent-degradation bugs fixed: paid farms fell back to free limits on DB errors;
    `getTenantInfo` null → "Tenant not found"; tasks list was invalid SQL; feed
    analytics returned hard-coded mock numbers.
  - Security: payment intent cross-farm overwrite; payment callback activated plans
    for under-payment; staff PUT allowed privilege escalation to `farm_owner`;
    removing a member left their Clerk membership (kept access as manager);
    `roleMiddleware` read roles from Firestore and accepted `?tenantId=`.
  - Team invites now use Clerk organization invitations (Clerk sends email); the
    webhook mirrors `organizationMembership.*` into `tenant_members` with the
    invited role. Seat limits enforced (members + pending invites).
  - Firebase fully removed (packages, config, CSP, env). Browser Supabase client
    removed: location settings and offline sync go through tenant-checked APIs.
  - `scripts/migrations/010_lock_down_anon_access.sql`: RLS on every public table,
    anon/authenticated privileges revoked. **Must be applied manually** (see file).
  - Removed unreachable code (restorable from git): Firestore migration tooling,
    IoT/API-key chain (middleware blocked devices anyway), batch-operations stub,
    duplicate veterinary routes, milk-quality, tenant export/delete (no UI — rebuild
    in Phase 5), NPS survey, bank-transfer routes without callers.
  - Phase 3 follow-ups noted: milk quality (fat/SNF) and feed consumption tracking
    need real data models; API keys/IoT need a deliberate design if wanted.
- **2026-10-30** — Phases 0 and 3–8 implemented (see commits "Phase 0" … "Phase 8"):
  - Phase 0: leaked Supabase service-role key removed from tracked files (**must be
    rotated** — docs/SETUP.md §0); stale docs/scripts/debug pages removed; npm CI gate.
  - Phase 3: milk quantity decimal fix (migration 011), herd milk entry, fat/SNF,
    monthly milk report, accurate PDF/CSV/dashboard totals; billing bypass
    (`PUT /api/subscription`) removed; shared catalogue writes admin-only.
  - Phase 4: super-admin farm create/plan/suspend (migration 012), real audit log
    (audit inserts had been failing), unified tenant resolution.
  - Phase 5: central rate limiting, working contact form (migration 013), farm export
    and deletion.
  - Phases 6–7: canonical/hreflang/og:image/sitemap/robots fixes, 12 guides, 2 free
    calculators, AdSense wiring + privacy policy.
  - Phase 8: README, ARCHITECTURE, SETUP checklist; 406 unit tests.
  - **Remaining (needs your accounts/DB):** everything in docs/SETUP.md. Content goal:
    grow guides to ~25 before applying to AdSense. Not done: Cypress e2e suite refresh
    (existing specs predate these changes), real Urdu (`/ur`) pages, feed consumption
    tracking, impersonation for support.
