# Production Readiness Final Assessment Report

**System**: MTK Dairy / Malik Tech Dairy  
**Production Domain**: https://dairy.mtkcodex.site  
**Target Audience**: Dairy Farmers & Commercial Herds in Pakistan  
**Audit Date**: September 20, 2026  
**Final Verdict**: **NOT READY FOR PRODUCTION**

---

## 1. Production Readiness Strict Domain Matrix

| Evaluation Domain               |      Status      | Key Evidence / Primary Rationale                                                                                            | Production Blocker? |
| :------------------------------ | :--------------: | :-------------------------------------------------------------------------------------------------------------------------- | :-----------------: |
| **Security**                    |   **PARTIAL**    | CORS and health endpoints fixed locally; in-memory replay cache in serverless lambda; unauthenticated RPC membership oracle |    **YES (P1)**     |
| **Database**                    |     **PASS**     | 55 tables, 26 enums, financial check constraints, notifications table live in Supabase                                      |         NO          |
| **Row-Level Security (RLS)**    |   **PARTIAL**    | Reads strictly tenant-isolated; write policies crash on `(tenant_id)::uuid` cast for direct Supabase clients                |    **YES (P1)**     |
| **Tenant Isolation**            |     **PASS**     | Sourced securely from server-side Clerk context (`getTenantContext`) in API routes                                          |         NO          |
| **Authentication**              |   **BLOCKED**    | Configured with Clerk development test keys (`pk_test_...`, `sk_test_...`) in production                                    |    **YES (P0)**     |
| **RBAC**                        |   **PARTIAL**    | Role hierarchy defined; destructive financial deletions lack role validation (`farm_owner` / `accountant`)                  |       NO (P1)       |
| **Core Dairy Modules**          |     **PASS**     | Milk logging, animal registry, breeding, heat detection, pregnancy check APIs fully operational                             |         NO          |
| **Finance**                     |   **PARTIAL**    | Non-negative CHECK constraints live; sales total calculation not constrained; paise vs PKR semantic inconsistency           |       NO (P2)       |
| **Payments**                    |   **PARTIAL**    | JazzCash, EasyPaisa, XPay, Bank Transfer integrated; callback depends on Firebase Firestore                                 |       NO (P2)       |
| **Subscriptions**               |   **PARTIAL**    | Tier limits defined; `checkTenantAnimalQuota` disconnected from animal creation API                                         |    **YES (P1)**     |
| **Notifications**               |     **PASS**     | PostgreSQL `notifications` table live; `NotificationBell` queries `/api/notifications`; background reminders operational    |         NO          |
| **Cron Jobs**                   |   **PARTIAL**    | `/api/cron/reminders` uses PostgreSQL; `/api/cron/predictions` queries Firebase Admin                                       |       NO (P2)       |
| **Storage**                     |     **PASS**     | Cloudinary authoritative with signed server uploads; Supabase buckets configured with default deny                          |         NO          |
| **PWA & Offline**               |   **PARTIAL**    | IndexedDB schemas operational; direct Supabase sync cannot write due to `(tenant_id)::uuid` RLS bug                         |    **YES (P1)**     |
| **Localization (Urdu/EN)**      |     **PASS**     | Bilingual toggle and translation dictionaries present across dashboard                                                      |         NO          |
| **Observability**               |   **PARTIAL**    | Winston/structured logging configured; Sentry DSN not verified on production                                                |       NO (P2)       |
| **Disaster Recovery / Backups** | **NOT VERIFIED** | Automated Supabase point-in-time recovery (PITR) requires Pro/Team tier verification                                        |         NO          |
| **Deployment**                  |     **FAIL**     | Local git branch `phase-4.5-production-hardening` uncommitted and unmerged; production running stale commit                 |    **YES (P0)**     |
| **Testing**                     |   **PARTIAL**    | 26/26 test suites / 329 tests pass; zero live Supabase RLS integration tests                                                |       NO (P2)       |

---

## 2. Definitive Production Blockers (Must Fix Before Launch)

### Blocker 1: Production Deployment (P0)

- **Problem**: The live website at `https://dairy.mtkcodex.site` does not have the current codebase. The `/api/system/health` endpoint returns **401 Unauthorized** because local middleware fixes remain uncommitted on branch `phase-4.5-production-hardening`.
- **Action Required**: Commit working branch, merge into `main`, and trigger Vercel deployment.

### Blocker 2: Clerk Production Keys (P0)

- **Problem**: Production operates with Clerk test sandbox credentials (`pk_test_...`, `sk_test_...`). Real customer accounts and production billing cannot function in test mode.
- **Action Required**: Create production Clerk instance, obtain `pk_live_...` and `sk_live_...`, configure production domain `dairy.mtkcodex.site`, and update Vercel environment variables.

### Blocker 3: Broken RLS Write Casts on Clerk Tenant IDs (P1)

- **Problem**: INSERT, UPDATE, and DELETE policies on 14 tables cast `(tenant_id)::uuid`. PostgreSQL errors with `22P02: invalid input syntax for type uuid` on standard Clerk organization IDs (`org_...`).
- **Action Required**: Run migration dropping and recreating all write policies to use `user_is_member_of_tenant(tenant_id)` without `::uuid` cast.

### Blocker 4: Disconnected Animal Quota Gate (P1)

- **Problem**: `AnimalService.createAnimal()` and `POST /api/animals` do not enforce subscription animal limits. Free tier users can create unlimited animals.
- **Action Required**: Add `checkTenantAnimalQuota(context.tenantId)` check inside `createAnimal` and return HTTP 403 / Upgrade Required if quota is exceeded.

### Blocker 5: In-Memory Webhook Replay Cache in Serverless (P1)

- **Problem**: `src/app/api/webhooks/clerk/route.ts` uses an in-memory `Map` that is not shared across Vercel serverless lambda containers.
- **Action Required**: Replace in-memory `processedWebhooks` with atomic check against Upstash Redis or a PostgreSQL `webhook_events` table.

---

## 3. Recommended Development Priorities Before Phase 7

1. **Deploy Remediation Batch**: Merge `phase-4.5-production-hardening` into `main` and deploy to Vercel.
2. **Execute RLS Write Policy Fix Migration**: Correct the `(tenant_id)::uuid` cast across all 14 tables.
3. **Enforce Animal Quota in API**: Call `checkTenantAnimalQuota` in `AnimalService.createAnimal()`.
4. **Provision Clerk Live Instance**: Swap environment variables to live keys in Vercel dashboard.
5. **Decouple Firebase in Payment Callbacks**: Store payment intents in PostgreSQL instead of Firestore.
