# MTK Dairy — Setup & Deployment Checklist

This is the single list of things that must be done **outside the code** (Supabase,
Clerk, Vercel, Google). Work through it top to bottom on the machine that has your
credentials. Every step says _where_, _what_ and _how to verify_.

> Code changes are already on `main`. Nothing here is done automatically.

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
`CLOUDINARY_*` (photo uploads), `OPENWEATHER_API_KEY`, `GROQ_API_KEY` (AI),
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

## 5. Deleted farms (recovery & purge)

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

## 6. Smoke test after deploy

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
