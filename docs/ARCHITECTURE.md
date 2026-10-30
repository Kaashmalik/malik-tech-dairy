# Architecture

How MTK Dairy is put together, and the rules every change must follow.

## Tenancy model

- A **farm = a Clerk Organization**. `tenants.id` is always the Clerk org id.
- Users are mirrored into `platform_users` (`ensurePlatformUser`,
  `src/lib/auth/platform-user.ts`) at first login, when applying, and by the Clerk webhook.
- Farm membership and role live in `tenant_members` (`farm_owner`, `farm_manager`,
  `veterinarian`, `milking_staff`, …). Platform super admins have
  `platform_users.platform_role = 'super_admin'`.

## Request flow

1. **`src/middleware.ts`**
   - strips client-supplied `x-tenant-id` / `x-user-id` headers
   - rate-limits every `/api` route (per user or IP; Upstash)
   - public routes pass; everything else needs a Clerk session
   - authenticated routes need an **active farm** unless listed in `isNoOrgRoute`
     (apply, select-farm, super-admin, a few user APIs) — tenant scope is the default
2. **Route handler** resolves the farm with `getTenantContext()` (or the
   `withTenantContext` / `withRole` wrappers, which call it). It checks membership,
   platform role and farm status (suspended → 423, deleted → 410).
3. **Data access** goes through `tenantDb(tenantId)` (`src/lib/supabase/tenant-db.ts`):
   every select/update/delete is filtered by `tenant_id`, inserts are stamped with it,
   and updates can never change it.

## Data access rules

- **Never** open direct Postgres connections at runtime (they fail on Vercel
  serverless). Drizzle (`src/db/schema.ts`) is the schema source and is used only by
  `drizzle-kit`.
- **Never** query tenant tables without `tenantDb` or an explicit `tenant_id` filter.
  The service role bypasses RLS; migration `010` denies the browser (anon) role entirely,
  so the browser must always go through API routes.
- Use `unwrap()` so PostgREST errors throw instead of returning empty data.
- Use `fetchAllRows()` for totals/exports — PostgREST returns at most 1000 rows per request.
- Never interpolate user input into PostgREST `or()` filters; sanitize first
  (`sanitizeSearchTerm`).

## Key flows

| Flow                                                                        | Code                                                                                     |
| --------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------- |
| Sign-up → free farm instantly; paid → application → admin approval          | `api/farm-applications`, `api/admin/applications/[id]/review`, `lib/tenant/provision.ts` |
| Farm provisioning (Clerk org + tenant + subscription + owner) with rollback | `provisionFarm()`                                                                        |
| Team invites (Clerk organization invitations → webhook → `tenant_members`)  | `api/staff`, `api/webhooks/clerk`                                                        |
| Plan limits and features                                                    | `lib/subscriptions/management.ts` (`SubscriptionService`)                                |
| Milk entry (single + herd), monthly report                                  | `lib/services/milk/milk.service.ts`, `/milk/bulk`, `api/milk`                            |
| Reports (CSV, PDF)                                                          | `lib/services/reports/report.service.ts`, `lib/reports/pdf.ts`                           |
| Farm export / deletion                                                      | `lib/tenant/data-rights.ts`, `api/tenant/export`, `api/tenant/delete`                    |
| Super admin: farms, plans, suspension, audit log                            | `api/admin/*`, `(super-admin)` pages                                                     |
| Audit trail                                                                 | `lib/audit.ts` → `audit_logs`                                                            |

## Public site

- Marketing pages in `src/app/(marketing)`; guides are data in `src/content/guides`,
  rendered by `GuideBody` (markdown subset, no raw HTML).
- SEO: per-page canonicals, `sitemap.ts`, `robots.ts`, JSON-LD via `JsonLdScript`,
  `llms.txt`. App/auth layouts are `noindex`.
- Ads: `AdsenseScript`/`AdSlot` only in `/guides` and `/tools` layouts; `/ads.txt` is
  generated from `NEXT_PUBLIC_ADSENSE_CLIENT`.

## Testing

- Jest unit tests next to the code (`__tests__`). `src/mocks/supabase-rest.ts` is a
  PostgREST fake that records filters, so tests can assert tenant scoping.
- Guides content is tested for SEO rules (`src/content/guides/__tests__`).
