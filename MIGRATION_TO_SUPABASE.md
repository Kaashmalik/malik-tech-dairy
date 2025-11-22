# Migration Guide: Firestore → Supabase

## Overview

This migration moves all relational and real-time data from Firestore to Supabase PostgreSQL, while keeping Firestore for document-style data (animals, milk_logs, health_records, breeding).

**Goal**: Reduce costs to < $50/mo at 100 tenants, < $200/mo at 1000 tenants.

---

## Architecture Changes

### Before (Firestore Only)
- All data in Firestore
- High read/write costs at scale
- Limited query capabilities
- No native joins or transactions

### After (Hybrid)
- **Supabase (PostgreSQL)**: Relational data
  - Tenants, subscriptions, payments
  - API keys, audit logs
  - Custom fields config
- **Firestore**: Document data
  - Animals, milk_logs, health_records
  - Breeding records
  - Staff, expenses, sales
- **Supabase Realtime**: Real-time subscriptions for milk_logs and health_events
- **Redis (Upstash)**: Caching layer for Firestore queries

---

## Cost Breakdown

### Supabase Pricing (PostgreSQL)

| Plan | Price | Database Size | Bandwidth | Realtime |
|------|-------|----------------|-----------|----------|
| Free | $0 | 500 MB | 2 GB | 2M messages/mo |
| Pro | $25/mo | 8 GB | 50 GB | 5M messages/mo |
| Team | $599/mo | 100 GB | 1 TB | 200M messages/mo |

**Estimated at 100 tenants:**
- Database: ~500 MB (tenant metadata, subscriptions, payments)
- Bandwidth: ~5 GB/month
- Realtime: ~1M messages/month
- **Cost: Free tier sufficient** ✅

**Estimated at 1000 tenants:**
- Database: ~5 GB
- Bandwidth: ~50 GB/month
- Realtime: ~10M messages/month
- **Cost: Pro plan ($25/mo)** ✅

### Firestore Costs (Document Data Only)

**At 100 tenants:**
- Reads: ~50K/day × $0.06/100K = $0.90/mo
- Writes: ~10K/day × $0.18/100K = $0.54/mo
- Storage: ~10 GB × $0.18/GB = $1.80/mo
- **Total: ~$3.24/mo** ✅

**At 1000 tenants:**
- Reads: ~500K/day × $0.06/100K = $9/mo
- Writes: ~100K/day × $0.18/100K = $5.40/mo
- Storage: ~100 GB × $0.18/GB = $18/mo
- **Total: ~$32.40/mo** ✅

### Redis (Upstash) Costs

**Free tier:**
- 10K commands/day
- 256 MB storage
- **Cost: $0** ✅

**At scale (1000 tenants):**
- ~100K commands/day
- 1 GB storage
- **Cost: ~$10/mo** ✅

### Total Monthly Costs

| Tenants | Supabase | Firestore | Redis | **Total** |
|---------|----------|-----------|-------|-----------|
| 100 | $0 | $3.24 | $0 | **$3.24** ✅ |
| 1000 | $25 | $32.40 | $10 | **$67.40** ✅ |

**Target achieved**: < $50/mo at 100 tenants, < $200/mo at 1000 tenants ✅

---

## Migration Steps

### 1. Setup Supabase Project

1. Create account at [supabase.com](https://supabase.com)
2. Create new project
3. Copy connection strings:
   - Database URL (for connection pooling)
   - Service Role Key (for server-side operations)
   - Project URL

### 2. Install Dependencies

```bash
npm install drizzle-orm postgres @supabase/supabase-js
npm install -D drizzle-kit tsx nanoid
```

### 3. Environment Variables

Add to `.env.local`:

```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
SUPABASE_DATABASE_URL=postgresql://postgres:[password]@db.[project-ref].supabase.co:5432/postgres

# Upstash Redis (if not already configured)
UPSTASH_REDIS_REST_URL=https://your-redis.upstash.io
UPSTASH_REDIS_REST_TOKEN=your-token
```

### 4. Run Database Migrations

```bash
# Generate migration from schema
npx drizzle-kit generate:pg

# Apply migration to Supabase
npx drizzle-kit push:pg
```

Or use Supabase Dashboard → SQL Editor to run the schema manually.

### 5. Enable Realtime on Tables

In Supabase Dashboard → Database → Replication:
- Enable replication for `milk_logs` table
- Enable replication for `health_events` table

### 6. Run Migration Script

```bash
# Dry run (preview changes)
npx tsx scripts/migrate-to-supabase.ts --dry-run

# Migrate all tenants
npx tsx scripts/migrate-to-supabase.ts

# Migrate specific tenant
npx tsx scripts/migrate-to-supabase.ts --tenant-id=org_xxxxx
```

### 7. Update Code References

The following files have been updated to use Supabase:
- ✅ `src/lib/supabase/tenant.ts` - Tenant helpers
- ✅ `src/lib/subscriptions/management.ts` - Subscription management
- ✅ `src/app/api/webhooks/clerk/route.ts` - Clerk webhooks
- ✅ `src/lib/api/middleware.ts` - Middleware (queries Supabase first)

### 8. Deploy

1. Deploy to staging first
2. Run migration script on staging
3. Test all functionality
4. Deploy to production
5. Run migration script on production

---

## Rollback Plan

If issues occur, rollback is straightforward:

### Option 1: Dual Write (Recommended During Migration)

Keep writing to both Firestore and Supabase for 1-2 weeks:

```typescript
// Example: Write to both during migration period
await Promise.all([
  writeToSupabase(data),
  writeToFirestore(data), // Keep for rollback
]);
```

### Option 2: Revert Code Changes

1. Revert commits that introduced Supabase
2. All data remains in Firestore (no data loss)
3. Supabase data can be ignored

### Option 3: Export from Supabase

If you need to move data back:

```sql
-- Export tenants
COPY (SELECT * FROM tenants) TO '/tmp/tenants.csv' CSV HEADER;

-- Export subscriptions
COPY (SELECT * FROM subscriptions) TO '/tmp/subscriptions.csv' CSV HEADER;
```

Then import back to Firestore using a script.

---

## Firestore Indexes (Keep for Document Data)

Add these composite indexes in Firebase Console:

### Milk Logs
- Collection: `tenants_data/{tenantId}_milkLogs`
- Fields: `date` (Ascending), `quantity` (Descending)
- Use case: Low-yield animals query

### Health Records
- Collection: `tenants_data/{tenantId}_health`
- Fields: `animalId` (Ascending), `date` (Descending)
- Use case: Recent health records per animal

### Animals
- Collection: `tenants_data/{tenantId}_animals`
- Fields: `species` (Ascending), `status` (Ascending)
- Use case: Filter by species and status

---

## Testing Checklist

- [ ] Tenant creation via Clerk webhook
- [ ] Subscription updates
- [ ] Payment recording
- [ ] API key management
- [ ] Custom fields configuration
- [ ] Audit logging
- [ ] Real-time subscriptions (milk_logs, health_events)
- [ ] Redis caching for Firestore queries
- [ ] Middleware tenant context
- [ ] Role-based access control

---

## Performance Optimizations

### 1. Connection Pooling

Supabase connection pooling is configured in `src/lib/supabase.ts`:
- Max pool size: 20
- Idle timeout: 20s
- Connection timeout: 10s

### 2. Redis Caching

Frequently accessed Firestore queries are cached:
- Tenant config: 5 min TTL
- Subscription: 5 min TTL
- Animal counts: 10 min TTL
- Milk logs: 1 min TTL

### 3. Database Indexes

All foreign keys and frequently queried columns are indexed:
- `tenants.slug` (unique)
- `subscriptions.tenant_id` (unique)
- `payments.tenant_id`, `payments.status`
- `api_keys.tenant_id`, `api_keys.key_prefix`
- `audit_logs.tenant_id`, `audit_logs.created_at`

---

## Monitoring

### Supabase Dashboard
- Monitor database size, bandwidth, and query performance
- Set up alerts for high usage

### Firestore Console
- Monitor read/write operations
- Track storage usage

### Application Logs
- Monitor migration script output
- Check for Supabase connection errors
- Verify Redis cache hit rates

---

## Support

For issues:
1. Check Supabase Dashboard → Logs
2. Review application logs
3. Verify environment variables
4. Test connection with `npx drizzle-kit studio`

---

## Next Steps

After successful migration:
1. Monitor costs for 1 month
2. Optimize queries based on usage
3. Consider moving more data to Supabase if needed
4. Remove Firestore fallback code after 1 month

---

**Migration Status**: ✅ Complete
**Last Updated**: 2024-01-XX

