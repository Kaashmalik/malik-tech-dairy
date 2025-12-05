-- =============================================================================
-- MALIK TECH DAIRY - FRESH SUPABASE SETUP
-- =============================================================================
-- Version: 2.1.0
-- Date: 2024-12-04
-- For: Fresh Supabase project (no existing tables)
-- =============================================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =============================================================================
-- ENUMS
-- =============================================================================

DO $$ BEGIN
    CREATE TYPE subscription_plan AS ENUM ('free', 'professional', 'farm', 'enterprise');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE subscription_status AS ENUM ('active', 'trial', 'expired', 'cancelled', 'past_due', 'pending_approval');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE payment_gateway AS ENUM ('jazzcash', 'easypaisa', 'xpay', 'bank_transfer');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE payment_status AS ENUM ('pending', 'completed', 'failed', 'refunded', 'manual_verification');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE audit_action AS ENUM ('create', 'update', 'delete', 'read', 'login', 'logout');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE farm_application_status AS ENUM ('pending', 'payment_uploaded', 'under_review', 'approved', 'rejected');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE user_platform_role AS ENUM ('super_admin', 'admin', 'user');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE storage_provider AS ENUM ('cloudinary', 'supabase');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- =============================================================================
-- UTILITY FUNCTIONS
-- =============================================================================

-- Function to auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- =============================================================================
-- CORE TABLES
-- =============================================================================

-- 1. Platform Users table (all users in the system)
CREATE TABLE IF NOT EXISTS platform_users (
    id TEXT PRIMARY KEY,
    email VARCHAR(255) NOT NULL,
    name VARCHAR(255),
    phone VARCHAR(20),
    avatar_url TEXT,
    platform_role user_platform_role NOT NULL DEFAULT 'user',
    is_active BOOLEAN NOT NULL DEFAULT true,
    email_verified BOOLEAN DEFAULT false,
    last_login_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Tenants table (farms/organizations)
CREATE TABLE IF NOT EXISTS tenants (
    id TEXT PRIMARY KEY,
    slug VARCHAR(255) NOT NULL,
    farm_name VARCHAR(255) NOT NULL,
    logo_url TEXT,
    primary_color VARCHAR(7) DEFAULT '#1F7A3D',
    accent_color VARCHAR(7) DEFAULT '#F59E0B',
    language VARCHAR(10) DEFAULT 'en',
    currency VARCHAR(3) DEFAULT 'PKR',
    timezone VARCHAR(50) DEFAULT 'Asia/Karachi',
    animal_types JSONB DEFAULT '["cow", "buffalo", "chicken"]',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ
);

-- 3. Farm ID Sequence table (for generating unique farm IDs)
CREATE TABLE IF NOT EXISTS farm_id_sequence (
    id SERIAL PRIMARY KEY,
    year INTEGER NOT NULL,
    last_number INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT farm_id_sequence_year_unique UNIQUE (year)
);

-- 4. Subscriptions table
CREATE TABLE IF NOT EXISTS subscriptions (
    id TEXT PRIMARY KEY,
    tenant_id TEXT NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    plan subscription_plan NOT NULL DEFAULT 'free',
    status subscription_status NOT NULL DEFAULT 'trial',
    gateway payment_gateway NOT NULL DEFAULT 'bank_transfer',
    renew_date TIMESTAMPTZ NOT NULL,
    token TEXT,
    amount INTEGER NOT NULL DEFAULT 0,
    currency VARCHAR(3) DEFAULT 'PKR',
    trial_ends_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. Farm Applications table
CREATE TABLE IF NOT EXISTS farm_applications (
    id TEXT PRIMARY KEY,
    applicant_id TEXT NOT NULL REFERENCES platform_users(id),
    farm_name VARCHAR(255) NOT NULL,
    owner_name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(20) NOT NULL,
    address TEXT,
    city VARCHAR(100),
    province VARCHAR(100),
    animal_types JSONB DEFAULT '["cow", "buffalo"]',
    estimated_animals INTEGER DEFAULT 10,
    requested_plan subscription_plan NOT NULL DEFAULT 'free',
    status farm_application_status NOT NULL DEFAULT 'pending',
    payment_slip_url TEXT,
    payment_slip_provider storage_provider,
    payment_amount INTEGER,
    payment_date TIMESTAMPTZ,
    payment_reference VARCHAR(100),
    reviewed_by TEXT REFERENCES platform_users(id),
    reviewed_at TIMESTAMPTZ,
    review_notes TEXT,
    rejection_reason TEXT,
    assigned_tenant_id TEXT REFERENCES tenants(id),
    assigned_farm_id VARCHAR(50),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 6. File Uploads table
CREATE TABLE IF NOT EXISTS file_uploads (
    id TEXT PRIMARY KEY,
    tenant_id TEXT REFERENCES tenants(id) ON DELETE CASCADE,
    uploaded_by TEXT NOT NULL REFERENCES platform_users(id),
    file_name VARCHAR(255) NOT NULL,
    file_type VARCHAR(50) NOT NULL,
    file_size INTEGER NOT NULL,
    provider storage_provider NOT NULL DEFAULT 'cloudinary',
    public_id TEXT,
    url TEXT NOT NULL,
    secure_url TEXT,
    thumbnail_url TEXT,
    folder VARCHAR(100),
    metadata JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 7. Animals table
CREATE TABLE IF NOT EXISTS animals (
    id TEXT PRIMARY KEY,
    tenant_id TEXT NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    tag VARCHAR(50) NOT NULL,
    name VARCHAR(100),
    species VARCHAR(20) NOT NULL,
    breed VARCHAR(100),
    date_of_birth TIMESTAMPTZ,
    gender VARCHAR(10) NOT NULL,
    photo_url TEXT,
    photo_provider storage_provider,
    status VARCHAR(20) NOT NULL DEFAULT 'active',
    purchase_date TIMESTAMPTZ,
    purchase_price INTEGER,
    weight INTEGER,
    color VARCHAR(50),
    mother_id TEXT,
    father_id TEXT,
    notes TEXT,
    custom_fields JSONB,
    created_by TEXT REFERENCES platform_users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 8. Milk Logs table
CREATE TABLE IF NOT EXISTS milk_logs (
    id TEXT PRIMARY KEY,
    tenant_id TEXT NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    animal_id TEXT NOT NULL REFERENCES animals(id) ON DELETE CASCADE,
    date VARCHAR(10) NOT NULL,
    session VARCHAR(10) NOT NULL,
    quantity INTEGER NOT NULL,
    quality INTEGER,
    fat INTEGER,
    notes TEXT,
    recorded_by TEXT REFERENCES platform_users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 9. Health Records table
CREATE TABLE IF NOT EXISTS health_records (
    id TEXT PRIMARY KEY,
    tenant_id TEXT NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    animal_id TEXT NOT NULL REFERENCES animals(id) ON DELETE CASCADE,
    type VARCHAR(20) NOT NULL,
    date TIMESTAMPTZ NOT NULL,
    description TEXT NOT NULL,
    veterinarian VARCHAR(100),
    cost INTEGER,
    next_due_date TIMESTAMPTZ,
    attachments JSONB,
    recorded_by TEXT REFERENCES platform_users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 10. Breeding Records table
CREATE TABLE IF NOT EXISTS breeding_records (
    id TEXT PRIMARY KEY,
    tenant_id TEXT NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    animal_id TEXT NOT NULL REFERENCES animals(id) ON DELETE CASCADE,
    sire_id TEXT REFERENCES animals(id),
    breeding_date TIMESTAMPTZ NOT NULL,
    expected_calving_date TIMESTAMPTZ,
    actual_calving_date TIMESTAMPTZ,
    status VARCHAR(20) NOT NULL DEFAULT 'in_progress',
    offspring_id TEXT REFERENCES animals(id),
    notes TEXT,
    recorded_by TEXT REFERENCES platform_users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 11. Expenses table
CREATE TABLE IF NOT EXISTS expenses (
    id TEXT PRIMARY KEY,
    tenant_id TEXT NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    date TIMESTAMPTZ NOT NULL,
    category VARCHAR(50) NOT NULL,
    description TEXT NOT NULL,
    amount INTEGER NOT NULL,
    currency VARCHAR(3) DEFAULT 'PKR',
    vendor_name VARCHAR(100),
    receipt_url TEXT,
    recorded_by TEXT REFERENCES platform_users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 12. Sales table
CREATE TABLE IF NOT EXISTS sales (
    id TEXT PRIMARY KEY,
    tenant_id TEXT NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    date TIMESTAMPTZ NOT NULL,
    type VARCHAR(20) NOT NULL,
    quantity INTEGER NOT NULL,
    unit VARCHAR(20) NOT NULL,
    price_per_unit INTEGER NOT NULL,
    total INTEGER NOT NULL,
    currency VARCHAR(3) DEFAULT 'PKR',
    buyer_name VARCHAR(100),
    buyer_phone VARCHAR(20),
    notes TEXT,
    recorded_by TEXT REFERENCES platform_users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 13. Tenant Members table
CREATE TABLE IF NOT EXISTS tenant_members (
    id TEXT PRIMARY KEY,
    tenant_id TEXT NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    user_id TEXT NOT NULL REFERENCES platform_users(id),
    role VARCHAR(30) NOT NULL,
    salary INTEGER,
    join_date TIMESTAMPTZ DEFAULT NOW(),
    status VARCHAR(20) DEFAULT 'active',
    permissions JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 14. Payments table
CREATE TABLE IF NOT EXISTS payments (
    id TEXT PRIMARY KEY,
    tenant_id TEXT NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    amount INTEGER NOT NULL,
    currency VARCHAR(3) DEFAULT 'PKR',
    gateway payment_gateway NOT NULL,
    status payment_status NOT NULL DEFAULT 'pending',
    transaction_id TEXT,
    plan subscription_plan NOT NULL,
    metadata JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 15. API Keys table
CREATE TABLE IF NOT EXISTS api_keys (
    id TEXT PRIMARY KEY,
    tenant_id TEXT NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    key_hash TEXT NOT NULL,
    key_prefix VARCHAR(20) NOT NULL,
    permissions JSONB NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT true,
    last_used_at TIMESTAMPTZ,
    expires_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_by TEXT NOT NULL
);

-- 16. Audit Logs table
CREATE TABLE IF NOT EXISTS audit_logs (
    id TEXT PRIMARY KEY,
    tenant_id TEXT REFERENCES tenants(id) ON DELETE SET NULL,
    user_id TEXT NOT NULL,
    action audit_action NOT NULL,
    resource VARCHAR(100) NOT NULL,
    resource_id TEXT,
    details JSONB,
    ip_address VARCHAR(45),
    user_agent TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 17. Custom Fields Config table
CREATE TABLE IF NOT EXISTS custom_fields_config (
    id TEXT PRIMARY KEY,
    tenant_id TEXT NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    fields JSONB NOT NULL DEFAULT '[]',
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================================================================
-- INDEXES
-- =============================================================================

-- Platform Users indexes
CREATE UNIQUE INDEX IF NOT EXISTS idx_platform_users_email ON platform_users(email);
CREATE INDEX IF NOT EXISTS idx_platform_users_platform_role ON platform_users(platform_role);
CREATE INDEX IF NOT EXISTS idx_platform_users_is_active ON platform_users(is_active);

-- Tenants indexes
CREATE UNIQUE INDEX IF NOT EXISTS idx_tenants_slug ON tenants(slug);
CREATE INDEX IF NOT EXISTS idx_tenants_deleted_at ON tenants(deleted_at);
CREATE INDEX IF NOT EXISTS idx_tenants_created_at ON tenants(created_at);

-- Subscriptions indexes
CREATE UNIQUE INDEX IF NOT EXISTS idx_subscriptions_tenant_id ON subscriptions(tenant_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_subscriptions_renew_date ON subscriptions(renew_date);
CREATE INDEX IF NOT EXISTS idx_subscriptions_plan ON subscriptions(plan);

-- Farm Applications indexes
CREATE INDEX IF NOT EXISTS idx_farm_applications_applicant_id ON farm_applications(applicant_id);
CREATE INDEX IF NOT EXISTS idx_farm_applications_status ON farm_applications(status);
CREATE INDEX IF NOT EXISTS idx_farm_applications_created_at ON farm_applications(created_at);

-- File Uploads indexes
CREATE INDEX IF NOT EXISTS idx_file_uploads_tenant_id ON file_uploads(tenant_id);
CREATE INDEX IF NOT EXISTS idx_file_uploads_uploaded_by ON file_uploads(uploaded_by);
CREATE INDEX IF NOT EXISTS idx_file_uploads_folder ON file_uploads(folder);
CREATE INDEX IF NOT EXISTS idx_file_uploads_created_at ON file_uploads(created_at);

-- Animals indexes
CREATE INDEX IF NOT EXISTS idx_animals_tenant_id ON animals(tenant_id);
CREATE INDEX IF NOT EXISTS idx_animals_tag ON animals(tag);
CREATE INDEX IF NOT EXISTS idx_animals_species ON animals(species);
CREATE INDEX IF NOT EXISTS idx_animals_status ON animals(status);
CREATE INDEX IF NOT EXISTS idx_animals_gender ON animals(gender);
CREATE INDEX IF NOT EXISTS idx_animals_created_at ON animals(created_at);
CREATE UNIQUE INDEX IF NOT EXISTS idx_animals_tenant_tag ON animals(tenant_id, tag);

-- Milk Logs indexes
CREATE INDEX IF NOT EXISTS idx_milk_logs_tenant_id ON milk_logs(tenant_id);
CREATE INDEX IF NOT EXISTS idx_milk_logs_animal_id ON milk_logs(animal_id);
CREATE INDEX IF NOT EXISTS idx_milk_logs_date ON milk_logs(date);
CREATE INDEX IF NOT EXISTS idx_milk_logs_session ON milk_logs(session);
CREATE INDEX IF NOT EXISTS idx_milk_logs_tenant_date ON milk_logs(tenant_id, date);
CREATE INDEX IF NOT EXISTS idx_milk_logs_created_at ON milk_logs(created_at);

-- Health Records indexes
CREATE INDEX IF NOT EXISTS idx_health_records_tenant_id ON health_records(tenant_id);
CREATE INDEX IF NOT EXISTS idx_health_records_animal_id ON health_records(animal_id);
CREATE INDEX IF NOT EXISTS idx_health_records_type ON health_records(type);
CREATE INDEX IF NOT EXISTS idx_health_records_date ON health_records(date);
CREATE INDEX IF NOT EXISTS idx_health_records_next_due_date ON health_records(next_due_date);

-- Breeding Records indexes
CREATE INDEX IF NOT EXISTS idx_breeding_records_tenant_id ON breeding_records(tenant_id);
CREATE INDEX IF NOT EXISTS idx_breeding_records_animal_id ON breeding_records(animal_id);
CREATE INDEX IF NOT EXISTS idx_breeding_records_status ON breeding_records(status);
CREATE INDEX IF NOT EXISTS idx_breeding_records_expected_calving ON breeding_records(expected_calving_date);

-- Expenses indexes
CREATE INDEX IF NOT EXISTS idx_expenses_tenant_id ON expenses(tenant_id);
CREATE INDEX IF NOT EXISTS idx_expenses_date ON expenses(date);
CREATE INDEX IF NOT EXISTS idx_expenses_category ON expenses(category);
CREATE INDEX IF NOT EXISTS idx_expenses_tenant_date ON expenses(tenant_id, date);

-- Sales indexes
CREATE INDEX IF NOT EXISTS idx_sales_tenant_id ON sales(tenant_id);
CREATE INDEX IF NOT EXISTS idx_sales_date ON sales(date);
CREATE INDEX IF NOT EXISTS idx_sales_type ON sales(type);
CREATE INDEX IF NOT EXISTS idx_sales_tenant_date ON sales(tenant_id, date);

-- Tenant Members indexes
CREATE INDEX IF NOT EXISTS idx_tenant_members_tenant_id ON tenant_members(tenant_id);
CREATE INDEX IF NOT EXISTS idx_tenant_members_user_id ON tenant_members(user_id);
CREATE INDEX IF NOT EXISTS idx_tenant_members_role ON tenant_members(role);
CREATE INDEX IF NOT EXISTS idx_tenant_members_status ON tenant_members(status);
CREATE UNIQUE INDEX IF NOT EXISTS idx_tenant_members_tenant_user ON tenant_members(tenant_id, user_id);

-- Payments indexes
CREATE INDEX IF NOT EXISTS idx_payments_tenant_id ON payments(tenant_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);
CREATE INDEX IF NOT EXISTS idx_payments_transaction_id ON payments(transaction_id);
CREATE INDEX IF NOT EXISTS idx_payments_created_at ON payments(created_at);
CREATE INDEX IF NOT EXISTS idx_payments_gateway ON payments(gateway);

-- API Keys indexes
CREATE INDEX IF NOT EXISTS idx_api_keys_tenant_id ON api_keys(tenant_id);
CREATE INDEX IF NOT EXISTS idx_api_keys_key_prefix ON api_keys(key_prefix);
CREATE INDEX IF NOT EXISTS idx_api_keys_is_active ON api_keys(is_active);

-- Audit Logs indexes
CREATE INDEX IF NOT EXISTS idx_audit_logs_tenant_id ON audit_logs(tenant_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_resource ON audit_logs(resource);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_audit_logs_tenant_resource ON audit_logs(tenant_id, resource);
CREATE INDEX IF NOT EXISTS idx_audit_logs_tenant_created ON audit_logs(tenant_id, created_at DESC);

-- Custom Fields Config indexes
CREATE UNIQUE INDEX IF NOT EXISTS idx_custom_fields_config_tenant_id ON custom_fields_config(tenant_id);

-- =============================================================================
-- TRIGGERS
-- =============================================================================

DROP TRIGGER IF EXISTS update_tenants_updated_at ON tenants;
CREATE TRIGGER update_tenants_updated_at
    BEFORE UPDATE ON tenants
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_subscriptions_updated_at ON subscriptions;
CREATE TRIGGER update_subscriptions_updated_at
    BEFORE UPDATE ON subscriptions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_payments_updated_at ON payments;
CREATE TRIGGER update_payments_updated_at
    BEFORE UPDATE ON payments
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_platform_users_updated_at ON platform_users;
CREATE TRIGGER update_platform_users_updated_at
    BEFORE UPDATE ON platform_users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_farm_applications_updated_at ON farm_applications;
CREATE TRIGGER update_farm_applications_updated_at
    BEFORE UPDATE ON farm_applications
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_animals_updated_at ON animals;
CREATE TRIGGER update_animals_updated_at
    BEFORE UPDATE ON animals
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_tenant_members_updated_at ON tenant_members;
CREATE TRIGGER update_tenant_members_updated_at
    BEFORE UPDATE ON tenant_members
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_custom_fields_config_updated_at ON custom_fields_config;
CREATE TRIGGER update_custom_fields_config_updated_at
    BEFORE UPDATE ON custom_fields_config
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =============================================================================
-- HELPER FUNCTIONS
-- =============================================================================

-- Function to generate next farm ID (MTD-YYYY-NNNN format)
CREATE OR REPLACE FUNCTION get_next_farm_id(p_year INTEGER DEFAULT NULL)
RETURNS TEXT AS $$
DECLARE
    v_year INTEGER;
    v_next_number INTEGER;
    v_farm_id TEXT;
BEGIN
    v_year := COALESCE(p_year, EXTRACT(YEAR FROM NOW())::INTEGER);
    
    INSERT INTO farm_id_sequence (year, last_number)
    VALUES (v_year, 1)
    ON CONFLICT (year) DO UPDATE
    SET last_number = farm_id_sequence.last_number + 1
    RETURNING last_number INTO v_next_number;
    
    v_farm_id := 'MTD-' || v_year::TEXT || '-' || LPAD(v_next_number::TEXT, 4, '0');
    
    RETURN v_farm_id;
END;
$$ LANGUAGE plpgsql;

-- Function to get tenant animal count
CREATE OR REPLACE FUNCTION get_tenant_animal_count(p_tenant_id TEXT)
RETURNS INTEGER AS $$
DECLARE
    v_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO v_count
    FROM animals
    WHERE tenant_id = p_tenant_id AND status != 'deceased';
    
    RETURN COALESCE(v_count, 0);
END;
$$ LANGUAGE plpgsql;

-- Function to get tenant member count
CREATE OR REPLACE FUNCTION get_tenant_member_count(p_tenant_id TEXT)
RETURNS INTEGER AS $$
DECLARE
    v_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO v_count
    FROM tenant_members
    WHERE tenant_id = p_tenant_id AND status = 'active';
    
    RETURN COALESCE(v_count, 0);
END;
$$ LANGUAGE plpgsql;

-- Function to check subscription limits
CREATE OR REPLACE FUNCTION check_animal_limit(p_tenant_id TEXT)
RETURNS BOOLEAN AS $$
DECLARE
    v_plan subscription_plan;
    v_max_animals INTEGER;
    v_current_count INTEGER;
BEGIN
    SELECT s.plan INTO v_plan
    FROM subscriptions s
    WHERE s.tenant_id = p_tenant_id;
    
    v_max_animals := CASE v_plan
        WHEN 'free' THEN 5
        WHEN 'professional' THEN 100
        WHEN 'farm' THEN 500
        WHEN 'enterprise' THEN 999999
        ELSE 5
    END;
    
    v_current_count := get_tenant_animal_count(p_tenant_id);
    
    RETURN v_current_count < v_max_animals;
END;
$$ LANGUAGE plpgsql;

-- =============================================================================
-- ROW LEVEL SECURITY (RLS)
-- =============================================================================

-- Enable RLS on all tables
ALTER TABLE platform_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE farm_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE file_uploads ENABLE ROW LEVEL SECURITY;
ALTER TABLE animals ENABLE ROW LEVEL SECURITY;
ALTER TABLE milk_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE health_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE breeding_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenant_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE custom_fields_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE farm_id_sequence ENABLE ROW LEVEL SECURITY;

-- =============================================================================
-- RLS POLICIES
-- Note: Service role key bypasses RLS automatically in Supabase
-- These policies allow service_role full access (for server-side operations)
-- =============================================================================

-- Platform Users
CREATE POLICY "Allow service role full access to platform_users" ON platform_users FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Allow authenticated read own profile" ON platform_users FOR SELECT TO authenticated USING (auth.uid()::text = id);

-- Tenants
CREATE POLICY "Allow service role full access to tenants" ON tenants FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Subscriptions
CREATE POLICY "Allow service role full access to subscriptions" ON subscriptions FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Farm Applications
CREATE POLICY "Allow service role full access to farm_applications" ON farm_applications FOR ALL TO service_role USING (true) WITH CHECK (true);

-- File Uploads
CREATE POLICY "Allow service role full access to file_uploads" ON file_uploads FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Animals
CREATE POLICY "Allow service role full access to animals" ON animals FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Milk Logs
CREATE POLICY "Allow service role full access to milk_logs" ON milk_logs FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Health Records
CREATE POLICY "Allow service role full access to health_records" ON health_records FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Breeding Records
CREATE POLICY "Allow service role full access to breeding_records" ON breeding_records FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Expenses
CREATE POLICY "Allow service role full access to expenses" ON expenses FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Sales
CREATE POLICY "Allow service role full access to sales" ON sales FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Tenant Members
CREATE POLICY "Allow service role full access to tenant_members" ON tenant_members FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Payments
CREATE POLICY "Allow service role full access to payments" ON payments FOR ALL TO service_role USING (true) WITH CHECK (true);

-- API Keys
CREATE POLICY "Allow service role full access to api_keys" ON api_keys FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Audit Logs
CREATE POLICY "Allow service role full access to audit_logs" ON audit_logs FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Custom Fields Config
CREATE POLICY "Allow service role full access to custom_fields_config" ON custom_fields_config FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Farm ID Sequence
CREATE POLICY "Allow service role full access to farm_id_sequence" ON farm_id_sequence FOR ALL TO service_role USING (true) WITH CHECK (true);

-- =============================================================================
-- INITIAL DATA
-- =============================================================================

-- Insert initial farm_id_sequence for current year
INSERT INTO farm_id_sequence (year, last_number) 
VALUES (EXTRACT(YEAR FROM NOW())::INTEGER, 0)
ON CONFLICT (year) DO NOTHING;

-- =============================================================================
-- HELPER VIEWS
-- =============================================================================

-- View: Tenant Summary (for admin dashboard)
CREATE OR REPLACE VIEW tenant_summary AS
SELECT 
    t.id,
    t.farm_name,
    t.slug,
    t.created_at,
    t.deleted_at,
    s.plan,
    s.status as subscription_status,
    s.renew_date,
    get_tenant_animal_count(t.id) as animal_count,
    get_tenant_member_count(t.id) as member_count
FROM tenants t
LEFT JOIN subscriptions s ON s.tenant_id = t.id;

-- View: Daily Milk Production (for analytics)
CREATE OR REPLACE VIEW daily_milk_production AS
SELECT 
    tenant_id,
    date,
    session,
    COUNT(*) as log_count,
    SUM(quantity) as total_quantity_ml,
    ROUND(SUM(quantity)::numeric / 1000, 2) as total_quantity_liters,
    ROUND(AVG(quality)::numeric, 1) as avg_quality,
    ROUND(AVG(fat)::numeric / 100, 2) as avg_fat_percent
FROM milk_logs
GROUP BY tenant_id, date, session
ORDER BY date DESC, session;

-- View: Monthly Revenue (for financial reports)
CREATE OR REPLACE VIEW monthly_revenue AS
SELECT 
    tenant_id,
    DATE_TRUNC('month', date) as month,
    type,
    SUM(total) as total_revenue,
    COUNT(*) as sale_count
FROM sales
GROUP BY tenant_id, DATE_TRUNC('month', date), type
ORDER BY month DESC;

-- View: Monthly Expenses (for financial reports)
CREATE OR REPLACE VIEW monthly_expenses AS
SELECT 
    tenant_id,
    DATE_TRUNC('month', date) as month,
    category,
    SUM(amount) as total_expense,
    COUNT(*) as expense_count
FROM expenses
GROUP BY tenant_id, DATE_TRUNC('month', date), category
ORDER BY month DESC;

-- View: Animal Health Summary
CREATE OR REPLACE VIEW animal_health_summary AS
SELECT 
    a.id as animal_id,
    a.tenant_id,
    a.tag,
    a.name,
    a.species,
    a.status,
    (SELECT COUNT(*) FROM health_records hr WHERE hr.animal_id = a.id) as total_health_records,
    (SELECT MAX(date) FROM health_records hr WHERE hr.animal_id = a.id) as last_health_check,
    (SELECT MIN(next_due_date) FROM health_records hr WHERE hr.animal_id = a.id AND hr.next_due_date > NOW()) as next_due_date
FROM animals a;

-- View: Breeding Status
CREATE OR REPLACE VIEW breeding_status AS
SELECT 
    br.id,
    br.tenant_id,
    a.tag as animal_tag,
    a.name as animal_name,
    s.tag as sire_tag,
    br.breeding_date,
    br.expected_calving_date,
    br.actual_calving_date,
    br.status,
    CASE 
        WHEN br.status = 'in_progress' AND br.expected_calving_date < NOW() THEN 'overdue'
        WHEN br.status = 'in_progress' AND br.expected_calving_date <= NOW() + INTERVAL '7 days' THEN 'due_soon'
        ELSE br.status
    END as calculated_status
FROM breeding_records br
JOIN animals a ON a.id = br.animal_id
LEFT JOIN animals s ON s.id = br.sire_id;

-- =============================================================================
-- GRANTS
-- =============================================================================

-- Grant usage on schema
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;

-- Grant access to tables
GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO authenticated;

-- Grant access to sequences
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO service_role;
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- Grant execute on functions
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO service_role;
GRANT EXECUTE ON FUNCTION get_next_farm_id TO service_role;
GRANT EXECUTE ON FUNCTION get_tenant_animal_count TO service_role;
GRANT EXECUTE ON FUNCTION get_tenant_member_count TO service_role;
GRANT EXECUTE ON FUNCTION check_animal_limit TO service_role;

-- =============================================================================
-- VERIFICATION QUERIES (Run these to verify setup)
-- =============================================================================

-- Uncomment and run these to verify:

-- SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name;
-- SELECT routine_name FROM information_schema.routines WHERE routine_schema = 'public';
-- SELECT * FROM pg_policies WHERE schemaname = 'public';
-- SELECT get_next_farm_id();

-- =============================================================================
-- SETUP COMPLETE!
-- =============================================================================
-- 
-- Tables Created: 17
-- Functions Created: 5
-- Views Created: 6
-- Triggers Created: 8
-- RLS Policies Created: 18
--
-- Next Steps:
-- 1. Verify tables: SELECT table_name FROM information_schema.tables WHERE table_schema = 'public';
-- 2. Test farm ID generation: SELECT get_next_farm_id();
-- 3. Update .env.local with your Supabase database password
-- 4. Run: npm run dev
--
-- =============================================================================
