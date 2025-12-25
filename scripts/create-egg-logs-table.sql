-- Create egg_logs table for poultry egg production tracking
CREATE TABLE IF NOT EXISTS egg_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    quantity INTEGER NOT NULL CHECK (quantity >= 0),
    quality VARCHAR(50) CHECK (quality IN ('premium', 'standard', 'substandard')),
    notes TEXT,
    recorded_by UUID NOT NULL REFERENCES platform_users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(tenant_id, date)
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_egg_logs_tenant_date ON egg_logs(tenant_id, date DESC);

-- Create index for recorded_by queries
CREATE INDEX IF NOT EXISTS idx_egg_logs_recorded_by ON egg_logs(recorded_by);

-- RLS policies
ALTER TABLE egg_logs ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view egg logs for their tenant
CREATE POLICY "Users can view egg logs for their tenant" ON egg_logs
    FOR SELECT USING (tenant_id IN (
        SELECT id FROM tenants WHERE id = auth.uid()
        OR id IN (SELECT tenant_id FROM tenant_members WHERE user_id = auth.uid() AND status = 'active')
    ));

-- Policy: Users can insert egg logs for their tenant
CREATE POLICY "Users can insert egg logs for their tenant" ON egg_logs
    FOR INSERT WITH CHECK (tenant_id IN (
        SELECT id FROM tenants WHERE id = auth.uid()
        OR id IN (SELECT tenant_id FROM tenant_members WHERE user_id = auth.uid() AND status = 'active')
    ));

-- Policy: Users can update egg logs for their tenant
CREATE POLICY "Users can update egg logs for their tenant" ON egg_logs
    FOR UPDATE USING (tenant_id IN (
        SELECT id FROM tenants WHERE id = auth.uid()
        OR id IN (SELECT tenant_id FROM tenant_members WHERE user_id = auth.uid() AND status = 'active')
    ));

-- Policy: Users can delete egg logs for their tenant
CREATE POLICY "Users can delete egg logs for their tenant" ON egg_logs
    FOR DELETE USING (tenant_id IN (
        SELECT id FROM tenants WHERE id = auth.uid()
        OR id IN (SELECT tenant_id FROM tenant_members WHERE user_id = auth.uid() AND status = 'active')
    ));

-- Trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_egg_logs_updated_at BEFORE UPDATE
    ON egg_logs FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
