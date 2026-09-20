# MTK DAIRY — DATABASE TRUTH AUDIT

## Supabase MCP Verified — 2026-09-20

---

## ACTUAL SUPABASE DATABASE

### Tables (54 public tables)

All tables have RLS enabled. All tables contain 0 rows.

| #   | Table                     | RLS | Rows | Triggers   | Comment                   |
| --- | ------------------------- | --- | ---- | ---------- | ------------------------- |
| 1   | platform_users            | ✅  | 0    | updated_at |                           |
| 2   | tenants                   | ✅  | 0    | updated_at |                           |
| 3   | farm_id_sequence          | ✅  | 0    | —          |                           |
| 4   | subscriptions             | ✅  | 0    | updated_at |                           |
| 5   | farm_applications         | ✅  | 0    | updated_at |                           |
| 6   | file_uploads              | ✅  | 0    | —          |                           |
| 7   | animals                   | ✅  | 0    | updated_at |                           |
| 8   | milk_logs                 | ✅  | 0    | —          |                           |
| 9   | health_records            | ✅  | 0    | —          |                           |
| 10  | breeding_records          | ✅  | 0    | updated_at |                           |
| 11  | expenses                  | ✅  | 0    | —          |                           |
| 12  | sales                     | ✅  | 0    | —          |                           |
| 13  | tenant_members            | ✅  | 0    | updated_at |                           |
| 14  | payments                  | ✅  | 0    | updated_at |                           |
| 15  | api_keys                  | ✅  | 0    | —          |                           |
| 16  | audit_logs                | ✅  | 0    | —          |                           |
| 17  | custom_fields_config      | ✅  | 0    | updated_at |                           |
| 18  | genetic_profiles          | ✅  | 0    | —          | Genetic breeding values   |
| 19  | feed_inventory            | ✅  | 0    | —          | Feed stock management     |
| 20  | nutrition_requirements    | ✅  | 0    | —          | Species nutritional needs |
| 21  | computer_vision_records   | ✅  | 0    | —          | AI image analysis         |
| 22  | financial_accounts        | ✅  | 0    | —          | Enhanced accounting       |
| 23  | blockchain_transactions   | ✅  | 0    | —          | Traceability              |
| 24  | drone_flights             | ✅  | 0    | —          | Pasture monitoring        |
| 25  | staff_certifications      | ✅  | 0    | —          | Training records          |
| 26  | regulatory_compliance     | ✅  | 0    | —          | Compliance tracking       |
| 27  | medicine_inventory        | ✅  | 0    | —          |                           |
| 28  | email_subscriptions       | ✅  | 0    | —          |                           |
| 29  | predictions               | ✅  | 0    | —          |                           |
| 30  | assets                    | ✅  | 0    | updated_at |                           |
| 31  | feed_logs                 | ✅  | 0    | —          |                           |
| 32  | vaccinations              | ✅  | 0    | —          |                           |
| 33  | medicine_logs             | ✅  | 0    | —          |                           |
| 34  | weather_data              | ✅  | 0    | —          |                           |
| 35  | pregnancy_checks          | ✅  | 0    | updated_at |                           |
| 36  | semen_inventory           | ✅  | 0    | updated_at |                           |
| 37  | heat_detections           | ✅  | 0    | updated_at |                           |
| 38  | diseases                  | ✅  | 0    | —          | Reference data            |
| 39  | medicines                 | ✅  | 0    | —          | Reference data            |
| 40  | disease_treatments        | ✅  | 0    | —          |                           |
| 41  | vaccination_schedules     | ✅  | 0    | —          | Reference data            |
| 42  | treatment_protocols       | ✅  | 0    | —          | Reference data            |
| 43  | tenant_medicine_inventory | ✅  | 0    | —          |                           |
| 44  | animal_treatments         | ✅  | 0    | —          |                           |
| 45  | animal_vaccinations       | ✅  | 0    | —          |                           |
| 46  | feature_flags             | ✅  | 0    | updated_at |                           |
| 47  | migration_metrics         | ✅  | 0    | —          |                           |
| 48  | migration_alerts          | ✅  | 0    | —          |                           |
| 49  | migration_logs            | ✅  | 0    | —          |                           |
| 50  | migration_checkpoints     | ✅  | 0    | —          |                           |
| 51  | staff                     | ✅  | 0    | —          |                           |
| 52  | tasks                     | ✅  | 0    | —          |                           |
| 53  | iot_devices               | ✅  | 0    | —          |                           |
| 54  | egg_logs                  | ✅  | 0    | updated_at |                           |

### Installed Extensions

| Extension          | Schema     | Version |
| ------------------ | ---------- | ------- |
| plpgsql            | pg_catalog | 1.0     |
| uuid-ossp          | extensions | 1.1     |
| pgcrypto           | extensions | 1.3     |
| pg_stat_statements | extensions | 1.11    |
| pg_graphql         | graphql    | 1.5.11  |
| supabase_vault     | vault      | 0.3.1   |

### Database Enums (Actual)

| Enum                    | Values                                                        |
| ----------------------- | ------------------------------------------------------------- |
| subscription_plan       | free, professional, farm, enterprise                          |
| subscription_status     | active, trial, expired, cancelled, past_due, pending_approval |
| payment_gateway         | jazzcash, easypaisa, xpay, bank_transfer                      |
| payment_status          | pending, completed, failed, refunded, manual_verification     |
| audit_action            | create, update, delete, read, login, logout                   |
| farm_application_status | pending, payment_uploaded, under_review, approved, rejected   |
| user_platform_role      | super_admin, admin, user                                      |
| storage_provider        | cloudinary, supabase                                          |
| medicine_category       | antibiotic, anti_inflammatory, ... (18 values)                |
| medicine_form           | injection, oral_liquid, ... (14 values)                       |
| administration_route    | intramuscular, intravenous, ... (10 values)                   |

### Missing Enums (In Drizzle schema but NOT in database)

| Enum               | Status     |
| ------------------ | ---------- |
| disease_category   | ❌ MISSING |
| disease_severity   | ❌ MISSING |
| treatment_outcome  | ❌ MISSING |
| vaccine_type       | ❌ MISSING |
| vaccination_status | ❌ MISSING |
| protocol_type      | ❌ MISSING |
| feed_type          | ❌ MISSING |
| feed_unit          | ❌ MISSING |
| task_status        | ❌ MISSING |
| task_priority      | ❌ MISSING |
| attendance_status  | ❌ MISSING |
| device_type        | ❌ MISSING |
| device_status      | ❌ MISSING |
| quality_grade      | ❌ MISSING |
| test_status        | ❌ MISSING |

### Database Functions

| Function                            | Security | Args                   |
| ----------------------------------- | -------- | ---------------------- |
| check_animal_limit()                | DEFINER  | none                   |
| check_animal_limit(text)            | INVOKER  | p_tenant_id            |
| get_next_farm_id()                  | DEFINER  | none                   |
| get_tenant_animal_count(text)       | DEFINER  | p_tenant_id            |
| get_tenant_member_count(text)       | DEFINER  | p_tenant_id            |
| update_updated_at_column()          | INVOKER  | none                   |
| user_is_member_of_tenant(uuid)      | DEFINER  | tenant_uuid            |
| user_is_member_of_tenant(text)      | DEFINER  | tenant_uuid            |
| user_is_member_of_tenant(text,text) | DEFINER  | p_user_id, p_tenant_id |

### Triggers (15 update triggers)

All use `update_updated_at_column()` on BEFORE UPDATE:
animals, assets, breeding_records, custom_fields_config, egg_logs, farm_applications, feature_flags, heat_detections, payments, platform_users, pregnancy_checks, semen_inventory, subscriptions, tenant_members, tenants

### Storage Buckets

**NONE** — 0 buckets configured

### Applied Migrations (18)

1. add_subscription_columns_to_tenants
2. create_egg_logs_table_v2_fixed
3. create_feature_flags_table_v2
4. create_monitoring_tables_v1
5. create_rls_policies_batch_1
6. create_rls_policies_batch_2
7. diseases_medicines_management
8. enable_rls_batch_1
9. enable_rls_batch_2
10. enable_rls_for_disease_medicine_tables
11. fix_function_search_path_security
12. fix_function_search_paths
13. fix_function_search_paths_batch_2
14. fix_remaining_functions_v2
15. fix_security_definer_views
16. fix_security_definer_views_batch_2
17. phase1_foundation_enhancement_fixed
18. phase1_foundation_enhancement_remaining

### Migration Drift

| Issue               | Details                                        |
| ------------------- | ---------------------------------------------- |
| Missing enums       | 15 Drizzle enums not in DB                     |
| Notifications table | Referenced in code, not in DB                  |
| Invoice table       | Referenced in finance service types, not in DB |

### Potential Integrity Issues

- No data to have integrity issues (0 rows everywhere)
- No CHECK constraints on amount fields (negative values possible)
- No UNIQUE constraint on transaction_id in payments (could allow duplicates)
- Foreign keys rely on CASCADE delete — correct but risky for audit trails
