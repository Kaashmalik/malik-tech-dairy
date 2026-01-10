-- Database Migration: Add Missing Foreign Keys and Indexes
-- Run this in Supabase SQL Editor

-- ============================================
-- FOREIGN KEY CONSTRAINTS
-- ============================================

-- Fix audit_logs.tenant_id - should NOT be nullable and CASCADE on delete
ALTER TABLE audit_logs 
  ALTER COLUMN tenant_id SET NOT NULL,
  DROP CONSTRAINT IF EXISTS audit_logs_tenant_id_fkey,
  ADD CONSTRAINT audit_logs_tenant_id_fkey 
    FOREIGN KEY (tenant_id) 
    REFERENCES tenants(id) 
    ON DELETE CASCADE;

-- Fix file_uploads.tenant_id - should CASCADE on delete
ALTER TABLE file_uploads
  DROP CONSTRAINT IF EXISTS file_uploads_tenant_id_fkey,
  ADD CONSTRAINT file_uploads_tenant_id_fkey
    FOREIGN KEY (tenant_id)
    REFERENCES tenants(id)
    ON DELETE CASCADE;

-- Add foreign key for milk_logs.animal_id with CASCADE
ALTER TABLE milk_logs
  DROP CONSTRAINT IF EXISTS milk_logs_animal_id_fkey,
  ADD CONSTRAINT milk_logs_animal_id_fkey
    FOREIGN KEY (animal_id)
    REFERENCES animals(id)
    ON DELETE CASCADE;

-- Add foreign key for health_records.animal_id with CASCADE
ALTER TABLE health_records
  DROP CONSTRAINT IF EXISTS health_records_animal_id_fkey,
  ADD CONSTRAINT health_records_animal_id_fkey
    FOREIGN KEY (animal_id)
    REFERENCES animals(id)
    ON DELETE CASCADE;

-- Add foreign key for breeding_records.female_id with CASCADE
ALTER TABLE breeding_records
  DROP CONSTRAINT IF EXISTS breeding_records_female_id_fkey,
  ADD CONSTRAINT breeding_records_female_id_fkey
    FOREIGN KEY (female_id)
    REFERENCES animals(id)
    ON DELETE CASCADE;

-- Add foreign key for breeding_records.male_id with SET NULL
ALTER TABLE breeding_records
  DROP CONSTRAINT IF EXISTS breeding_records_male_id_fkey,
  ADD CONSTRAINT breeding_records_male_id_fkey
    FOREIGN KEY (male_id)
    REFERENCES animals(id)
    ON DELETE SET NULL;

-- Add foreign key for expenses.tenant_id with CASCADE
ALTER TABLE expenses
  DROP CONSTRAINT IF EXISTS expenses_tenant_id_fkey,
  ADD CONSTRAINT expenses_tenant_id_fkey
    FOREIGN KEY (tenant_id)
    REFERENCES tenants(id)
    ON DELETE CASCADE;

-- Add foreign key for sales.tenant_id with CASCADE
ALTER TABLE sales
  DROP CONSTRAINT IF EXISTS sales_tenant_id_fkey,
  ADD CONSTRAINT sales_tenant_id_fkey
    FOREIGN KEY (tenant_id)
    REFERENCES tenants(id)
    ON DELETE CASCADE;

-- Add foreign key for tenant_members.tenant_id with CASCADE
ALTER TABLE tenant_members
  DROP CONSTRAINT IF EXISTS tenant_members_tenant_id_fkey,
  ADD CONSTRAINT tenant_members_tenant_id_fkey
    FOREIGN KEY (tenant_id)
    REFERENCES tenants(id)
    ON DELETE CASCADE;

-- Add foreign key for tenant_members.user_id with CASCADE
ALTER TABLE tenant_members
  DROP CONSTRAINT IF EXISTS tenant_members_user_id_fkey,
  ADD CONSTRAINT tenant_members_user_id_fkey
    FOREIGN KEY (user_id)
    REFERENCES platform_users(id)
    ON DELETE CASCADE;

-- ============================================
-- DATABASE INDEXES
-- ============================================

-- Animals table indexes
CREATE INDEX IF NOT EXISTS idx_animals_tenant_species 
  ON animals(tenant_id, species) 
  WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_animals_tenant_status 
  ON animals(tenant_id, status) 
  WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_animals_tenant_tag 
  ON animals(tenant_id, tag) 
  WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_animals_deleted_at 
  ON animals(deleted_at) 
  WHERE deleted_at IS NOT NULL;

-- Milk logs indexes
CREATE INDEX IF NOT EXISTS idx_milk_logs_tenant_date 
  ON milk_logs(tenant_id, date DESC);

CREATE INDEX IF NOT EXISTS idx_milk_logs_animal_date 
  ON milk_logs(animal_id, date DESC);

CREATE INDEX IF NOT EXISTS idx_milk_logs_tenant_session_date 
  ON milk_logs(tenant_id, session, date DESC);

-- Health records indexes
CREATE INDEX IF NOT EXISTS idx_health_records_tenant_animal 
  ON health_records(tenant_id, animal_id);

CREATE INDEX IF NOT EXISTS idx_health_records_animal_date 
  ON health_records(animal_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_health_records_tenant_type 
  ON health_records(tenant_id, record_type);

-- Breeding records indexes
CREATE INDEX IF NOT EXISTS idx_breeding_records_tenant_female 
  ON breeding_records(tenant_id, female_id);

CREATE INDEX IF NOT EXISTS idx_breeding_records_female_date 
  ON breeding_records(female_id, breeding_date DESC);

CREATE INDEX IF NOT EXISTS idx_breeding_records_tenant_status 
  ON breeding_records(tenant_id, status);

-- Expenses indexes
CREATE INDEX IF NOT EXISTS idx_expenses_tenant_date 
  ON expenses(tenant_id, date DESC);

CREATE INDEX IF NOT EXISTS idx_expenses_tenant_category 
  ON expenses(tenant_id, category);

CREATE INDEX IF NOT EXISTS idx_expenses_tenant_date_category 
  ON expenses(tenant_id, date DESC, category);

-- Sales indexes
CREATE INDEX IF NOT EXISTS idx_sales_tenant_date 
  ON sales(tenant_id, date DESC);

CREATE INDEX IF NOT EXISTS idx_sales_tenant_type 
  ON sales(tenant_id, type);

CREATE INDEX IF NOT EXISTS idx_sales_tenant_date_type 
  ON sales(tenant_id, date DESC, type);

-- Tenant members indexes
CREATE INDEX IF NOT EXISTS idx_tenant_members_tenant_user 
  ON tenant_members(tenant_id, user_id);

CREATE INDEX IF NOT EXISTS idx_tenant_members_user_status 
  ON tenant_members(user_id, status);

CREATE INDEX IF NOT EXISTS idx_tenant_members_tenant_role 
  ON tenant_members(tenant_id, role) 
  WHERE status = 'active';

-- Audit logs indexes
CREATE INDEX IF NOT EXISTS idx_audit_logs_tenant_date 
  ON audit_logs(tenant_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_audit_logs_user_date 
  ON audit_logs(user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_audit_logs_tenant_action 
  ON audit_logs(tenant_id, action);

CREATE INDEX IF NOT EXISTS idx_audit_logs_tenant_resource 
  ON audit_logs(tenant_id, resource);

CREATE INDEX IF NOT EXISTS idx_audit_logs_tenant_user_action 
  ON audit_logs(tenant_id, user_id, action);

-- API keys indexes
CREATE INDEX IF NOT EXISTS idx_api_keys_tenant_user 
  ON api_keys(tenant_id, user_id);

CREATE INDEX IF NOT EXISTS idx_api_keys_prefix_hash 
  ON api_keys(key_prefix, key_hash);

CREATE INDEX IF NOT EXISTS idx_api_keys_tenant_active 
  ON api_keys(tenant_id) 
  WHERE is_active = true;

-- Subscriptions indexes
CREATE INDEX IF NOT EXISTS idx_subscriptions_tenant_status 
  ON subscriptions(tenant_id, status);

CREATE INDEX IF NOT EXISTS idx_subscriptions_tenant_plan 
  ON subscriptions(tenant_id, plan);

CREATE INDEX IF NOT EXISTS idx_subscriptions_status_expiry 
  ON subscriptions(status, current_period_end);

-- Payments indexes
CREATE INDEX IF NOT EXISTS idx_payments_tenant_date 
  ON payments(tenant_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_payments_tenant_status 
  ON payments(tenant_id, status);

CREATE INDEX IF NOT EXISTS idx_payments_tenant_subscription 
  ON payments(tenant_id, subscription_id);

-- Farm applications indexes
CREATE INDEX IF NOT EXISTS idx_farm_applications_user_status 
  ON farm_applications(user_id, status);

CREATE INDEX IF NOT EXISTS idx_farm_applications_status_date 
  ON farm_applications(status, created_at DESC);

-- Custom fields config indexes
CREATE INDEX IF NOT EXISTS idx_custom_fields_config_tenant 
  ON custom_fields_config(tenant_id);

-- File uploads indexes
CREATE INDEX IF NOT EXISTS idx_file_uploads_tenant_type 
  ON file_uploads(tenant_id, file_type);

CREATE INDEX IF NOT EXISTS idx_file_uploads_tenant_date 
  ON file_uploads(tenant_id, created_at DESC);

-- Platform users indexes
CREATE INDEX IF NOT EXISTS idx_platform_users_email 
  ON platform_users(email);

CREATE INDEX IF NOT EXISTS idx_platform_users_role 
  ON platform_users(platform_role);

-- Tenants indexes
CREATE INDEX IF NOT EXISTS idx_tenants_slug 
  ON tenants(slug);

CREATE INDEX IF NOT EXISTS idx_tenants_status 
  ON tenants(status);

CREATE INDEX IF NOT EXISTS idx_tenants_deleted_at 
  ON tenants(deleted_at) 
  WHERE deleted_at IS NOT NULL;

-- ============================================
-- SOFT DELETE PATTERN
-- ============================================

-- Add deleted_at column to tables that don't have it
ALTER TABLE animals ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP WITH TIME ZONE;

ALTER TABLE milk_logs ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP WITH TIME ZONE;

ALTER TABLE health_records ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP WITH TIME ZONE;

ALTER TABLE breeding_records ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP WITH TIME ZONE;

ALTER TABLE expenses ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP WITH TIME ZONE;

ALTER TABLE sales ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP WITH TIME ZONE;

-- ============================================
-- PERFORMANCE OPTIMIZATION
-- ============================================

-- Set appropriate work_mem for sorting operations
-- Adjust based on your server's available RAM
-- SET work_mem = '64MB';

-- Enable parallel query for better performance
-- SET max_parallel_workers_per_gather = 2;

-- Update statistics for better query planning
ANALYZE animals;
ANALYZE milk_logs;
ANALYZE health_records;
ANALYZE breeding_records;
ANALYZE expenses;
ANALYZE sales;
ANALYZE tenant_members;
ANALYZE audit_logs;
ANALYZE api_keys;
ANALYZE subscriptions;
ANALYZE payments;
ANALYZE tenants;

-- ============================================
-- VERIFICATION QUERIES
-- ============================================

-- Check foreign key constraints
SELECT 
  tc.table_name, 
  tc.constraint_name, 
  tc.constraint_type,
  kcu.column_name,
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name 
FROM information_schema.table_constraints AS tc 
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
  AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
  AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY'
  AND tc.table_schema = 'public'
ORDER BY tc.table_name;

-- Check indexes
SELECT 
  schemaname,
  tablename,
  indexname,
  indexdef
FROM pg_indexes
WHERE schemaname = 'public'
  AND indexname LIKE 'idx_%'
ORDER BY tablename, indexname;

-- Check table sizes
SELECT 
  tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;

-- ============================================
-- MIGRATION LOG
-- ============================================

-- Log this migration
INSERT INTO audit_logs (tenant_id, user_id, action, resource, details, created_at)
VALUES (
  'system',
  'system',
  'migration',
  'database',
  '{"name": "add_foreign_keys_and_indexes", "version": "1.0.0", "description": "Added missing foreign key constraints and performance indexes"}'::jsonb,
  NOW()
) ON CONFLICT DO NOTHING;

-- Migration complete
SELECT 'Migration completed successfully!' AS status;
