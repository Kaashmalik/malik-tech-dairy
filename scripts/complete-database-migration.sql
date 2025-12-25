-- Comprehensive Database Migration for MTK Dairy
-- This migration fixes all schema issues and creates missing tables

-- ============================================
-- 1. FIX HEALTH RECORDS TABLE
-- ============================================

-- Add missing columns if they don't exist
DO $$
BEGIN
    -- Check and add columns
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='health_records' AND column_name='checkup_date') THEN
        ALTER TABLE health_records ADD COLUMN checkup_date DATE NOT NULL DEFAULT CURRENT_DATE;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='health_records' AND column_name='temperature') THEN
        ALTER TABLE health_records ADD COLUMN temperature DECIMAL(4,1);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='health_records' AND column_name='weight') THEN
        ALTER TABLE health_records ADD COLUMN weight DECIMAL(8,2);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='health_records' AND column_name='heart_rate') THEN
        ALTER TABLE health_records ADD COLUMN heart_rate INTEGER;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='health_records' AND column_name='respiratory_rate') THEN
        ALTER TABLE health_records ADD COLUMN respiratory_rate INTEGER;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='health_records' AND column_name='symptoms') THEN
        ALTER TABLE health_records ADD COLUMN symptoms TEXT[];
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='health_records' AND column_name='veterinarian_id') THEN
        ALTER TABLE health_records ADD COLUMN veterinarian_id TEXT REFERENCES platform_users(id);
    END IF;
    
    -- Copy date to checkup_date if null
    UPDATE health_records SET checkup_date = date WHERE checkup_date IS NULL AND date IS NOT NULL;
END $$;

-- ============================================
-- 2. FIX MEDICINE INVENTORY TABLE
-- ============================================

-- Add missing columns
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='medicine_inventory' AND column_name='created_by') THEN
        ALTER TABLE medicine_inventory ADD COLUMN created_by TEXT REFERENCES platform_users(id);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='medicine_inventory' AND column_name='category') THEN
        ALTER TABLE medicine_inventory ADD COLUMN category VARCHAR(50);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='medicine_inventory' AND column_name='manufacturer') THEN
        ALTER TABLE medicine_inventory ADD COLUMN manufacturer VARCHAR(100);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='medicine_inventory' AND column_name='batch_number') THEN
        ALTER TABLE medicine_inventory ADD COLUMN batch_number VARCHAR(50);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='medicine_inventory' AND column_name='storage_location') THEN
        ALTER TABLE medicine_inventory ADD COLUMN storage_location VARCHAR(100);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='medicine_inventory' AND column_name='description') THEN
        ALTER TABLE medicine_inventory ADD COLUMN description TEXT;
    END IF;
END $$;

-- ============================================
-- 3. CREATE ASSETS TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS assets (
    id TEXT PRIMARY KEY,
    tenant_id TEXT NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    type VARCHAR(50) NOT NULL, -- equipment, vehicle, building, land
    category VARCHAR(50),
    value DECIMAL(12,2),
    purchase_date DATE,
    warranty_expiry DATE,
    status VARCHAR(20) DEFAULT 'operational', -- operational, maintenance, retired
    location TEXT,
    description TEXT,
    created_by TEXT REFERENCES platform_users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for assets
CREATE INDEX IF NOT EXISTS idx_assets_tenant_id ON assets(tenant_id);
CREATE INDEX IF NOT EXISTS idx_assets_type ON assets(type);
CREATE INDEX IF NOT EXISTS idx_assets_status ON assets(status);

-- ============================================
-- 4. CREATE MEDICINE LOGS TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS medicine_logs (
    id TEXT PRIMARY KEY,
    tenant_id TEXT NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    medicine_id TEXT NOT NULL REFERENCES medicine_inventory(id) ON DELETE CASCADE,
    animal_id TEXT REFERENCES animals(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    dosage VARCHAR(50),
    frequency VARCHAR(50),
    duration INTEGER, -- in days
    notes TEXT,
    administered_by TEXT REFERENCES platform_users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for medicine logs
CREATE INDEX IF NOT EXISTS idx_medicine_logs_tenant_id ON medicine_logs(tenant_id);
CREATE INDEX IF NOT EXISTS idx_medicine_logs_medicine_id ON medicine_logs(medicine_id);
CREATE INDEX IF NOT EXISTS idx_medicine_logs_animal_id ON medicine_logs(animal_id);
CREATE INDEX IF NOT EXISTS idx_medicine_logs_date ON medicine_logs(date);

-- ============================================
-- 5. CREATE FEED LOGS TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS feed_logs (
    id TEXT PRIMARY KEY,
    tenant_id TEXT NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    animal_id TEXT REFERENCES animals(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    feed_type VARCHAR(50) NOT NULL, -- concentrate, silage, hay, minerals, supplements, water
    quantity DECIMAL(10,2) NOT NULL,
    unit VARCHAR(20) NOT NULL, -- kg, liters, grams, tons
    cost DECIMAL(10,2),
    supplier VARCHAR(100),
    notes TEXT,
    recorded_by TEXT REFERENCES platform_users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for feed logs
CREATE INDEX IF NOT EXISTS idx_feed_logs_tenant_id ON feed_logs(tenant_id);
CREATE INDEX IF NOT EXISTS idx_feed_logs_animal_id ON feed_logs(animal_id);
CREATE INDEX IF NOT EXISTS idx_feed_logs_date ON feed_logs(date);
CREATE INDEX IF NOT EXISTS idx_feed_logs_type ON feed_logs(feed_type);

-- ============================================
-- 6. CREATE VACCINATIONS TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS vaccinations (
    id TEXT PRIMARY KEY,
    tenant_id TEXT NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    animal_id TEXT NOT NULL REFERENCES animals(id) ON DELETE CASCADE,
    vaccine_name TEXT NOT NULL,
    vaccine_type VARCHAR(50), -- live_attenuated, inactivated, subunit, toxoid, conjugate, mrna
    manufacturer VARCHAR(100),
    batch_number VARCHAR(50),
    vaccination_date DATE NOT NULL,
    next_due_date DATE,
    administered_by TEXT REFERENCES platform_users(id),
    notes TEXT,
    status VARCHAR(20) DEFAULT 'administered', -- scheduled, administered, overdue, skipped, reaction_recorded
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for vaccinations
CREATE INDEX IF NOT EXISTS idx_vaccinations_tenant_id ON vaccinations(tenant_id);
CREATE INDEX IF NOT EXISTS idx_vaccinations_animal_id ON vaccinations(animal_id);
CREATE INDEX IF NOT EXISTS idx_vaccinations_date ON vaccinations(vaccination_date);
CREATE INDEX IF NOT EXISTS idx_vaccinations_next_due ON vaccinations(next_due_date);

-- ============================================
-- 7. FIX SALES RECORDS TABLE
-- ============================================

-- Add missing columns if they don't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='sales' AND column_name='category') THEN
        ALTER TABLE sales ADD COLUMN category VARCHAR(50);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='sales' AND column_name='customer_name') THEN
        ALTER TABLE sales ADD COLUMN customer_name VARCHAR(100);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='sales' AND column_name='contact_info') THEN
        ALTER TABLE sales ADD COLUMN contact_info TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='sales' AND column_name='payment_method') THEN
        ALTER TABLE sales ADD COLUMN payment_method VARCHAR(50);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='sales' AND column_name='payment_status') THEN
        ALTER TABLE sales ADD COLUMN payment_status VARCHAR(20) DEFAULT 'pending';
    END IF;
END $$;

-- ============================================
-- 8. CREATE DISEASES REGISTRY TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS diseases (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    category VARCHAR(50), -- metabolic, infectious, reproductive, nutritional, parasitic, respiratory, digestive
    severity VARCHAR(20), -- mild, moderate, severe, critical
    symptoms TEXT[],
    causes TEXT,
    treatment TEXT,
    prevention TEXT,
    is_contagious BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- 9. CREATE TREATMENT PROTOCOLS TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS treatment_protocols (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    disease_id TEXT REFERENCES diseases(id),
    type VARCHAR(50), -- diagnosis, treatment, prevention, emergency_care
    description TEXT,
    medications JSONB, -- array of medication objects
    procedures TEXT[],
    duration INTEGER, -- in days
    follow_up_required BOOLEAN DEFAULT TRUE,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- 10. CREATE STAFF MANAGEMENT TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS staff (
    id TEXT PRIMARY KEY,
    tenant_id TEXT NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    user_id TEXT REFERENCES platform_users(id) ON DELETE CASCADE,
    employee_id VARCHAR(50) UNIQUE,
    position VARCHAR(100), -- farm_manager, veterinarian, breeder, milking_staff, feed_manager, accountant
    department VARCHAR(50),
    hire_date DATE NOT NULL,
    salary DECIMAL(10,2),
    status VARCHAR(20) DEFAULT 'active', -- active, on_leave, terminated
    skills TEXT[],
    emergency_contact TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- 11. CREATE TASK MANAGEMENT TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS tasks (
    id TEXT PRIMARY KEY,
    tenant_id TEXT NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    assigned_to TEXT REFERENCES staff(id),
    assigned_by TEXT REFERENCES platform_users(id),
    status VARCHAR(20) DEFAULT 'pending', -- pending, in_progress, completed, overdue, cancelled
    priority VARCHAR(20) DEFAULT 'medium', -- low, medium, high, urgent
    due_date TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    category VARCHAR(50), -- feeding, milking, health, maintenance, breeding
    estimated_hours INTEGER,
    actual_hours INTEGER,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- 12. CREATE IOT DEVICES TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS iot_devices (
    id TEXT PRIMARY KEY,
    tenant_id TEXT NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    device_id VARCHAR(100) UNIQUE NOT NULL,
    name TEXT NOT NULL,
    type VARCHAR(50), -- milk_meter, activity_monitor, temperature_sensor, automatic_feeder, water_meter, gps_tracker
    animal_id TEXT REFERENCES animals(id),
    location TEXT,
    status VARCHAR(20) DEFAULT 'active', -- active, inactive, maintenance, error, offline
    last_seen TIMESTAMP WITH TIME ZONE,
    battery_level INTEGER,
    firmware_version VARCHAR(20),
    installation_date DATE,
    calibration_date DATE,
    settings JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- 13. ENABLE ROW LEVEL SECURITY (RLS)
-- ============================================

-- Enable RLS on all new tables
ALTER TABLE assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE medicine_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE feed_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE vaccinations ENABLE ROW LEVEL SECURITY;
ALTER TABLE staff ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE iot_devices ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for assets
CREATE POLICY "Assets: Users can view assets for their tenant" ON assets
    FOR SELECT USING (tenant_id IN (
        SELECT id FROM tenants WHERE id = auth.uid()
        OR id IN (SELECT tenant_id FROM tenant_members WHERE user_id = auth.uid() AND status = 'active')
    ));

CREATE POLICY "Assets: Users can insert assets for their tenant" ON assets
    FOR INSERT WITH CHECK (tenant_id IN (
        SELECT id FROM tenants WHERE id = auth.uid()
        OR id IN (SELECT tenant_id FROM tenant_members WHERE user_id = auth.uid() AND status = 'active')
    ));

CREATE POLICY "Assets: Users can update assets for their tenant" ON assets
    FOR UPDATE USING (tenant_id IN (
        SELECT id FROM tenants WHERE id = auth.uid()
        OR id IN (SELECT tenant_id FROM tenant_members WHERE user_id = auth.uid() AND status = 'active')
    ));

CREATE POLICY "Assets: Users can delete assets for their tenant" ON assets
    FOR DELETE USING (tenant_id IN (
        SELECT id FROM tenants WHERE id = auth.uid()
        OR id IN (SELECT tenant_id FROM tenant_members WHERE user_id = auth.uid() AND status = 'active')
    ));

-- Similar policies for other tables (medicine_logs, feed_logs, vaccinations, staff, tasks, iot_devices)
CREATE POLICY "Medicine Logs: Users can view logs for their tenant" ON medicine_logs
    FOR SELECT USING (tenant_id IN (
        SELECT id FROM tenants WHERE id = auth.uid()
        OR id IN (SELECT tenant_id FROM tenant_members WHERE user_id = auth.uid() AND status = 'active')
    ));

CREATE POLICY "Medicine Logs: Users can insert logs for their tenant" ON medicine_logs
    FOR INSERT WITH CHECK (tenant_id IN (
        SELECT id FROM tenants WHERE id = auth.uid()
        OR id IN (SELECT tenant_id FROM tenant_members WHERE user_id = auth.uid() AND status = 'active')
    ));

CREATE POLICY "Feed Logs: Users can view logs for their tenant" ON feed_logs
    FOR SELECT USING (tenant_id IN (
        SELECT id FROM tenants WHERE id = auth.uid()
        OR id IN (SELECT tenant_id FROM tenant_members WHERE user_id = auth.uid() AND status = 'active')
    ));

CREATE POLICY "Feed Logs: Users can insert logs for their tenant" ON feed_logs
    FOR INSERT WITH CHECK (tenant_id IN (
        SELECT id FROM tenants WHERE id = auth.uid()
        OR id IN (SELECT tenant_id FROM tenant_members WHERE user_id = auth.uid() AND status = 'active')
    ));

CREATE POLICY "Vaccinations: Users can view for their tenant" ON vaccinations
    FOR SELECT USING (tenant_id IN (
        SELECT id FROM tenants WHERE id = auth.uid()
        OR id IN (SELECT tenant_id FROM tenant_members WHERE user_id = auth.uid() AND status = 'active')
    ));

CREATE POLICY "Vaccinations: Users can insert for their tenant" ON vaccinations
    FOR INSERT WITH CHECK (tenant_id IN (
        SELECT id FROM tenants WHERE id = auth.uid()
        OR id IN (SELECT tenant_id FROM tenant_members WHERE user_id = auth.uid() AND status = 'active')
    ));

-- ============================================
-- 14. CREATE TRIGGERS FOR UPDATED_AT
-- ============================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply trigger to tables with updated_at column
CREATE TRIGGER update_assets_updated_at BEFORE UPDATE
    ON assets FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_medicine_logs_updated_at BEFORE UPDATE
    ON medicine_logs FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_feed_logs_updated_at BEFORE UPDATE
    ON feed_logs FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_vaccinations_updated_at BEFORE UPDATE
    ON vaccinations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_staff_updated_at BEFORE UPDATE
    ON staff FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tasks_updated_at BEFORE UPDATE
    ON tasks FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_iot_devices_updated_at BEFORE UPDATE
    ON iot_devices FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 15. CREATE VIEWS FOR BETTER DATA ACCESS
-- ============================================

-- View for animal health summary
CREATE OR REPLACE VIEW animal_health_summary AS
SELECT 
    a.id as animal_id,
    a.tag,
    a.name,
    COUNT(hr.id) as health_records_count,
    MAX(hr.checkup_date) as last_checkup,
    COUNT(v.id) as vaccination_count,
    MAX(v.vaccination_date) as last_vaccination
FROM animals a
LEFT JOIN health_records hr ON a.id = hr.animal_id
LEFT JOIN vaccinations v ON a.id = v.animal_id
GROUP BY a.id, a.tag, a.name;

-- View for milk production summary
CREATE OR REPLACE VIEW milk_production_summary AS
SELECT 
    a.id as animal_id,
    a.tag,
    a.name,
    DATE(ml.date) as date,
    SUM(ml.quantity) as daily_total,
    AVG(ml.quality) as avg_quality,
    AVG(ml.fat) as avg_fat
FROM milk_logs ml
JOIN animals a ON ml.animal_id = a.id
GROUP BY a.id, a.tag, a.name, DATE(ml.date)
ORDER BY DATE(ml.date) DESC;

-- View for feed efficiency
CREATE OR REPLACE VIEW feed_efficiency AS
SELECT 
    a.id as animal_id,
    a.tag,
    a.name,
    DATE(fl.date) as date,
    SUM(fl.quantity) as total_feed,
    SUM(ml.quantity) as total_milk,
    CASE 
        WHEN SUM(fl.quantity) > 0 THEN ROUND((SUM(ml.quantity)::decimal / SUM(fl.quantity) * 100), 2)
        ELSE 0 
    END as feed_to_milk_ratio
FROM feed_logs fl
JOIN animals a ON fl.animal_id = a.id
LEFT JOIN milk_logs ml ON fl.animal_id = ml.animal_id AND DATE(fl.date) = DATE(ml.date)
GROUP BY a.id, a.tag, a.name, DATE(fl.date)
ORDER BY DATE(fl.date) DESC;
