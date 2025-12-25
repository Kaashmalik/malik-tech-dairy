-- Direct SQL for Supabase SQL Editor
-- Copy and paste this script into the Supabase SQL Editor

-- 1. FIX HEALTH RECORDS TABLE
ALTER TABLE health_records 
ADD COLUMN IF NOT EXISTS checkup_date DATE NOT NULL DEFAULT CURRENT_DATE,
ADD COLUMN IF NOT EXISTS temperature DECIMAL(4,1),
ADD COLUMN IF NOT EXISTS weight DECIMAL(8,2),
ADD COLUMN IF NOT EXISTS heart_rate INTEGER,
ADD COLUMN IF NOT EXISTS respiratory_rate INTEGER,
ADD COLUMN IF NOT EXISTS symptoms TEXT[],
ADD COLUMN IF NOT EXISTS veterinarian_id TEXT REFERENCES platform_users(id);

-- 2. FIX MEDICINE INVENTORY TABLE
ALTER TABLE medicine_inventory 
ADD COLUMN IF NOT EXISTS created_by TEXT REFERENCES platform_users(id),
ADD COLUMN IF NOT EXISTS category VARCHAR(50),
ADD COLUMN IF NOT EXISTS manufacturer VARCHAR(100),
ADD COLUMN IF NOT EXISTS batch_number VARCHAR(50),
ADD COLUMN IF NOT EXISTS storage_location VARCHAR(100),
ADD COLUMN IF NOT EXISTS description TEXT;

-- 3. CREATE ASSETS TABLE
CREATE TABLE IF NOT EXISTS assets (
    id TEXT PRIMARY KEY,
    tenant_id TEXT NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    type VARCHAR(50) NOT NULL,
    category VARCHAR(50),
    value DECIMAL(12,2),
    purchase_date DATE,
    warranty_expiry DATE,
    status VARCHAR(20) DEFAULT 'operational',
    location TEXT,
    description TEXT,
    created_by TEXT REFERENCES platform_users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. CREATE MEDICINE LOGS TABLE
CREATE TABLE IF NOT EXISTS medicine_logs (
    id TEXT PRIMARY KEY,
    tenant_id TEXT NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    medicine_id TEXT NOT NULL REFERENCES medicine_inventory(id) ON DELETE CASCADE,
    animal_id TEXT REFERENCES animals(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    dosage VARCHAR(50),
    frequency VARCHAR(50),
    duration INTEGER,
    notes TEXT,
    administered_by TEXT REFERENCES platform_users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. CREATE FEED LOGS TABLE
CREATE TABLE IF NOT EXISTS feed_logs (
    id TEXT PRIMARY KEY,
    tenant_id TEXT NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    animal_id TEXT REFERENCES animals(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    feed_type VARCHAR(50) NOT NULL,
    quantity DECIMAL(10,2) NOT NULL,
    unit VARCHAR(20) NOT NULL,
    cost DECIMAL(10,2),
    supplier VARCHAR(100),
    notes TEXT,
    recorded_by TEXT REFERENCES platform_users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. CREATE VACCINATIONS TABLE
CREATE TABLE IF NOT EXISTS vaccinations (
    id TEXT PRIMARY KEY,
    tenant_id TEXT NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    animal_id TEXT NOT NULL REFERENCES animals(id) ON DELETE CASCADE,
    vaccine_name TEXT NOT NULL,
    vaccine_type VARCHAR(50),
    manufacturer VARCHAR(100),
    batch_number VARCHAR(50),
    vaccination_date DATE NOT NULL,
    next_due_date DATE,
    administered_by TEXT REFERENCES platform_users(id),
    notes TEXT,
    status VARCHAR(20) DEFAULT 'administered',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 7. FIX SALES TABLE
ALTER TABLE sales 
ADD COLUMN IF NOT EXISTS category VARCHAR(50),
ADD COLUMN IF NOT EXISTS customer_name VARCHAR(100),
ADD COLUMN IF NOT EXISTS contact_info TEXT,
ADD COLUMN IF NOT EXISTS payment_method VARCHAR(50),
ADD COLUMN IF NOT EXISTS payment_status VARCHAR(20) DEFAULT 'pending';

-- 8. CREATE INDEXES
CREATE INDEX IF NOT EXISTS idx_assets_tenant_id ON assets(tenant_id);
CREATE INDEX IF NOT EXISTS idx_medicine_logs_tenant_id ON medicine_logs(tenant_id);
CREATE INDEX IF NOT EXISTS idx_feed_logs_tenant_id ON feed_logs(tenant_id);
CREATE INDEX IF NOT EXISTS idx_vaccinations_tenant_id ON vaccinations(tenant_id);

-- 9. ENABLE RLS
ALTER TABLE assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE medicine_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE feed_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE vaccinations ENABLE ROW LEVEL SECURITY;

-- 10. RLS POLICIES
CREATE POLICY "Assets view policy" ON assets FOR SELECT USING (tenant_id = auth.uid() OR tenant_id IN (SELECT tenant_id FROM tenant_members WHERE user_id = auth.uid()));
CREATE POLICY "Assets insert policy" ON assets FOR INSERT WITH CHECK (tenant_id = auth.uid() OR tenant_id IN (SELECT tenant_id FROM tenant_members WHERE user_id = auth.uid()));
CREATE POLICY "Assets update policy" ON assets FOR UPDATE USING (tenant_id = auth.uid() OR tenant_id IN (SELECT tenant_id FROM tenant_members WHERE user_id = auth.uid()));
CREATE POLICY "Assets delete policy" ON assets FOR DELETE USING (tenant_id = auth.uid() OR tenant_id IN (SELECT tenant_id FROM tenant_members WHERE user_id = auth.uid()));

CREATE POLICY "Medicine logs view policy" ON medicine_logs FOR SELECT USING (tenant_id = auth.uid() OR tenant_id IN (SELECT tenant_id FROM tenant_members WHERE user_id = auth.uid()));
CREATE POLICY "Medicine logs insert policy" ON medicine_logs FOR INSERT WITH CHECK (tenant_id = auth.uid() OR tenant_id IN (SELECT tenant_id FROM tenant_members WHERE user_id = auth.uid()));

CREATE POLICY "Feed logs view policy" ON feed_logs FOR SELECT USING (tenant_id = auth.uid() OR tenant_id IN (SELECT tenant_id FROM tenant_members WHERE user_id = auth.uid()));
CREATE POLICY "Feed logs insert policy" ON feed_logs FOR INSERT WITH CHECK (tenant_id = auth.uid() OR tenant_id IN (SELECT tenant_id FROM tenant_members WHERE user_id = auth.uid()));

CREATE POLICY "Vaccinations view policy" ON vaccinations FOR SELECT USING (tenant_id = auth.uid() OR tenant_id IN (SELECT tenant_id FROM tenant_members WHERE user_id = auth.uid()));
CREATE POLICY "Vaccinations insert policy" ON vaccinations FOR INSERT WITH CHECK (tenant_id = auth.uid() OR tenant_id IN (SELECT tenant_id FROM tenant_members WHERE user_id = auth.uid()));

-- 11. UPDATE TRIGGER FUNCTION
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 12. CREATE TRIGGERS
DROP TRIGGER IF EXISTS update_assets_updated_at ON assets;
CREATE TRIGGER update_assets_updated_at BEFORE UPDATE ON assets FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
