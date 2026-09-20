# Malik Tech Dairy — Production Disaster Recovery & Business Continuity Plan

**Document Version:** 1.0.0
**Phase:** 5.5 Production Launch Readiness Audit
**Date:** September 2026
**Target Environment:** Production (https://dairy.mtkcodex.site)
**Hosting Infrastructure:** Vercel (Next.js Application), Supabase (PostgreSQL Database), Clerk (Authentication), Cloudinary (Media Storage), Resend (Transactional Email), Upstash (Redis Queue/Rate Limiting)

---

## 1. Overview & Objective

This document defines operational procedures, recovery objectives, limitations, and runbooks for business continuity and disaster recovery (DR) of the Malik Tech Dairy SaaS platform.

### Key Recovery Metrics

- **Recovery Point Objective (RPO):** Maximum acceptable data loss window.
  - _PostgreSQL Database (Supabase):_ 24 hours via daily automated snapshots on managed Supabase (or < 5 minutes if Point-In-Time-Recovery PITR is enabled).
  - _Media Files (Cloudinary):_ 0 hours (cloud-replicated distributed storage).
  - _Source Code & Schema Migrations:_ 0 hours (Git commit history on GitHub).
- **Recovery Time Objective (RTO):** Target time to restore service after an outage.
  - _Vercel Deployment Rollback:_ < 5 minutes (Instant deployment promotion).
  - _Supabase Database Snapshot Restoration:_ 15-45 minutes.
  - _DNS / Edge Failover:_ 5-15 minutes (TTL dependent).

---

## 2. Inventory: What Is Backed Up vs. What Is NOT Backed Up

| Component                     | Provider / System                         | Backup Mechanism                             | Location                              | Frequency / Retention                                        |
| :---------------------------- | :---------------------------------------- | :------------------------------------------- | :------------------------------------ | :----------------------------------------------------------- |
| **Application Source Code**   | GitHub (Kaashmalik/malik-tech-dairy)      | Distributed Git repositories                 | GitHub Cloud + Local Developer Clones | Continuous on push / Permanent                               |
| **Database (PostgreSQL)**     | Supabase Managed Postgres                 | Automated daily pg_dump / WAL-G              | Supabase Cloud (AWS S3)               | Daily snapshots (7-day retention on Pro; PITR on Enterprise) |
| **Database Migrations**       | Git (scripts/migrations/, Drizzle schema) | Versioned SQL files in repository            | GitHub repository                     | Versioned with code releases                                 |
| **User Identity & Auth**      | Clerk SaaS                                | Multi-AZ redundant managed auth database     | Clerk Infrastructure (AWS)            | Continuous real-time replication                             |
| **Media & Attachments**       | Cloudinary                                | Distributed cloud CDN asset storage          | Cloudinary AWS S3 storage             | Managed redundancy                                           |
| **Environment Configuration** | Vercel Project Dashboard                  | Vercel Environment Variables encrypted store | Vercel Cloud                          | Snapshot per production release                              |

### What Is NOT Backed Up Automatically (Explicit Limitations)

1. **Local Developer SQLite / Temporary DBs:** Transient and not backed up.
2. **Ephemeral In-Memory / Upstash Redis Caches:** Non-persistent cache keys, rate-limit counters, and active BullMQ queues are not backed up across redis flush events.
3. **Automated Cross-Region Failover:** There is currently NO automated multi-cloud hot-standby database failover. Supabase is single-region provisioned.
4. **Third-Party Payment Gateways (JazzCash / EasyPaisa / XPay):** Transaction logs at the payment processors reside exclusively within merchant portals; only callback confirmations are stored in Supabase.

---

## 3. Database Recovery Procedures

### 3.1 Point-in-Time Recovery / Snapshot Restore (Supabase)

In the event of database corruption, accidental catastrophic deletion, or schema corruption:

1. **Access Supabase Dashboard:** Navigate to database backups panel.
2. **Select Snapshot:** Choose the most recent clean daily backup or choose PITR timestamp.
3. **Execute Restore:** Initiate restore to target database instance. Note: Connections will terminate during restoration.
4. **Post-Restore Integrity Check:** Run verify:migration and verify critical tables (tenants, platform_users, tenant_members, animals, milk_logs, payments).

### 3.2 Manual Database Dump (Pre-Release Safeguard)

Before applying breaking schema migrations in production, operators must perform a manual snapshot via pg_dump or Supabase CLI.

---

## 4. Deployment Rollback Procedures (Vercel)

### 4.1 Instant Rollback via Vercel Dashboard (< 2 minutes)

1. Navigate to Vercel Deployments dashboard.
2. Locate the previous healthy deployment that passed verification.
3. Select Instant Rollback / Promote to Production.
4. Traffic immediately shifts to the previous immutable deployment artifact.

### 4.2 Git Rollback

Revert the breaking commit on main branch and push to trigger automated CI/CD deployment.

---

## 5. Environment Variables & Secret Restoration

1. Reference authoritative template: docs/PRODUCTION-ENVIRONMENT-MATRIX.md and .env.example.
2. Retrieve backup credentials from the secure organizational vault.
3. Update Vercel Environment Variables and trigger a redeployment to apply variables to edge and serverless runtimes.

---

## 6. Media & File Recovery (Cloudinary)

Cloudinary retains deleted assets in the backup bucket if configured in Cloudinary Settings.
If credentials are compromised, immediately rotate CLOUDINARY_API_SECRET in Cloudinary Console, update Vercel environment variables, and redeploy.

---

## 7. Disaster Recovery Runbook Checklist

- [ ] Triage: Confirm outage scope via Sentry and Vercel Monitoring.
- [ ] Communication: Post status update for stakeholders.
- [ ] Decision Point: Code rollback (Vercel) vs DB restore (Supabase) vs Vendor status wait.
- [ ] Verification: Probe health endpoint: GET https://dairy.mtkcodex.site/api/system/health
- [ ] Post-Mortem: Document root cause, recovery timeline, and preventive actions.
