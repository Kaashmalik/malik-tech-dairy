-- Feature Flags Table Schema for MTK Dairy Migration
-- Create this table in Supabase SQL Editor

-- Create feature_flags table
CREATE TABLE IF NOT EXISTS feature_flags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key VARCHAR(100) NOT NULL UNIQUE,
  enabled BOOLEAN NOT NULL DEFAULT false,
  rollout_percentage INTEGER NOT NULL DEFAULT 0 CHECK (rollout_percentage >= 0 AND rollout_percentage <= 100),
  description TEXT,
  target_users TEXT[] DEFAULT '{}',
  target_tenants TEXT[] DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_feature_flags_key ON feature_flags(key);
CREATE INDEX IF NOT EXISTS idx_feature_flags_enabled ON feature_flags(enabled);
CREATE INDEX IF NOT EXISTS idx_feature_flags_rollout ON feature_flags(rollout_percentage);

-- Insert default feature flags for migration
INSERT INTO feature_flags (key, enabled, rollout_percentage, description) VALUES
('use_supabase_apis', false, 0, 'Use Supabase APIs instead of Firebase'),
('enable_dual_write', false, 0, 'Write to both Firebase and Supabase'),
('read_from_supabase', false, 0, 'Read data from Supabase instead of Firebase'),
('write_to_firebase', true, 100, 'Continue writing to Firebase during migration'),
('enable_v2_endpoints', false, 0, 'Enable v2 API endpoints')
ON CONFLICT (key) DO NOTHING;

-- Create RLS (Row Level Security) policies
ALTER TABLE feature_flags ENABLE ROW LEVEL SECURITY;

-- Allow all users to read feature flags (needed for API decisions)
CREATE POLICY "Allow read access to feature flags" ON feature_flags
  FOR SELECT USING (true);

-- Only allow super admins to modify feature flags
CREATE POLICY "Allow write access to super admins" ON feature_flags
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM platform_users 
      WHERE id = auth.uid() 
      AND role = 'super_admin'
    )
  );

-- Create function to automatically update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_feature_flags_updated_at
  BEFORE UPDATE ON feature_flags
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Create view for easy feature flag management
CREATE OR REPLACE VIEW feature_flags_status AS
SELECT 
  key,
  enabled,
  rollout_percentage,
  description,
  CASE 
    WHEN enabled AND rollout_percentage = 100 THEN 'FULLY_ENABLED'
    WHEN enabled AND rollout_percentage > 0 THEN 'PARTIAL_ROLLOUT'
    WHEN enabled AND rollout_percentage = 0 THEN 'ENABLED_ZERO_PERCENT'
    ELSE 'DISABLED'
  END as status,
  array_length(target_users, 1) as target_user_count,
  array_length(target_tenants, 1) as target_tenant_count,
  updated_at
FROM feature_flags
ORDER BY key;

-- Grant permissions to the view
GRANT SELECT ON feature_flags_status TO authenticated;
GRANT SELECT ON feature_flags_status TO service_role;
