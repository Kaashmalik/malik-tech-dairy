# MTK Dairy — Setup & Deployment Checklist

This is the single list of things that must be done **outside the code** (Supabase,
Clerk, Vercel, Google). Work through it top to bottom on the machine that has your
credentials. Every step says _where_, _what_ and _how to verify_.

> Code changes are already on `main`. Nothing here is done automatically.

## At a glance (do in this order)

1. [ ] **Rotate the Supabase service-role key** and update Vercel + `.env.local` (§0) — urgent.
2. [ ] `git pull`, `npm install`, fill `.env.local` (§1), `npm run dev` works locally.
3. [ ] Supabase SQL editor: apply migrations **010 → 011 → 012 → 013** in order (§2),
       running each file's PRE/POST-CHECK queries.
4. [ ] Clerk: webhook endpoint + the 7 events incl. `organizationMembership.*` (§3).
5. [ ] Vercel: add `SUPER_ADMIN_EMAILS`, `CRON_SECRET`, Upstash keys, `CONTACT_INBOX_EMAIL`;
       remove all `FIREBASE_*`; redeploy (§1, §4).
6. [ ] Run the smoke test (§9) and the Cypress suites (§8).
7. [ ] Search Console + Bing, submit sitemap (§5).
8. [ ] Later, once ~25 guides are indexed: apply for AdSense (§6).

---

## 0. URGENT — rotate the leaked Supabase service-role key

The GitHub repo is **public**, and the Supabase **service_role** key for project
`gdditqkvzlpnklcoxspj` was committed in several files (MCP config and guide files,
removed in the Phase 0 commit). It is still readable in git history. That key bypasses
all security and gives full read/write access to every farm's data.

1. Supabase Dashboard → project `gdditqkvzlpnklcoxspj` → **Project Settings → API Keys**.
2. Create a new **secret** key (or roll the legacy JWT secret if you still use legacy
   `anon`/`service_role` keys — this also invalidates the anon key).
3. Disable/delete the old key.
4. Vercel → Project → **Settings → Environment Variables**: update
   `SUPABASE_SERVICE_ROLE_KEY` (and `NEXT_PUBLIC_SUPABASE_ANON_KEY` if rolled) for
   Production, Preview and Development. **Redeploy.**
5. Update your local `.env.local` the same way.
6. Also rotate the **Supabase personal access token** used for the MCP server
   (Account → Access Tokens) — it was in the same files.
7. Optional but recommended: make the GitHub repo private, or purge history with
   `git filter-repo` (rotation is still required either way).

**Verify:** the old key returns `401` against `https://gdditqkvzlpnklcoxspj.supabase.co/rest/v1/`.

---

## 1. Local environment (`.env.local`)

Copy `.env.example` to `.env.local` and fill in. Required to run at all:

| Variable                                                                                 | Where to get it                                                       |
| ---------------------------------------------------------------------------------------- | --------------------------------------------------------------------- |
| `NEXT_PUBLIC_APP_URL`                                                                    | `https://dairy.mtkcodex.site` (prod) / `http://localhost:3000`        |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`, `CLERK_SECRET_KEY`                                  | Clerk → API Keys                                                      |
| `CLERK_WEBHOOK_SECRET`                                                                   | Clerk → Webhooks → your endpoint → Signing secret                     |
| `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` | Supabase → Project Settings → API                                     |
| `SUPER_ADMIN_EMAILS`                                                                     | Comma-separated; must be the **verified primary** email in Clerk      |
| `CRON_SECRET`                                                                            | Any long random string (`openssl rand -hex 32`); Vercel Cron sends it |

Optional (feature degrades gracefully without them): `UPSTASH_REDIS_REST_URL/TOKEN`
(**rate limiting is a no-op without Redis** — strongly recommended in production; free
Upstash tier is enough), `CONTACT_INBOX_EMAIL` (where contact-form inquiries go), `RESEND_API_KEY`/`RESEND_FROM_EMAIL` (emails),
`CLOUDINARY_*` (photo uploads), `NEXT_PUBLIC_ADSENSE_CLIENT` /
`NEXT_PUBLIC_ADSENSE_SLOT_IN_ARTICLE` (ads on guides/tools — see section 6), `OPENWEATHER_API_KEY`, `GROQ_API_KEY` (AI),
`SENTRY_DSN`/`NEXT_PUBLIC_SENTRY_DSN`, `NEXT_PUBLIC_POSTHOG_KEY`, payment gateway keys
(`JAZZCASH_*`, `EASYPAISA_*`, `XPAY_*`), `INDEXNOW_API_KEY`, site verification codes.

`SUPABASE_DATABASE_URL` / `DATABASE_URL` are **only** needed for `drizzle-kit`
(schema push/migrations). The running app no longer opens direct Postgres connections.

**Remove from Vercel** (no longer used): all `FIREBASE_*` and `NEXT_PUBLIC_FIREBASE_*`.

**Verify:** `npm run validate:env` then `npm run dev`, open http://localhost:3000.

---

## 2. Database migrations (Supabase SQL editor)

All files are in `scripts/migrations/`, numbered. Apply in order; each is idempotent.

### Existing production database

Migrations `001`–`009` were part of earlier work — check before re-running:

```sql
-- Should return rows for each if 001–009 are applied
SELECT to_regclass('public.notifications'), to_regclass('public.coupons'),
       to_regclass('public.treatment_records');
```

Then apply the new ones:

| File                            | What it does                                                             | Notes                                                                                                        |
| ------------------------------- | ------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------ |
| `010_lock_down_anon_access.sql` | RLS on every public table; revokes all `anon`/`authenticated` privileges | Run the PRE-CHECK query in the file first. The app uses only the service role, so nothing in the app breaks. |

| `011_milk_logs_decimal_quality.sql` | `milk_logs.quantity` → `numeric(6,2)` litres (fixes every decimal entry like 12.5 L failing), adds `snf`, fat/SNF range checks, `(tenant_id, date)` index, and a unique index for one entry per animal/session/day | If it prints _"Duplicates found"_, run the DUPLICATE CHECK query in the file, delete the extra rows, and re-run. Fat/SNF entry works after this migration. |
| `012_tenant_suspension.sql` | Adds `tenants.suspended_at` / `suspended_reason` for the super-admin **Suspend farm** action (members get HTTP 423 until reactivated) | Without it, the Suspend action returns an error; everything else works. |
| `013_contact_messages.sql` | Inbox table for the public contact form (`POST /api/contact`) | Messages are also emailed to `CONTACT_INBOX_EMAIL` (or `NEXT_PUBLIC_SUPPORT_EMAIL`) when Resend is configured. Without the table **and** email, the form shows an error. |

**Verify:** run the POST-CHECK query at the bottom of each file.

### Fresh database (new project)

1. Set `DATABASE_URL` in `.env.local` to the **session pooler** URL (port 5432).
2. `npm run db:push` — creates all tables from `src/db/schema.ts`.
3. Apply `scripts/migrations/001…` in order.
4. Seed reference data: `scripts/diseases-seed-data.sql`,
   `scripts/medicines-seed-data.sql`, `scripts/treatment-protocols-seed-data.sql`.

---

## 3. Clerk dashboard

1. **Organizations → Settings:** enable Organizations; allow **invitations**.
   Members should not be able to create organizations themselves
   (farms are created by the app).
2. **Webhooks → Add endpoint:** `https://dairy.mtkcodex.site/api/webhooks/clerk`.
   Subscribe to:
   - `user.created`, `user.updated`
   - `organization.created`, `organization.deleted`
   - `organizationMembership.created`, `organizationMembership.updated`,
     `organizationMembership.deleted` ← **required for team invites**
     Copy the signing secret to `CLERK_WEBHOOK_SECRET`.
3. **Paths:** sign-in `/sign-in`, sign-up `/sign-up`; after sign-in/up redirect to
   `/api/auth/redirect` (the components already set this).
4. **Email:** make sure your super-admin email is **verified** in Clerk —
   unverified emails are ignored for super-admin access.

**Verify:**

- Sign up a new account → choose **Free** on `/apply` → you land on `/dashboard`.
- In Clerk → Webhooks → Message attempts: all `200`.
- Invite a teammate from **Staff**: they receive a Clerk email; after accepting they
  appear in the team list with the chosen role.

---

## 4. Vercel

1. Environment variables as in section 1 (Production + Preview).
2. **Cron jobs** come from `vercel.json` (`/api/cron/predictions`, `/api/cron/reminders`);
   they authenticate with `CRON_SECRET`.
3. Domain: `dairy.mtkcodex.site` (and wildcard `*.dairy.mtkcodex.site` only if you use
   farm subdomains).

**Verify:** Vercel → Logs show no `500` on `/dashboard`, `/animals`, `/milk`,
`/reports`, `/staff`, `/tasks`, `/feed`.

---

## 5. Search engines (SEO)

The code side is done (per-page canonicals, sitemap, robots, structured data, `/guides`,
calculators). What you need to do:

1. **Google Search Console** → add property `https://dairy.mtkcodex.site` (Domain property
   via DNS TXT is best). If you use the HTML-tag method, put the code in
   `NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION` and redeploy.
2. Search Console → **Sitemaps** → submit `https://dairy.mtkcodex.site/sitemap.xml`.
3. Search Console → **URL inspection** → request indexing for `/`, `/guides` and each guide.
4. **Bing Webmaster Tools** → import from Search Console (one click), or set
   `NEXT_PUBLIC_BING_SITE_VERIFICATION`.
5. Optional: set `INDEXNOW_API_KEY` so new guides are pushed to Bing/Yandex instantly.
6. Check the **Rich Results Test** on a guide URL: Article, Breadcrumb and FAQ should be valid.

**Verify:** `https://dairy.mtkcodex.site/robots.txt` lists the sitemap; the sitemap lists
the 12 guides and 2 tools and no sign-in/sign-up/app pages.

**Keep publishing.** Aim for at least 25 quality guides before applying for AdSense
(see below). Add guides in `src/content/guides/*.ts` and register them in
`src/content/guides/index.ts`; `npm test` enforces length, headings and valid links.

---

## 6. Google AdSense

Ads are wired but **off** until you set the publisher id. They appear only on `/guides/*`
and `/tools/*` — never in the farm app, on sign-in/up pages, or on legal pages.

### Before applying

- [ ] At least ~25 substantial guides indexed in Search Console (12 are live now).
- [ ] Privacy policy (updated for AdSense), About, Contact (form works), Terms all live.
- [ ] Site has been live and indexed for a few weeks; no "under construction" pages.

### Apply and configure

1. Create an account at https://adsense.google.com with the business identity shown on
   `/about` and `/contact`. Add site `dairy.mtkcodex.site`.
2. Copy your publisher id (`ca-pub-XXXXXXXXXXXXXXXX`) → Vercel env
   `NEXT_PUBLIC_ADSENSE_CLIENT` → redeploy. This loads the AdSense code on guides/tools and
   makes `https://dairy.mtkcodex.site/ads.txt` serve the correct line automatically.
3. Request review in AdSense. Approval usually takes days to a few weeks.
4. **Privacy & messaging** in AdSense → create the **European regulations (GDPR)** message
   (Google-certified CMP; required for EEA/UK/Switzerland visitors) and, if prompted, the
   US state regulations message. Publish them — no code change needed.
5. After approval: **Ads → By ad unit → Display/In-article ad** → create a unit, copy its
   slot id → env `NEXT_PUBLIC_ADSENSE_SLOT_IN_ARTICLE` → redeploy. One slot is placed below
   each guide's main content and on each calculator page, with reserved height (no layout
   shift).
6. Keep **Auto ads** off at first (it can place ads inside forms); enable later only for
   `/guides` if you want more inventory.

**Verify:** `/ads.txt` returns `google.com, pub-…, DIRECT, f08c47fec0942fa0`; AdSense →
Sites shows "Ready"; no ad markup appears on `/dashboard` or `/sign-in`.

---

## 7. Deleted farms (recovery & purge)

**Settings → Data & Privacy → Delete** soft-deletes: `tenants.deleted_at` is set, members
are deactivated, the Clerk organization is deleted, and every API returns `410` for that
farm. Rows are kept so you can recover a mistake.

- Recover (within your stated 30 days): `UPDATE tenants SET deleted_at = NULL WHERE id = '<org id>';`
  then recreate a Clerk organization for the owner (Super Admin → Farms → Create farm makes
  a _new_ farm; for a true restore re-link manually) — or simply export and re-import.
- Purge after 30 days (run monthly):
  ```sql
  DELETE FROM tenants WHERE deleted_at < now() - interval '30 days';  -- cascades
  ```

---

## 8. End-to-end tests (Cypress)

Two suites live in `cypress/e2e/`:

| Suite | Needs | Covers |
| --- | --- | --- |
| `public-site.cy.ts` | nothing | guides (25+), Urdu pages (RTL, hreflang), calculators, contact form, robots/sitemap/ads.txt, noindex, auth redirects, spoofed tenant headers |
| `farm-app.cy.ts` | a Clerk **test user who owns a farm** | dashboard, herd milk entry + duplicate guard, monthly report, tasks/staff APIs, data export |

Run locally:

```bash
npm run dev
npx cypress run --spec cypress/e2e/public-site.cy.ts
CYPRESS_TEST_EMAIL=you+clerk_test@example.com CYPRESS_TEST_PASSWORD=...   npx cypress run --spec cypress/e2e/farm-app.cy.ts
```

Against a Vercel preview: add `CYPRESS_BASE_URL=https://<preview-url>`.

**Test user:** in a Clerk *development* instance, create a user with an email containing
`+clerk_test` (Clerk accepts verification code `424242` for these), sign in once, choose
the Free plan on `/apply` so it owns a farm. The farm-app suite creates one animal tagged
`E2E-<timestamp>` and archives it again. `farm-app.cy.ts` is skipped automatically when
the credentials are not set. CI runs the public suite on every push.

---

## 9. Smoke test after deploy

- [ ] New user → Free plan → dashboard opens (no admin approval)
- [ ] Paid plan → application → super admin approves → user opens dashboard
- [ ] Add animal, log milk, export milk CSV and PDF from **Reports**
- [ ] Tasks page lists/creates tasks
- [ ] Staff: invite, change role, remove member (removed user loses access)
- [ ] Settings → Location saves
- [ ] Super admin panel loads for the allow-listed verified email only
- [ ] Contact form on `/contact` sends (check `contact_messages` / inbox)
- [ ] Settings → Data & Privacy → Download export produces a ZIP
- [ ] Super admin → Farms → Suspend: the farm's members get "farm is suspended"; Reactivate restores
