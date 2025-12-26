-- =============================================================================
-- BREEDING & PREGNANCY MANAGEMENT SYSTEM - DATABASE MIGRATION
-- =============================================================================
-- This migration adds support for:
-- 1. Enhanced breeding_records with AI/Natural mating and species-specific gestation
-- 2. Pregnancy checks tracking
-- 3. Semen inventory management
-- =============================================================================

-- =============================================================================
-- 1. ALTER breeding_records TABLE - Add new columns
-- =============================================================================

-- Add breeding method column (natural or artificial_insemination)
ALTER TABLE breeding_records 
ADD COLUMN IF NOT EXISTS breeding_method VARCHAR(30) DEFAULT 'natural';

-- Add AI-specific fields
ALTER TABLE breeding_records 
ADD COLUMN IF NOT EXISTS semen_straw_id VARCHAR(100);

ALTER TABLE breeding_records 
ADD COLUMN IF NOT EXISTS semen_source VARCHAR(255);

ALTER TABLE breeding_records 
ADD COLUMN IF NOT EXISTS insemination_technician VARCHAR(255);

-- Add species column for gestation calculation
ALTER TABLE breeding_records 
ADD COLUMN IF NOT EXISTS species VARCHAR(20);

-- Add gestation tracking
ALTER TABLE breeding_records 
ADD COLUMN IF NOT EXISTS gestation_days INTEGER DEFAULT 283;

-- Rename expected_calving_date to expected_due_date for consistency
ALTER TABLE breeding_records 
RENAME COLUMN expected_calving_date TO expected_due_date;

-- Rename actual_calving_date to actual_birth_date for consistency  
ALTER TABLE breeding_records 
RENAME COLUMN actual_calving_date TO actual_birth_date;

-- Add offspring count
ALTER TABLE breeding_records 
ADD COLUMN IF NOT EXISTS offspring_count INTEGER;

-- Add pregnancy confirmation fields
ALTER TABLE breeding_records 
ADD COLUMN IF NOT EXISTS pregnancy_confirmed BOOLEAN DEFAULT FALSE;

ALTER TABLE breeding_records 
ADD COLUMN IF NOT EXISTS pregnancy_confirmed_date TIMESTAMPTZ;

ALTER TABLE breeding_records 
ADD COLUMN IF NOT EXISTS pregnancy_check_method VARCHAR(50);

-- Add updated_at column
ALTER TABLE breeding_records 
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- Update status column to support more states
-- Valid values: inseminated, check_pending, confirmed, not_pregnant, pregnant, delivered, failed, overdue
COMMENT ON COLUMN breeding_records.status IS 'Status values: inseminated, check_pending, confirmed, not_pregnant, pregnant, delivered, failed, overdue';

-- =============================================================================
-- 2. CREATE pregnancy_checks TABLE
-- =============================================================================

CREATE TABLE IF NOT EXISTS pregnancy_checks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id TEXT NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    breeding_record_id UUID NOT NULL,
    animal_id TEXT NOT NULL REFERENCES animals(id) ON DELETE CASCADE,
    check_date TIMESTAMPTZ NOT NULL,
    check_method VARCHAR(50) NOT NULL, -- ultrasound, blood_test, rectal_palpation, behavioral
    result VARCHAR(20) NOT NULL, -- positive, negative, inconclusive
    vet_name VARCHAR(255),
    notes TEXT,
    cost DECIMAL(10,2),
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Add indexes for pregnancy_checks
CREATE INDEX IF NOT EXISTS idx_pregnancy_checks_tenant_id ON pregnancy_checks(tenant_id);
CREATE INDEX IF NOT EXISTS idx_pregnancy_checks_breeding_record_id ON pregnancy_checks(breeding_record_id);
CREATE INDEX IF NOT EXISTS idx_pregnancy_checks_animal_id ON pregnancy_checks(animal_id);
CREATE INDEX IF NOT EXISTS idx_pregnancy_checks_check_date ON pregnancy_checks(check_date);
CREATE INDEX IF NOT EXISTS idx_pregnancy_checks_result ON pregnancy_checks(result);

-- =============================================================================
-- 3. CREATE semen_inventory TABLE
-- =============================================================================

CREATE TABLE IF NOT EXISTS semen_inventory (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id TEXT NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    straw_code VARCHAR(100) NOT NULL,
    bull_name VARCHAR(255) NOT NULL,
    bull_breed VARCHAR(100),
    bull_registration_number VARCHAR(100),
    source_center VARCHAR(255), -- Semen bank/center name
    species VARCHAR(50) NOT NULL, -- cow, buffalo, goat, sheep, horse
    quantity INTEGER DEFAULT 1,
    purchase_date DATE,
    expiry_date DATE,
    storage_location VARCHAR(100),
    cost_per_straw DECIMAL(10,2),
    status VARCHAR(20) DEFAULT 'available', -- available, used, expired, damaged
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Add indexes for semen_inventory
CREATE INDEX IF NOT EXISTS idx_semen_inventory_tenant_id ON semen_inventory(tenant_id);
CREATE INDEX IF NOT EXISTS idx_semen_inventory_species ON semen_inventory(species);
CREATE INDEX IF NOT EXISTS idx_semen_inventory_status ON semen_inventory(status);
CREATE INDEX IF NOT EXISTS idx_semen_inventory_straw_code ON semen_inventory(straw_code);
CREATE INDEX IF NOT EXISTS idx_semen_inventory_expiry_date ON semen_inventory(expiry_date);

-- Unique constraint for straw_code per tenant
CREATE UNIQUE INDEX IF NOT EXISTS idx_semen_inventory_tenant_straw_code 
ON semen_inventory(tenant_id, straw_code);

-- =============================================================================
-- 4. CREATE heat_detection TABLE (for tracking estrus/heat cycles)
-- =============================================================================

CREATE TABLE IF NOT EXISTS heat_detections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id TEXT NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    animal_id TEXT NOT NULL REFERENCES animals(id) ON DELETE CASCADE,
    detection_date TIMESTAMPTZ NOT NULL,
    detection_method VARCHAR(50), -- visual, activity_monitor, milk_drop, mucus_discharge
    heat_intensity VARCHAR(20), -- weak, moderate, strong
    standing_heat_observed BOOLEAN DEFAULT FALSE,
    notes TEXT,
    action_taken VARCHAR(50), -- bred, missed, skipped
    breeding_record_id UUID,
    detected_by VARCHAR(255),
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Add indexes for heat_detections
CREATE INDEX IF NOT EXISTS idx_heat_detections_tenant_id ON heat_detections(tenant_id);
CREATE INDEX IF NOT EXISTS idx_heat_detections_animal_id ON heat_detections(animal_id);
CREATE INDEX IF NOT EXISTS idx_heat_detections_detection_date ON heat_detections(detection_date);

-- =============================================================================
-- 5. RLS (Row Level Security) POLICIES
-- =============================================================================

-- Enable RLS on new tables
ALTER TABLE pregnancy_checks ENABLE ROW LEVEL SECURITY;
ALTER TABLE semen_inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE heat_detections ENABLE ROW LEVEL SECURITY;

-- Pregnancy checks policies
CREATE POLICY "Tenant isolation for pregnancy_checks" ON pregnancy_checks
    FOR ALL USING (tenant_id = current_setting('app.tenant_id', true));

-- Semen inventory policies
CREATE POLICY "Tenant isolation for semen_inventory" ON semen_inventory
    FOR ALL USING (tenant_id = current_setting('app.tenant_id', true));

-- Heat detections policies
CREATE POLICY "Tenant isolation for heat_detections" ON heat_detections
    FOR ALL USING (tenant_id = current_setting('app.tenant_id', true));

-- =============================================================================
-- 6. TRIGGER FUNCTIONS for updated_at
-- =============================================================================

-- Create trigger function if not exists
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Add triggers
DROP TRIGGER IF EXISTS update_breeding_records_updated_at ON breeding_records;
CREATE TRIGGER update_breeding_records_updated_at
    BEFORE UPDATE ON breeding_records
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_pregnancy_checks_updated_at ON pregnancy_checks;
CREATE TRIGGER update_pregnancy_checks_updated_at
    BEFORE UPDATE ON pregnancy_checks
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_semen_inventory_updated_at ON semen_inventory;
CREATE TRIGGER update_semen_inventory_updated_at
    BEFORE UPDATE ON semen_inventory
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_heat_detections_updated_at ON heat_detections;
CREATE TRIGGER update_heat_detections_updated_at
    BEFORE UPDATE ON heat_detections
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =============================================================================
-- 7. DATA MIGRATION - Update existing records
-- =============================================================================

-- Set species for existing breeding records based on animal's species
UPDATE breeding_records br
SET species = a.species
FROM animals a
WHERE br.animal_id = a.id
AND br.species IS NULL;

-- Set default gestation days based on species
UPDATE breeding_records
SET gestation_days = CASE species
    WHEN 'cow' THEN 283
    WHEN 'buffalo' THEN 310
    WHEN 'goat' THEN 150
    WHEN 'sheep' THEN 150
    WHEN 'horse' THEN 340
    WHEN 'chicken' THEN 21
    ELSE 283
END
WHERE gestation_days IS NULL OR gestation_days = 0;

-- Set breeding_method default for existing records
UPDATE breeding_records
SET breeding_method = 'natural'
WHERE breeding_method IS NULL;

-- Update status from old values to new values
UPDATE breeding_records
SET status = 'inseminated'
WHERE status = 'in_progress';

UPDATE breeding_records
SET status = 'delivered'
WHERE status = 'calved';

-- =============================================================================
-- MIGRATION COMPLETE
-- =============================================================================

-- Verify the migration
SELECT 
    'breeding_records' as table_name,
    COUNT(*) as record_count 
FROM breeding_records
UNION ALL
SELECT 
    'pregnancy_checks' as table_name,
    COUNT(*) as record_count 
FROM pregnancy_checks
UNION ALL
SELECT 
    'semen_inventory' as table_name,
    COUNT(*) as record_count 
FROM semen_inventory
UNION ALL
SELECT 
    'heat_detections' as table_name,
    COUNT(*) as record_count 
FROM heat_detections;
