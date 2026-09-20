# Row Level Security (RLS) Forensic & Security Verification Audit

**Audited Database**: Supabase PostgreSQL (`public` and `storage` schemas)  
**Date**: September 20, 2026  
**Auditor**: Antigravity Adversarial Verification Agent  
**Status**: COMPLETE

---

## 1. Critical RLS Identity Chain Forensic Audit

### 1.1 Identity Mapping Architecture

In the MTK Dairy architecture, authentication is provided by **Clerk**, while data persistence is handled by **PostgreSQL (Supabase)**.

```mermaid
flowchart TD
    subgraph Clerk ["Clerk Identity Provider"]
        CU[Clerk User: user_xxx]
        CO[Clerk Organization: org_xxx]
        CR[Org Role: org:admin / org:member]
    end

    subgraph API ["Next.js Server API Layer"]
        AUTH[auth from @clerk/nextjs/server]
        CTX[getTenantContext]
        DRZ[getDrizzle / Service Role Pool]
    end

    subgraph DB ["Supabase PostgreSQL Database"]
        TM[tenant_members: user_id = user_xxx, tenant_id = org_xxx]
        PU[platform_users: id = user_xxx]
        T[tenants: id = org_xxx]
        REC[tenant-scoped records: tenant_id = org_xxx]
        FN[user_is_member_of_tenant]
    end

    CU --> AUTH
    CO --> AUTH
    AUTH --> CTX
    CTX --> DRZ
    DRZ -- Bypasses RLS -- Direct Query --> REC

    CU -. If Supabase JWT minted .-> JWT[Supabase JWT: sub = user_xxx]
    JWT --> FN
    FN --> TM
    TM --> REC
```

### 1.2 Analysis of `sub` Claim

- **Clerk `userId`**: Formatted as `user_...` (e.g. `user_36OD5mI59b8m6dHyG8S3q6x4tmD`).
- **Clerk `orgId`**: Formatted as `org_...` (e.g. `org_36Pn5ejZHWxT3ZdlWh4Fr2vS1Cc`).
- When Clerk mints a JWT for Supabase (or standard OIDC), the JWT claim `sub` represents the **authenticated user ID** (`user_...`), NOT the organization ID.
- **Evaluation of `tenant_id = (current_setting('request.jwt.claims')::jsonb ->> 'sub')`**:
  - If applied directly to tenant-scoped tables, this comparison would be **FATALLY FLAWED** because `tenant_id` stores `org_...`, while `sub` holds `user_...`.
  - **Audit Verification Result**: Inspection of all active policies in `pg_policies` shows that `current_setting('request.jwt.claims')::jsonb ->> 'sub'` is **NOT USED** on operational tenant tables.
  - Instead, the operational policies use:
    ```sql
    user_is_member_of_tenant(tenant_id)
    ```
    This properly resolves `user_id = auth.uid()::text AND tenant_id = tenant_uuid AND status = 'active'` in `public.tenant_members`.
  - **Verdict on Identity Architecture**: The membership lookup design (`user_is_member_of_tenant`) is semantically sound and correctly bridges Clerk User ID to Clerk Organization ID via `tenant_members`.

---

## 2. Critical Defect: The `(tenant_id)::uuid` Type Cast Bug

### 2.1 The Vulnerability

During migration 002, SELECT policies were dropped and recreated using `user_is_member_of_tenant(tenant_id)` (accepting `text`). However, the existing INSERT, UPDATE, and DELETE policies on 14 operational tables were NOT updated:

```sql
-- Existing broken policy on public.animals:
CREATE POLICY animals_insert_policy ON public.animals
  FOR INSERT TO public
  WITH CHECK ((auth.role() = 'authenticated'::text) AND user_is_member_of_tenant((tenant_id)::uuid));
```

### 2.2 Forensic Reproduction

When an authenticated user attempts to insert or update an animal using the Clerk tenant ID `org_36Pn5ejZHWxT3ZdlWh4Fr2vS1Cc`:

```sql
SELECT ('org_36Pn5ejZHWxT3ZdlWh4Fr2vS1Cc')::uuid;
```

**Database Result**:

```text
ERROR: 22P02: invalid input syntax for type uuid: "org_36Pn5ejZHWxT3ZdlWh4Fr2vS1Cc"
```

### 2.3 Affected Tables

The following tables currently have broken write policies that crash on valid Clerk tenant IDs:

1. `public.animals` (`INSERT`, `UPDATE`, `DELETE`)
2. `public.animal_treatments` (`INSERT`, `UPDATE`, `DELETE`)
3. `public.animal_vaccinations` (`INSERT`, `UPDATE`, `DELETE`)
4. `public.assets` (`UPDATE`, `DELETE`)
5. `public.expenses` (`INSERT`, `UPDATE`, `DELETE`)
6. `public.feed_logs` (`INSERT`, `UPDATE`, `DELETE`)
7. `public.health_records` (`INSERT`, `UPDATE`, `DELETE`)
8. `public.medicine_inventory` (`INSERT`, `UPDATE`, `DELETE`)
9. `public.medicine_logs` (`INSERT`, `UPDATE`, `DELETE`)
10. `public.milk_logs` (`INSERT`, `UPDATE`, `DELETE`)
11. `public.sales` (`INSERT`, `UPDATE`, `DELETE`)
12. `public.tenant_medicine_inventory` (`INSERT`, `UPDATE`, `DELETE`)
13. `public.vaccinations` (`INSERT`, `UPDATE`, `DELETE`)
14. `public.weather_data` (`INSERT`, `UPDATE`, `DELETE`)

_Note: In normal web app usage, the Next.js API routes use `getDrizzle()` or `getSupabaseClient()` with `service_role`, which bypasses RLS and conceals this bug. However, any client-side operation or direct Supabase mutation will fail immediately._

---

## 3. Comprehensive RLS Inventory of All 55 Public Tables

| Table Name                  | RLS Enabled | SELECT Policy                                          | INSERT Policy                                          | UPDATE Policy                         | DELETE Policy                         |       Tenant Isolation Status       |
| :-------------------------- | :---------: | :----------------------------------------------------- | :----------------------------------------------------- | :------------------------------------ | :------------------------------------ | :---------------------------------: |
| `animals`                   |     YES     | `user_is_member_of_tenant(tenant_id)`                  | `user_is_member_of_tenant((tenant_id)::uuid)` [BROKEN] | `(tenant_id)::uuid` [BROKEN]          | `(tenant_id)::uuid` [BROKEN]          | **ISOLATED (READ) / CRASH (WRITE)** |
| `animal_treatments`         |     YES     | `user_is_member_of_tenant((tenant_id)::uuid)` [BROKEN] | `(tenant_id)::uuid` [BROKEN]                           | `(tenant_id)::uuid` [BROKEN]          | `(tenant_id)::uuid` [BROKEN]          |       **CRASH ON WRITE/READ**       |
| `animal_vaccinations`       |     YES     | `user_is_member_of_tenant((tenant_id)::uuid)` [BROKEN] | `(tenant_id)::uuid` [BROKEN]                           | `(tenant_id)::uuid` [BROKEN]          | `(tenant_id)::uuid` [BROKEN]          |       **CRASH ON WRITE/READ**       |
| `api_keys`                  |     YES     | Service Role Only                                      | Service Role Only                                      | Service Role Only                     | Service Role Only                     |        **DENY ALL CLIENTS**         |
| `assets`                    |     YES     | `user_is_member_of_tenant(tenant_id)`                  | Subquery Membership                                    | `(tenant_id)::uuid` [BROKEN]          | `(tenant_id)::uuid` [BROKEN]          |            **ISOLATED**             |
| `audit_logs`                |     YES     | Service Role Only                                      | Service Role Only                                      | Service Role Only                     | Service Role Only                     |        **DENY ALL CLIENTS**         |
| `blockchain_transactions`   |     YES     | Service Role Only                                      | Service Role Only                                      | Service Role Only                     | Service Role Only                     |        **DENY ALL CLIENTS**         |
| `breeding_records`          |     YES     | Service Role Only                                      | Service Role Only                                      | Service Role Only                     | Service Role Only                     |        **DENY ALL CLIENTS**         |
| `computer_vision_records`   |     YES     | Service Role Only                                      | Service Role Only                                      | Service Role Only                     | Service Role Only                     |        **DENY ALL CLIENTS**         |
| `custom_fields_config`      |     YES     | Service Role Only                                      | Service Role Only                                      | Service Role Only                     | Service Role Only                     |        **DENY ALL CLIENTS**         |
| `disease_treatments`        |     YES     | Authenticated (`true`)                                 | Service Role Only                                      | Service Role Only                     | Service Role Only                     |     **REFERENCE DATA (PUBLIC)**     |
| `diseases`                  |     YES     | Authenticated (`true`)                                 | Service Role Only                                      | Service Role Only                     | Service Role Only                     |     **REFERENCE DATA (PUBLIC)**     |
| `drone_flights`             |     YES     | Service Role Only                                      | Service Role Only                                      | Service Role Only                     | Service Role Only                     |        **DENY ALL CLIENTS**         |
| `egg_logs`                  |     YES     | Subquery Membership                                    | Subquery Membership                                    | Subquery Membership                   | Subquery Membership                   |            **ISOLATED**             |
| `email_subscriptions`       |     YES     | Service Role Only                                      | Service Role Only                                      | Service Role Only                     | Service Role Only                     |        **DENY ALL CLIENTS**         |
| `expenses`                  |     YES     | `user_is_member_of_tenant(tenant_id)`                  | `(tenant_id)::uuid` [BROKEN]                           | `(tenant_id)::uuid` [BROKEN]          | `(tenant_id)::uuid` [BROKEN]          | **ISOLATED (READ) / CRASH (WRITE)** |
| `farm_applications`         |     YES     | Service Role Only                                      | Service Role Only                                      | Service Role Only                     | Service Role Only                     |        **DENY ALL CLIENTS**         |
| `farm_id_sequence`          |     YES     | Service Role Only                                      | Service Role Only                                      | Service Role Only                     | Service Role Only                     |        **DENY ALL CLIENTS**         |
| `feature_flags`             |     YES     | Public Read (`true`)                                   | Super Admin Write                                      | Super Admin Write                     | Super Admin Write                     |          **SYSTEM CONFIG**          |
| `feed_inventory`            |     YES     | Service Role Only                                      | Service Role Only                                      | Service Role Only                     | Service Role Only                     |        **DENY ALL CLIENTS**         |
| `feed_logs`                 |     YES     | `user_is_member_of_tenant(tenant_id)`                  | `(tenant_id)::uuid` [BROKEN]                           | `(tenant_id)::uuid` [BROKEN]          | `(tenant_id)::uuid` [BROKEN]          | **ISOLATED (READ) / CRASH (WRITE)** |
| `file_uploads`              |     YES     | Service Role Only                                      | Service Role Only                                      | Service Role Only                     | Service Role Only                     |        **DENY ALL CLIENTS**         |
| `financial_accounts`        |     YES     | Service Role Only                                      | Service Role Only                                      | Service Role Only                     | Service Role Only                     |        **DENY ALL CLIENTS**         |
| `genetic_profiles`          |     YES     | Service Role Only                                      | Service Role Only                                      | Service Role Only                     | Service Role Only                     |        **DENY ALL CLIENTS**         |
| `health_records`            |     YES     | `user_is_member_of_tenant(tenant_id)`                  | `(tenant_id)::uuid` [BROKEN]                           | `(tenant_id)::uuid` [BROKEN]          | `(tenant_id)::uuid` [BROKEN]          | **ISOLATED (READ) / CRASH (WRITE)** |
| `heat_detections`           |     YES     | `user_is_member_of_tenant(tenant_id)`                  | `user_is_member_of_tenant(tenant_id)`                  | `user_is_member_of_tenant(tenant_id)` | `user_is_member_of_tenant(tenant_id)` |     **VERIFIED FULLY ISOLATED**     |
| `iot_devices`               |     YES     | Subquery Membership                                    | Subquery Membership                                    | Subquery Membership                   | Subquery Membership                   |            **ISOLATED**             |
| `medicine_inventory`        |     YES     | `user_is_member_of_tenant(tenant_id)`                  | `(tenant_id)::uuid` [BROKEN]                           | `(tenant_id)::uuid` [BROKEN]          | `(tenant_id)::uuid` [BROKEN]          | **ISOLATED (READ) / CRASH (WRITE)** |
| `medicine_logs`             |     YES     | `user_is_member_of_tenant(tenant_id)`                  | `(tenant_id)::uuid` [BROKEN]                           | `(tenant_id)::uuid` [BROKEN]          | `(tenant_id)::uuid` [BROKEN]          | **ISOLATED (READ) / CRASH (WRITE)** |
| `medicines`                 |     YES     | Authenticated (`true`)                                 | Service Role Only                                      | Service Role Only                     | Service Role Only                     |     **REFERENCE DATA (PUBLIC)**     |
| `migration_alerts`          |     YES     | Super Admin                                            | Service Role Only                                      | Service Role Only                     | Service Role Only                     |         **ADMIN ISOLATED**          |
| `migration_checkpoints`     |     YES     | Super Admin                                            | Service Role Only                                      | Service Role Only                     | Service Role Only                     |         **ADMIN ISOLATED**          |
| `migration_logs`            |     YES     | Super Admin                                            | Service Role Only                                      | Service Role Only                     | Service Role Only                     |         **ADMIN ISOLATED**          |
| `migration_metrics`         |     YES     | Super Admin                                            | Service Role Only                                      | Service Role Only                     | Service Role Only                     |         **ADMIN ISOLATED**          |
| `milk_logs`                 |     YES     | `user_is_member_of_tenant(tenant_id)`                  | `(tenant_id)::uuid` [BROKEN]                           | `(tenant_id)::uuid` [BROKEN]          | `(tenant_id)::uuid` [BROKEN]          | **ISOLATED (READ) / CRASH (WRITE)** |
| `notifications`             |     YES     | `user_is_member_of_tenant(tenant_id)`                  | `user_is_member_of_tenant(tenant_id)`                  | `user_is_member_of_tenant(tenant_id)` | `user_is_member_of_tenant(tenant_id)` |     **VERIFIED FULLY ISOLATED**     |
| `nutrition_requirements`    |     YES     | Service Role Only                                      | Service Role Only                                      | Service Role Only                     | Service Role Only                     |        **DENY ALL CLIENTS**         |
| `payments`                  |     YES     | Service Role Only                                      | Service Role Only                                      | Service Role Only                     | Service Role Only                     |        **DENY ALL CLIENTS**         |
| `platform_users`            |     YES     | `auth.uid() = id` (Own Profile)                        | Service Role Only                                      | Service Role Only                     | Service Role Only                     |          **USER ISOLATED**          |
| `predictions`               |     YES     | Service Role Only                                      | Service Role Only                                      | Service Role Only                     | Service Role Only                     |        **DENY ALL CLIENTS**         |
| `pregnancy_checks`          |     YES     | `user_is_member_of_tenant(tenant_id)`                  | `user_is_member_of_tenant(tenant_id)`                  | `user_is_member_of_tenant(tenant_id)` | `user_is_member_of_tenant(tenant_id)` |     **VERIFIED FULLY ISOLATED**     |
| `regulatory_compliance`     |     YES     | Service Role Only                                      | Service Role Only                                      | Service Role Only                     | Service Role Only                     |        **DENY ALL CLIENTS**         |
| `sales`                     |     YES     | `user_is_member_of_tenant(tenant_id)`                  | `(tenant_id)::uuid` [BROKEN]                           | `(tenant_id)::uuid` [BROKEN]          | `(tenant_id)::uuid` [BROKEN]          | **ISOLATED (READ) / CRASH (WRITE)** |
| `semen_inventory`           |     YES     | `user_is_member_of_tenant(tenant_id)`                  | `user_is_member_of_tenant(tenant_id)`                  | `user_is_member_of_tenant(tenant_id)` | `user_is_member_of_tenant(tenant_id)` |     **VERIFIED FULLY ISOLATED**     |
| `staff`                     |     YES     | Subquery Membership                                    | Subquery Membership                                    | Subquery Membership                   | Subquery Membership                   |            **ISOLATED**             |
| `staff_certifications`      |     YES     | Service Role Only                                      | Service Role Only                                      | Service Role Only                     | Service Role Only                     |        **DENY ALL CLIENTS**         |
| `subscriptions`             |     YES     | Service Role Only                                      | Service Role Only                                      | Service Role Only                     | Service Role Only                     |        **DENY ALL CLIENTS**         |
| `tasks`                     |     YES     | Subquery Membership                                    | Subquery Membership                                    | Subquery Membership                   | Subquery Membership                   |            **ISOLATED**             |
| `tenant_medicine_inventory` |     YES     | `(tenant_id)::uuid` [BROKEN]                           | `(tenant_id)::uuid` [BROKEN]                           | `(tenant_id)::uuid` [BROKEN]          | `(tenant_id)::uuid` [BROKEN]          |   **CRASH ON ALL CLIENT QUERIES**   |
| `tenant_members`            |     YES     | Service Role Only                                      | Service Role Only                                      | Service Role Only                     | Service Role Only                     |        **DENY ALL CLIENTS**         |
| `tenants`                   |     YES     | Service Role Only                                      | Service Role Only                                      | Service Role Only                     | Service Role Only                     |        **DENY ALL CLIENTS**         |
| `treatment_protocols`       |     YES     | Authenticated (`true`)                                 | Service Role Only                                      | Service Role Only                     | Service Role Only                     |     **REFERENCE DATA (PUBLIC)**     |
| `vaccination_schedules`     |     YES     | Authenticated (`true`)                                 | Service Role Only                                      | Service Role Only                     | Service Role Only                     |     **REFERENCE DATA (PUBLIC)**     |
| `vaccinations`              |     YES     | `user_is_member_of_tenant(tenant_id)`                  | `(tenant_id)::uuid` [BROKEN]                           | `(tenant_id)::uuid` [BROKEN]          | `(tenant_id)::uuid` [BROKEN]          | **ISOLATED (READ) / CRASH (WRITE)** |
| `weather_data`              |     YES     | `user_is_member_of_tenant(tenant_id)`                  | `(tenant_id)::uuid` [BROKEN]                           | `(tenant_id)::uuid` [BROKEN]          | `(tenant_id)::uuid` [BROKEN]          | **ISOLATED (READ) / CRASH (WRITE)** |

---

## 4. Analysis of `user_is_member_of_tenant()` Function

### 4.1 Implementation Truth

```sql
CREATE OR REPLACE FUNCTION public.user_is_member_of_tenant(tenant_uuid text)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.tenant_members
    WHERE tenant_id = tenant_uuid
    AND user_id = auth.uid()::text
    AND status = 'active'
  );
END;
$function$;
```

### 4.2 Security Checklist

- **`SECURITY DEFINER`**: Present. Bypasses RLS on `public.tenant_members` to evaluate membership without circular recursion.
- **`SET search_path = public`**: Present. Defends against search_path hijack attacks.
- **Execution Privileges**:
  - `EXECUTE` is granted to `PUBLIC`, `anon`, and `authenticated`.
  - For `user_is_member_of_tenant(tenant_uuid text)`, this is safe because unauthenticated callers have `auth.uid() = NULL`, which returns `false`.
  - **Minor Issue**: Overload `user_is_member_of_tenant(p_user_id text, p_tenant_id text)` accepts arbitrary `user_id` and `tenant_id` as inputs. Because `EXECUTE` is granted to `anon`, unauthenticated actors can call this via Supabase REST RPC `/rpc/user_is_member_of_tenant` as an oracle to enumerate valid tenant memberships.

---

## 5. Storage RLS Verification

### 5.1 Storage Buckets

- `animals`: `public = true` (Photos viewable publicly via CDN).
- `payment-slips`: `public = false` (Private bank transfer slips).
- `documents`: `public = false` (Private farm records).
- `exports`: `public = false` (Private CSV/PDF exports).

### 5.2 Storage Objects Policies

- In `pg_policies` for `storage.objects`, **0 policies are defined**.
- **Security Consequence**:
  - Because RLS is enabled on `storage.objects` with 0 policies, PostgreSQL enforces **DEFAULT DENY** for all operations by `anon` and `authenticated` roles.
  - Direct upload or download via client `supabase.storage.from('documents')` will be rejected by Supabase.
  - Only the Next.js server holding `SUPABASE_SERVICE_ROLE_KEY` can perform operations or generate signed URLs.
  - For `animals` (public), object GET requests bypass RLS through the Supabase public CDN proxy.

---

## 6. Recommendations to Achieve Complete RLS Soundness

1. **Fix Write Policy Types**:
   Run a migration updating all `INSERT`, `UPDATE`, and `DELETE` policies on `animals`, `expenses`, `sales`, `milk_logs`, `health_records`, and `vaccinations` from `user_is_member_of_tenant((tenant_id)::uuid)` to `user_is_member_of_tenant(tenant_id)`.
2. **Revoke Public Execute on 2-Argument Membership Function**:
   ```sql
   REVOKE EXECUTE ON FUNCTION public.user_is_member_of_tenant(text, text) FROM PUBLIC, anon;
   ```
3. **Add Live RLS Test Suite**:
   Create a dedicated integration test suite using Supabase authenticated client tokens to verify that cross-tenant operations are blocked at the database level.
