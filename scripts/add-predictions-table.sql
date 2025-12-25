-- Add predictions table to Supabase
-- This table stores ML/AI prediction results

CREATE TABLE IF NOT EXISTS predictions (
    id TEXT PRIMARY KEY,
    tenant_id TEXT NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL, -- 'milk_7d', 'milk_30d', 'health', 'breeding', etc.
    title VARCHAR(200) NOT NULL,
    description TEXT,
    predictions JSONB NOT NULL, -- Array of prediction objects
    confidence_band JSONB, -- Optional confidence interval data
    model_version VARCHAR(20) DEFAULT '1.0',
    accuracy_score DECIMAL(5,4), -- Model accuracy (0-1)
    parameters JSONB, -- Model parameters used
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    expires_at TIMESTAMPTZ, -- When predictions expire
    is_active BOOLEAN DEFAULT true,
    
    -- Constraints
    CONSTRAINT predictions_tenant_type_unique UNIQUE(tenant_id, type, is_active)
);

-- Indexes for performance
CREATE INDEX idx_predictions_tenant_type ON predictions(tenant_id, type);
CREATE INDEX idx_predictions_expires_at ON predictions(expires_at);
CREATE INDEX idx_predictions_created_at ON predictions(created_at DESC);

-- RLS (Row Level Security)
ALTER TABLE predictions ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view predictions for their tenant
CREATE POLICY "Users can view own tenant predictions" ON predictions
    FOR SELECT USING (
        tenant_id = auth.uid() OR 
        tenant_id IN (
            SELECT tenant_id FROM tenant_members 
            WHERE user_id = auth.uid()
        )
    );

-- Policy: Service role can manage all predictions
CREATE POLICY "Service role can manage predictions" ON predictions
    FOR ALL USING (auth.role() = 'service_role');

-- Function to clean up expired predictions
CREATE OR REPLACE FUNCTION cleanup_expired_predictions()
RETURNS void AS $$
BEGIN
    DELETE FROM predictions 
    WHERE expires_at IS NOT NULL 
    AND expires_at < NOW();
END;
$$ LANGUAGE plpgsql;

-- Schedule cleanup (requires pg_cron extension)
-- SELECT cron.schedule('cleanup-expired-predictions', '0 2 * * *', 'SELECT cleanup_expired_predictions();');
