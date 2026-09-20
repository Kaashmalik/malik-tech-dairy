# Code ↔ Migration ↔ Database Final Reconciliation Report

**Audited Systems**:

1. Application Code & Drizzle Schema: `src/db/schema.ts`, `src/db/diseases-medicines-schema.ts`
2. SQL Migration Scripts: `scripts/migrations/001_...` through `005_...`
3. Live Supabase PostgreSQL Database: Supabase MCP execution inspection
   **Audit Date**: September 20, 2026  
   **Status**: RECONCILED (Drift Identified Below)

---

## 1. Schema & Component Reconciliation Matrix

| Component                 | Code (Drizzle / TS)                                                     | Migration Files                                | Live PostgreSQL                                                |    Reconciliation Status    |
| :------------------------ | :---------------------------------------------------------------------- | :--------------------------------------------- | :------------------------------------------------------------- | :-------------------------: |
| **Public Tables**         | 55 tables defined across `schema.ts` and `diseases-medicines-schema.ts` | Complete DDL scripts in `scripts/`             | 55 tables in `information_schema.tables`                       |      **MATCH (100%)**       |
| **PostgreSQL ENUMs**      | 26 enums defined                                                        | Created in initial + migration 003             | 26 enums in `pg_type`                                          |      **MATCH (100%)**       |
| **Notifications Table**   | Defined in `schema.ts`                                                  | `005_create_notifications_table.sql`           | Exists with 10 columns & indexes                               |      **MATCH (100%)**       |
| **Financial Constraints** | Drizzle schema uses zod/int                                             | `004_add_financial_check_constraints.sql`      | 5 check constraints in `pg_constraint`                         |      **MATCH (100%)**       |
| **RLS Read Policies**     | Defined in migration 002                                                | `002_fix_rls_select_and_breeding_policies.sql` | Applied to live database                                       |          **MATCH**          |
| **RLS Write Policies**    | Legacy UUID cast in migrations                                          | Migration 002 did not update write policies    | Uses `(tenant_id)::uuid`                                       | **DRIFT / CRITICAL DEFECT** |
| **Storage Buckets**       | Cloudinary primary, Supabase secondary                                  | Configured via Supabase MCP                    | 4 buckets (`animals`, `payment-slips`, `documents`, `exports`) |          **MATCH**          |

---

## 2. PostgreSQL ENUMs In-Depth Reconciliation

| ENUM Name                 | Code Source                    | Code Values                                       | Database Values (`pg_enum`)                        |  Drift Status  |
| :------------------------ | :----------------------------- | :------------------------------------------------ | :------------------------------------------------- | :------------: |
| `disease_category`        | `schema.ts`                    | 8 values                                          | 8 values identical                                 | **IDENTICAL**  |
| `disease_severity`        | `schema.ts`                    | 4 values                                          | 4 values identical                                 | **IDENTICAL**  |
| `treatment_outcome`       | `schema.ts`                    | 6 values                                          | 6 values identical                                 | **IDENTICAL**  |
| `vaccine_type`            | `schema.ts`                    | 6 values                                          | 6 values identical                                 | **IDENTICAL**  |
| `vaccination_status`      | `schema.ts`                    | 5 values                                          | 5 values identical                                 | **IDENTICAL**  |
| `protocol_type`           | `schema.ts`                    | 4 values                                          | 4 values identical                                 | **IDENTICAL**  |
| `feed_type`               | `schema.ts`                    | 6 values                                          | 6 values identical                                 | **IDENTICAL**  |
| `feed_unit`               | `schema.ts`                    | 4 values                                          | 4 values identical                                 | **IDENTICAL**  |
| `task_status`             | `schema.ts`                    | 5 values                                          | 5 values identical                                 | **IDENTICAL**  |
| `task_priority`           | `schema.ts`                    | 4 values                                          | 4 values identical                                 | **IDENTICAL**  |
| `attendance_status`       | `schema.ts`                    | 4 values                                          | 4 values identical                                 | **IDENTICAL**  |
| `device_type`             | `schema.ts`                    | 6 values                                          | 6 values identical                                 | **IDENTICAL**  |
| `device_status`           | `schema.ts`                    | 5 values                                          | 5 values identical                                 | **IDENTICAL**  |
| `quality_grade`           | `schema.ts`                    | 5 values                                          | 5 values identical                                 | **IDENTICAL**  |
| `test_status`             | `schema.ts`                    | 4 values                                          | 4 values identical                                 | **IDENTICAL**  |
| `medicine_form`           | `diseases-medicines-schema.ts` | 14 values (missing `solution`, `oral_suspension`) | 16 values (includes `solution`, `oral_suspension`) | **CODE DRIFT** |
| `administration_route`    | `diseases-medicines-schema.ts` | 10 values                                         | 10 values identical                                | **IDENTICAL**  |
| `subscription_plan`       | `schema.ts`                    | 4 values                                          | 4 values identical                                 | **IDENTICAL**  |
| `subscription_status`     | `schema.ts`                    | 6 values                                          | 6 values identical                                 | **IDENTICAL**  |
| `payment_gateway`         | `schema.ts`                    | 4 values                                          | 4 values identical                                 | **IDENTICAL**  |
| `payment_status`          | `schema.ts`                    | 5 values                                          | 5 values identical                                 | **IDENTICAL**  |
| `user_platform_role`      | `schema.ts`                    | 3 values                                          | 3 values identical                                 | **IDENTICAL**  |
| `storage_provider`        | `schema.ts`                    | 2 values                                          | 2 values identical                                 | **IDENTICAL**  |
| `audit_action`            | `schema.ts`                    | 6 values                                          | 6 values identical                                 | **IDENTICAL**  |
| `farm_application_status` | `schema.ts`                    | 5 values                                          | 5 values identical                                 | **IDENTICAL**  |
| `medicine_category`       | `diseases-medicines-schema.ts` | 18 values                                         | 18 values identical                                | **IDENTICAL**  |

---

## 3. Specific Drift Items Identified

### Drift Item 1: `medicine_form` TypeScript Definition

- In `src/db/diseases-medicines-schema.ts`, `medicineFormEnum` defines 14 forms:
  `['injection', 'oral_liquid', 'oral_powder', 'bolus', 'tablet', 'capsule', 'paste', 'ointment', 'spray', 'pour_on', 'drench', 'intramammary', 'implant', 'suspension']`.
- In the live PostgreSQL database, `medicine_form` has 16 values, including:
  `'solution'` and `'oral_suspension'`.
- **Remediation Required**: Update `src/db/diseases-medicines-schema.ts` to include `'solution'` and `'oral_suspension'` to eliminate typing mismatch.

### Drift Item 2: Currency Units in Financial Tables

- In `src/db/schema.ts`, `payments.amount` is documented as "Amount in smallest currency unit" (paise, 100x multiplier).
- In `expenses.amount` and `sales.total`, amounts are stored in whole PKR.
- No database CHECK constraint or trigger prevents confusion between whole PKR and paise.

### Drift Item 3: Missing Generated Constraint on `sales.total`

- In `sales`, `total` is a standard `integer` column without a CHECK constraint verifying that `total = quantity * price_per_unit`.
- A client mutation could insert mismatched quantities and totals without database rejection.

---

## 4. Database Truth Inventory Summary

- **Total Tables**: 55
- **Total Enums**: 26
- **Check Constraints**: 16 (including 5 financial/quantity integrity checks)
- **RLS Status**: Enabled on all 55 tables (100%)
- **Storage Buckets**: 4 configured
