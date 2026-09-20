# Production Go-Live Checklist

Use this to finish Move 1 (Clerk live keys + PAT rotate). Health is already `200` on `https://dairy.mtkcodex.site/api/system/health`.

## 1. Clerk production instance

1. In [Clerk Dashboard](https://dashboard.clerk.com), create or open the **Production** instance.
2. Add domain `dairy.mtkcodex.site` (and `www` if used).
3. Copy **Publishable key** (`pk_live_...`) and **Secret key** (`sk_live_...`).
4. Create a production webhook pointing to `https://dairy.mtkcodex.site/api/webhooks/clerk` and copy `whsec_...`.

## 2. Vercel environment

In the Vercel project for this app, set (Production):

- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` = `pk_live_...`
- `CLERK_SECRET_KEY` = `sk_live_...`
- `CLERK_WEBHOOK_SECRET` = `whsec_...`
- Confirm `NEXT_PUBLIC_APP_URL` = `https://dairy.mtkcodex.site`

Redeploy from `main` after saving.

## 3. Verify

- Homepage HTML source contains `pk_live_` (not `pk_test_`).
- `GET /api/system/health` → `200`, and `checks.clerk` reports live mode (not test).
- Sign-in works on the production domain.

## 4. Rotate Supabase PAT

The personal access token shared in chat should be revoked at [Account tokens](https://supabase.com/dashboard/account/tokens). Create a new token and update `~/.cursor/mcp.json` `--access-token`.
