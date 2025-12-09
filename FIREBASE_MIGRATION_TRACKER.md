# Firebase to Supabase Migration Tracker

## Overview

This document tracks the progress of migrating API routes from Firebase Firestore to Supabase PostgreSQL.

## Migration Status

### ✅ Completed (Using Supabase)

- [x] `/api/admin/*` - Admin operations
- [x] `/api/farm-applications/*` - Farm application workflow
- [x] `/api/tenants/*` - Tenant management
- [x] `/api/subscription/*` - Subscription management
- [x] `/api/payments/*` - Payment processing
- [x] `/api/webhooks/clerk` - Clerk webhook handler
- [x] `/api/user/*` - User management
- [x] `/api/v2/milk` - New milk API (Supabase)
- [x] `/api/v2/health` - New health API (Supabase)

### ✅ Recently Migrated

- [x] `/api/animals/route.ts` - Main animals route (Supabase)
- [x] `/api/animals/enhanced/route.ts` - Enhanced animals route (Supabase)
- [x] `/api/milk/route.ts` - Milk logs (Supabase)
- [x] `/api/health/records/route.ts` - Health records (Supabase)
- [x] `/api/breeding/route.ts` - Breeding records (Supabase)

### ✅ Dynamic Routes Migrated

- [x] `/api/animals/[id]/route.ts` - Migrated to Supabase
- [x] `/api/health/records/[id]/route.ts` - Migrated to Supabase
- [x] `/api/breeding/[id]/route.ts` - Migrated to Supabase

### ⏳ Pending Migration

- [ ] `/api/expenses/*` - Needs migration
- [ ] `/api/sales/*` - Needs migration
- [ ] `/api/predictions/*` - Needs migration
- [ ] `/api/analytics/*` - Needs migration

## Firebase Dependencies Found

Files still importing from Firebase:

```
src/lib/firebase/tenant.ts - getTenantSubcollection()
src/lib/firebase/client.ts - Firebase client initialization
src/lib/firebase/admin.ts - Firebase Admin SDK
src/lib/firebase/realtime.ts - Realtime subscriptions
src/lib/firebase/activity-feed.ts - Activity feed operations
```

## Migration Strategy

### Phase 1: Dual-Write Mode

1. Update API routes to write to both Firebase and Supabase
2. Use feature flag to control read source
3. Validate data consistency

### Phase 2: Read from Supabase

1. Switch reads to Supabase
2. Keep Firebase writes for backup
3. Monitor for issues

### Phase 3: Firebase Deprecation

1. Remove Firebase writes
2. Update all imports
3. Remove Firebase dependencies (optional - keep for activity feeds)

## Commands

```bash
# Push Drizzle schema to Supabase
npm run db:push

# Verify migration status
npm run verify:migration

# Run migration script
npx tsx scripts/migrate-to-supabase.ts
```

## Known Issues

### ✅ `src/app/api/animals/enhanced/route.ts` - FIXED

This file was rewritten to use Supabase REST API with the existing schema fields.

- Now uses `getSupabaseClient()` instead of Drizzle ORM
- Simplified filtering with available schema fields
- Working pagination and filter options

### ✅ `src/app/api/milk/route.ts` - MIGRATED

Migrated from Firebase to Supabase REST API.

- Uses `milk_logs` table
- Supports filtering by date, animalId, date ranges

### ✅ `src/app/api/health/records/route.ts` - MIGRATED

Migrated from Firebase to Supabase REST API.

- Uses `health_records` table
- Maintains encryption for sensitive notes

### ✅ `src/app/api/breeding/route.ts` - MIGRATED

Migrated from Firebase to Supabase REST API.

- Uses `breeding_records` table
- Auto-calculates expected calving date (280 days)

## Notes

- Firebase Firestore is now only used for real-time activity feeds (50K reads/day limit)
- Supabase Realtime can replace Firebase for subscriptions
- Keep Firebase for now as backup, plan full removal post-validation

## Last Updated

December 2024
