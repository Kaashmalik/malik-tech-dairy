# MTK DAIRY — CODE ↔ DATABASE RECONCILIATION

## 2026-09-20 — Drizzle Schema vs Actual Supabase Database

---

## RECONCILIATION MATRIX — Core Production Tables

| Entity               | Drizzle Schema | SQL Migration | Actual DB   | API Route              | Frontend UI   | Status     |
| -------------------- | -------------- | ------------- | ----------- | ---------------------- | ------------- | ---------- |
| tenants              | ✅             | ✅            | ✅ (0 rows) | /api/tenants           | Dashboard     | ✅ ALIGNED |
| platform_users       | ✅             | ✅            | ✅ (0 rows) | /api/users             | Settings      | ✅ ALIGNED |
| tenant_members       | ✅             | ✅            | ✅ (0 rows) | /api/tenants           | Staff         | ✅ ALIGNED |
| subscriptions        | ✅             | ✅            | ✅ (0 rows) | /api/subscription      | Settings      | ✅ ALIGNED |
| animals              | ✅             | ✅            | ✅ (0 rows) | /api/animals           | Animals page  | ✅ ALIGNED |
| milk_logs            | ✅             | ✅            | ✅ (0 rows) | /api/milk              | Milk page     | ✅ ALIGNED |
| health_records       | ✅             | ✅            | ✅ (0 rows) | /api/health            | Health page   | ✅ ALIGNED |
| breeding_records     | ✅             | ✅            | ✅ (0 rows) | /api/breeding          | Breeding page | ✅ ALIGNED |
| expenses             | ✅             | ✅            | ✅ (0 rows) | /api/expenses          | Finance page  | ✅ ALIGNED |
| sales                | ✅             | ✅            | ✅ (0 rows) | /api/sales             | Finance page  | ✅ ALIGNED |
| payments             | ✅             | ✅            | ✅ (0 rows) | /api/payments          | Payments      | ✅ ALIGNED |
| farm_applications    | ✅             | ✅            | ✅ (0 rows) | /api/farm-applications | Apply page    | ✅ ALIGNED |
| audit_logs           | ✅             | ✅            | ✅ (0 rows) | —                      | Admin         | ✅ ALIGNED |
| api_keys             | ✅             | ✅            | ✅ (0 rows) | /api/api-keys          | Settings      | ✅ ALIGNED |
| custom_fields_config | ✅             | ✅            | ✅ (0 rows) | —                      | Settings      | ✅ ALIGNED |
| file_uploads         | ✅             | ✅            | ✅ (0 rows) | /api/upload            | Various       | ✅ ALIGNED |
| vaccinations         | ✅             | ✅            | ✅ (0 rows) | /api/veterinary        | Health        | ✅ ALIGNED |
| feed_logs            | ✅             | ✅            | ✅ (0 rows) | /api/feed-management   | Feed page     | ✅ ALIGNED |
| staff                | ✅             | ✅            | ✅ (0 rows) | /api/staff             | Staff page    | ✅ ALIGNED |
| tasks                | ✅             | ✅            | ✅ (0 rows) | /api/staff             | Tasks         | ✅ ALIGNED |
| predictions          | ✅             | ✅            | ✅ (0 rows) | /api/predictions       | AI            | ✅ ALIGNED |
| weather_data         | ✅             | ✅            | ✅ (0 rows) | /api/weather           | Dashboard     | ✅ ALIGNED |

---

## DISCREPANCIES

### Tables in Code but NOT Verified in Service Layer

| Table                   | Drizzle | DB  | API                  | Used?               |
| ----------------------- | ------- | --- | -------------------- | ------------------- |
| genetic_profiles        | ✅      | ✅  | ❓                   | Unclear             |
| feed_inventory          | ✅      | ✅  | /api/feed-management | Needs verification  |
| nutrition_requirements  | ✅      | ✅  | ❓                   | Reference data only |
| computer_vision_records | ✅      | ✅  | ❓                   | Future feature      |
| financial_accounts      | ✅      | ✅  | ❓                   | Future feature      |
| blockchain_transactions | ✅      | ✅  | ❓                   | Future feature      |
| drone_flights           | ✅      | ✅  | ❓                   | Future feature      |
| staff_certifications    | ✅      | ✅  | ❓                   | Future feature      |
| regulatory_compliance   | ✅      | ✅  | ❓                   | Future feature      |
| iot_devices             | ✅      | ✅  | /api/iot             | Future feature      |

### Concepts in Code but Missing Table

| Concept       | Code Reference                    | DB Table   | Status      |
| ------------- | --------------------------------- | ---------- | ----------- |
| Notifications | `src/lib/services/notifications/` | ❌ MISSING | **DRIFT**   |
| Invoices      | Finance service types             | ❌ MISSING | **DRIFT**   |
| Attendance    | Staff management types            | ❌ MISSING | Uses tasks? |

### Enum Drift Summary

| Category                                        | In Drizzle | In Database | Status       |
| ----------------------------------------------- | ---------- | ----------- | ------------ |
| Core enums (subscription, payment, audit, etc.) | 8          | 8           | ✅ ALIGNED   |
| Veterinary enums (disease, medicine, etc.)      | 8          | 3           | ❌ 5 MISSING |
| Feed/Staff/IoT enums                            | 7          | 0           | ❌ 7 MISSING |
| Quality enums                                   | 2          | 0           | ❌ 2 MISSING |

---

## COLUMN-LEVEL VERIFICATION (Key Tables)

### tenants

| Column     | Drizzle Type | DB Type                     | DB Nullable | DB Default | Match? |
| ---------- | ------------ | --------------------------- | ----------- | ---------- | ------ |
| id         | text PK      | text                        | NO          | —          | ✅     |
| slug       | varchar(255) | character varying(255)      | NO          | —          | ✅     |
| farm_name  | varchar(255) | character varying(255)      | NO          | —          | ✅     |
| currency   | varchar(3)   | character varying(3)        | YES         | 'PKR'      | ✅     |
| created_at | timestamp    | timestamp without time zone | NO          | now()      | ✅     |
| updated_at | timestamp    | timestamp without time zone | NO          | now()      | ✅     |

### animals

| Column         | Drizzle Type | DB Type               | DB Nullable | Match? |
| -------------- | ------------ | --------------------- | ----------- | ------ |
| id             | text PK      | text                  | NO          | ✅     |
| tenant_id      | text FK      | text                  | NO          | ✅     |
| tag            | varchar(50)  | character varying(50) | NO          | ✅     |
| species        | varchar(20)  | character varying(20) | NO          | ✅     |
| gender         | varchar(10)  | character varying(10) | NO          | ✅     |
| status         | varchar(20)  | character varying(20) | NO          | ✅     |
| purchase_price | integer      | integer               | YES         | ✅     |
| weight         | integer      | integer               | YES         | ✅     |

### milk_logs

| Column    | Drizzle Type | DB Type               | DB Nullable | Match? |
| --------- | ------------ | --------------------- | ----------- | ------ |
| id        | text PK      | text                  | NO          | ✅     |
| tenant_id | text FK      | text                  | NO          | ✅     |
| animal_id | text FK      | text                  | NO          | ✅     |
| date      | varchar(10)  | character varying(10) | NO          | ✅     |
| session   | varchar(10)  | character varying(10) | NO          | ✅     |
| quantity  | integer      | integer               | NO          | ✅     |

**Note**: milk quantity stored as integer (ml). No decimal/float concern.

### payments

| Column         | Drizzle Type    | DB Type      | DB Nullable | Match? |
| -------------- | --------------- | ------------ | ----------- | ------ |
| id             | text PK         | text         | NO          | ✅     |
| amount         | integer         | integer      | NO          | ✅     |
| gateway        | payment_gateway | USER-DEFINED | NO          | ✅     |
| status         | payment_status  | USER-DEFINED | NO          | ✅     |
| transaction_id | text            | text         | YES         | ✅     |

---

## ARCHITECTURE MAP

```
                    ┌─────────────────────┐
                    │     Browser (PWA)    │
                    └──────────┬──────────┘
                               │
                    ┌──────────▼──────────┐
                    │  Next.js 15 (Vercel) │
                    │    App Router        │
                    └──────────┬──────────┘
                               │
          ┌────────────────────┼────────────────────┐
          │                    │                    │
    ┌─────▼─────┐      ┌──────▼──────┐     ┌──────▼──────┐
    │   Clerk    │      │  Middleware  │     │  API Routes │
    │  (Auth)    │      │  (Auth+CORS) │     │  53 dirs    │
    │ ⚠️ DEV KEY │      └──────┬──────┘     └──────┬──────┘
    └───────────┘              │                    │
                        ┌──────▼──────┐     ┌──────▼──────┐
                        │ Tenant Ctx  │     │  Services   │
                        │ (context.ts)│     │ 11 domains  │
                        └──────┬──────┘     └──────┬──────┘
                               │                    │
                        ┌──────▼────────────────────▼──────┐
                        │         Drizzle ORM              │
                        │    (service_role key)            │
                        └──────────────┬───────────────────┘
                                       │
                        ┌──────────────▼───────────────────┐
                        │     Supabase PostgreSQL          │
                        │  54 tables, RLS enabled          │
                        │  ⚠️ SELECT policies open         │
                        │  0 rows (never used)             │
                        │  0 storage buckets               │
                        └──────────────────────────────────┘

    External Services:
    ├── Cloudinary (files) ─── ACTIVE (code present)
    ├── Resend (email) ─────── PARTIAL (code present, unverified)
    ├── Upstash (rate limit) ─ PARTIAL (code present, unverified)
    ├── Sentry (monitoring) ── PARTIAL (conditional on DSN)
    ├── PostHog (analytics) ── PARTIAL (conditional on key)
    ├── JazzCash (payments) ── BLOCKED (no credentials)
    ├── EasyPaisa (payments) ─ BLOCKED (no credentials)
    ├── XPay (payments) ────── BLOCKED (no credentials)
    ├── Groq (AI) ──────────── BLOCKED (no API key)
    ├── OpenWeatherMap ──────── PARTIAL (key exposure concern)
    └── Firebase ───────────── LEGACY (SDK present, unclear usage)
```
