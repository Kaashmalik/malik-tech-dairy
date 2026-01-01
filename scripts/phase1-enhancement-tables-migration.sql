-- Phase 1 Enhancement Tables Migration
-- Creates all 9 Phase 1 enhancement tables for MTK Dairy
-- Based on verification script requirements

-- 1. Genetic Profiles Table
CREATE TABLE IF NOT EXISTS genetic_profiles (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    tenant_id TEXT NOT NULL,
    animal_id TEXT NOT NULL,
    sire_id TEXT,
    dam_id TEXT,
    breed_score DECIMAL(5,2),
    milk_yield_potential DECIMAL(10,2),
    genetic_value_index DECIMAL(10,2),
    laboratory VARCHAR(255),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT fk_genetic_profiles_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
    CONSTRAINT fk_genetic_profiles_animal FOREIGN KEY (animal_id) REFERENCES animals(id) ON DELETE CASCADE,
    CONSTRAINT fk_genetic_profiles_sire FOREIGN KEY (sire_id) REFERENCES animals(id) ON DELETE SET NULL,
    CONSTRAINT fk_genetic_profiles_dam FOREIGN KEY (dam_id) REFERENCES animals(id) ON DELETE SET NULL
);

-- 2. Feed Inventory Table
CREATE TABLE IF NOT EXISTS feed_inventory (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    tenant_id TEXT NOT NULL,
    ingredient_name VARCHAR(255) NOT NULL,
    category VARCHAR(100),
    current_stock DECIMAL(10,2) NOT NULL DEFAULT 0,
    unit VARCHAR(50) NOT NULL,
    reorder_level DECIMAL(10,2),
    max_stock_level DECIMAL(10,2),
    unit_cost DECIMAL(10,2),
    total_value DECIMAL(12,2),
    supplier_name VARCHAR(255),
    batch_number VARCHAR(100),
    manufacture_date DATE,
    expiry_date DATE,
    storage_location VARCHAR(255),
    quality_grade VARCHAR(50),
    moisture_content DECIMAL(5,2),
    protein_content DECIMAL(5,2),
    energy_content DECIMAL(10,2),
    average_daily_consumption DECIMAL(10,2),
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_by TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT fk_feed_inventory_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
    CONSTRAINT fk_feed_inventory_created_by FOREIGN KEY (created_by) REFERENCES platform_users(id) ON DELETE SET NULL
);

-- 3. Nutrition Requirements Table
CREATE TABLE IF NOT EXISTS nutrition_requirements (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    tenant_id TEXT NOT NULL,
    animal_category VARCHAR(100) NOT NULL,
    production_stage VARCHAR(100),
    min_protein DECIMAL(5,2),
    max_protein DECIMAL(5,2),
    min_energy DECIMAL(10,2),
    max_energy DECIMAL(10,2),
    min_fiber DECIMAL(5,2),
    max_fiber DECIMAL(5,2),
    min_moisture DECIMAL(5,2),
    max_moisture DECIMAL(5,2),
    created_by TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT fk_nutrition_requirements_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
    CONSTRAINT fk_nutrition_requirements_created_by FOREIGN KEY (created_by) REFERENCES platform_users(id) ON DELETE SET NULL
);

-- 4. Computer Vision Records Table
CREATE TABLE IF NOT EXISTS computer_vision_records (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    tenant_id TEXT NOT NULL,
    animal_id TEXT NOT NULL,
    image_url TEXT NOT NULL,
    analysis_type VARCHAR(100) NOT NULL,
    body_condition_score DECIMAL(3,1),
    confidence_score DECIMAL(5,2),
    health_indicators JSONB,
    analysis_results JSONB,
    verified_by TEXT,
    verification_status VARCHAR(50),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT fk_computer_vision_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
    CONSTRAINT fk_computer_vision_animal FOREIGN KEY (animal_id) REFERENCES animals(id) ON DELETE CASCADE,
    CONSTRAINT fk_computer_vision_verified_by FOREIGN KEY (verified_by) REFERENCES platform_users(id) ON DELETE SET NULL
);

-- 5. Financial Accounts Table
CREATE TABLE IF NOT EXISTS financial_accounts (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    tenant_id TEXT NOT NULL,
    account_name VARCHAR(255) NOT NULL,
    account_type VARCHAR(100) NOT NULL,
    account_number VARCHAR(100),
    bank_name VARCHAR(255),
    balance DECIMAL(15,2) NOT NULL DEFAULT 0,
    currency VARCHAR(3) NOT NULL DEFAULT 'PKR',
    status VARCHAR(50) NOT NULL DEFAULT 'active',
    parent_account_id TEXT,
    created_by TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT fk_financial_accounts_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
    CONSTRAINT fk_financial_accounts_parent FOREIGN KEY (parent_account_id) REFERENCES financial_accounts(id) ON DELETE SET NULL,
    CONSTRAINT fk_financial_accounts_created_by FOREIGN KEY (created_by) REFERENCES platform_users(id) ON DELETE SET NULL
);

-- 6. Staff Certifications Table
CREATE TABLE IF NOT EXISTS staff_certifications (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    tenant_id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    certification_name VARCHAR(255) NOT NULL,
    issuing_organization VARCHAR(255),
    certificate_number VARCHAR(100),
    issue_date DATE,
    expiry_date DATE,
    status VARCHAR(50) NOT NULL DEFAULT 'active',
    document_url TEXT,
    created_by TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT fk_staff_certifications_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
    CONSTRAINT fk_staff_certifications_user FOREIGN KEY (user_id) REFERENCES platform_users(id) ON DELETE CASCADE,
    CONSTRAINT fk_staff_certifications_created_by FOREIGN KEY (created_by) REFERENCES platform_users(id) ON DELETE SET NULL
);

-- 7. Regulatory Compliance Table
CREATE TABLE IF NOT EXISTS regulatory_compliance (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    tenant_id TEXT NOT NULL,
    compliance_type VARCHAR(100) NOT NULL,
    reference_number VARCHAR(100),
    issue_date DATE,
    expiry_date DATE,
    status VARCHAR(50) NOT NULL DEFAULT 'active',
    compliance_officer_id TEXT,
    documents JSONB,
    notes TEXT,
    created_by TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT fk_regulatory_compliance_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
    CONSTRAINT fk_regulatory_compliance_officer FOREIGN KEY (compliance_officer_id) REFERENCES platform_users(id) ON DELETE SET NULL,
    CONSTRAINT fk_regulatory_compliance_created_by FOREIGN KEY (created_by) REFERENCES platform_users(id) ON DELETE SET NULL
);

-- 8. Blockchain Transactions Table
CREATE TABLE IF NOT EXISTS blockchain_transactions (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    tenant_id TEXT NOT NULL,
    transaction_hash TEXT NOT NULL UNIQUE,
    block_number BIGINT,
    transaction_type VARCHAR(100) NOT NULL,
    asset_type VARCHAR(100),
    asset_id TEXT,
    from_address TEXT,
    to_address TEXT,
    timestamp TIMESTAMPTZ,
    metadata JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT fk_blockchain_transactions_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE
);

-- 9. Drone Flights Table
CREATE TABLE IF NOT EXISTS drone_flights (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    tenant_id TEXT NOT NULL,
    flight_date DATE NOT NULL,
    flight_duration INTEGER,
    area_covered DECIMAL(10,2),
    flight_type VARCHAR(100),
    pilot_id TEXT,
    weather_conditions JSONB,
    data_collected JSONB,
    findings TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT fk_drone_flights_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
    CONSTRAINT fk_drone_flights_pilot FOREIGN KEY (pilot_id) REFERENCES platform_users(id) ON DELETE SET NULL
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_genetic_profiles_tenant_id ON genetic_profiles(tenant_id);
CREATE INDEX IF NOT EXISTS idx_genetic_profiles_animal_id ON genetic_profiles(animal_id);
CREATE INDEX IF NOT EXISTS idx_feed_inventory_tenant_id ON feed_inventory(tenant_id);
CREATE INDEX IF NOT EXISTS idx_feed_inventory_is_active ON feed_inventory(is_active);
CREATE INDEX IF NOT EXISTS idx_nutrition_requirements_tenant_id ON nutrition_requirements(tenant_id);
CREATE INDEX IF NOT EXISTS idx_computer_vision_tenant_id ON computer_vision_records(tenant_id);
CREATE INDEX IF NOT EXISTS idx_computer_vision_animal_id ON computer_vision_records(animal_id);
CREATE INDEX IF NOT EXISTS idx_financial_accounts_tenant_id ON financial_accounts(tenant_id);
CREATE INDEX IF NOT EXISTS idx_financial_accounts_status ON financial_accounts(status);
CREATE INDEX IF NOT EXISTS idx_staff_certifications_tenant_id ON staff_certifications(tenant_id);
CREATE INDEX IF NOT EXISTS idx_staff_certifications_user_id ON staff_certifications(user_id);
CREATE INDEX IF NOT EXISTS idx_regulatory_compliance_tenant_id ON regulatory_compliance(tenant_id);
CREATE INDEX IF NOT EXISTS idx_regulatory_compliance_status ON regulatory_compliance(status);
CREATE INDEX IF NOT EXISTS idx_blockchain_transactions_tenant_id ON blockchain_transactions(tenant_id);
CREATE INDEX IF NOT EXISTS idx_blockchain_transactions_hash ON blockchain_transactions(transaction_hash);
CREATE INDEX IF NOT EXISTS idx_drone_flights_tenant_id ON drone_flights(tenant_id);
CREATE INDEX IF NOT EXISTS idx_drone_flights_flight_date ON drone_flights(flight_date);

-- Create trigger function for updating updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add triggers for updated_at columns
CREATE TRIGGER update_genetic_profiles_updated_at BEFORE UPDATE ON genetic_profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_feed_inventory_updated_at BEFORE UPDATE ON feed_inventory FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_nutrition_requirements_updated_at BEFORE UPDATE ON nutrition_requirements FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_computer_vision_records_updated_at BEFORE UPDATE ON computer_vision_records FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_financial_accounts_updated_at BEFORE UPDATE ON financial_accounts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_staff_certifications_updated_at BEFORE UPDATE ON staff_certifications FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_regulatory_compliance_updated_at BEFORE UPDATE ON regulatory_compliance FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_drone_flights_updated_at BEFORE UPDATE ON drone_flights FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

