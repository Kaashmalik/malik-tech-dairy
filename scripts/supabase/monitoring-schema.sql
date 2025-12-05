-- Migration Monitoring Database Schema
-- Create tables for metrics, alerts, and logs

-- Migration metrics table for time-series data
CREATE TABLE IF NOT EXISTS migration_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
  phase VARCHAR(50) NOT NULL,
  dual_write_success INTEGER NOT NULL DEFAULT 0,
  dual_write_failures INTEGER NOT NULL DEFAULT 0,
  reconciliation_status VARCHAR(20) NOT NULL,
  data_integrity_score DECIMAL(5,2) NOT NULL,
  error_rate DECIMAL(5,2) NOT NULL,
  active_users INTEGER NOT NULL DEFAULT 0,
  throughput INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Migration alerts table
CREATE TABLE IF NOT EXISTS migration_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  alert_type VARCHAR(50) NOT NULL,
  details JSONB NOT NULL,
  severity VARCHAR(20) NOT NULL CHECK (severity IN ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL')),
  resolved BOOLEAN NOT NULL DEFAULT false,
  resolved_at TIMESTAMP WITH TIME ZONE,
  resolved_by VARCHAR(100),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Migration logs table for operation tracking
CREATE TABLE IF NOT EXISTS migration_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  operation_type VARCHAR(50) NOT NULL,
  tenant_id VARCHAR(100),
  user_id VARCHAR(100),
  success BOOLEAN NOT NULL,
  failure BOOLEAN NOT NULL DEFAULT false,
  error_message TEXT,
  duration_ms INTEGER,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Migration checkpoints table for phase tracking
CREATE TABLE IF NOT EXISTS migration_checkpoints (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phase VARCHAR(50) NOT NULL,
  status VARCHAR(20) NOT NULL CHECK (status IN ('PENDING', 'IN_PROGRESS', 'COMPLETED', 'FAILED')),
  started_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  records_processed INTEGER NOT NULL DEFAULT 0,
  records_failed INTEGER NOT NULL DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Performance indexes
CREATE INDEX IF NOT EXISTS idx_migration_metrics_timestamp ON migration_metrics(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_migration_metrics_phase ON migration_metrics(phase);
CREATE INDEX IF NOT EXISTS idx_migration_alerts_resolved ON migration_alerts(resolved);
CREATE INDEX IF NOT EXISTS idx_migration_alerts_created_at ON migration_alerts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_migration_logs_created_at ON migration_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_migration_logs_tenant_id ON migration_logs(tenant_id);
CREATE INDEX IF NOT EXISTS idx_migration_logs_success ON migration_logs(success);

-- RLS policies
ALTER TABLE migration_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE migration_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE migration_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE migration_checkpoints ENABLE ROW LEVEL SECURITY;

-- Allow super admins to read all monitoring data
CREATE POLICY "Allow super admin read access to metrics" ON migration_metrics
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM platform_users 
      WHERE id = auth.uid() 
      AND role = 'super_admin'
    )
  );

CREATE POLICY "Allow super admin read access to alerts" ON migration_alerts
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM platform_users 
      WHERE id = auth.uid() 
      AND role = 'super_admin'
    )
  );

CREATE POLICY "Allow super admin read access to logs" ON migration_logs
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM platform_users 
      WHERE id = auth.uid() 
      AND role = 'super_admin'
    )
  );

CREATE POLICY "Allow super admin read access to checkpoints" ON migration_checkpoints
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM platform_users 
      WHERE id = auth.uid() 
      AND role = 'super_admin'
    )
  );

-- Allow service role to write monitoring data
CREATE POLICY "Allow service role write access to metrics" ON migration_metrics
  FOR INSERT WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "Allow service role write access to alerts" ON migration_alerts
  FOR INSERT WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "Allow service role write access to logs" ON migration_logs
  FOR INSERT WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "Allow service role write access to checkpoints" ON migration_checkpoints
  FOR INSERT WITH CHECK (auth.role() = 'service_role');

-- Update triggers for timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Views for dashboard queries
CREATE OR REPLACE VIEW migration_dashboard_summary AS
SELECT 
  COUNT(*) as total_operations,
  COUNT(CASE WHEN success THEN 1 END) as successful_operations,
  COUNT(CASE WHEN failure THEN 1 END) as failed_operations,
  ROUND(AVG(duration_ms), 2) as avg_duration_ms,
  MAX(created_at) as last_operation
FROM migration_logs 
WHERE created_at > NOW() - INTERVAL '24 hours';

CREATE OR REPLACE VIEW migration_alerts_summary AS
SELECT 
  severity,
  COUNT(*) as count,
  MAX(created_at) as latest_alert
FROM migration_alerts 
WHERE resolved = false
GROUP BY severity
ORDER BY 
  CASE severity 
    WHEN 'CRITICAL' THEN 1
    WHEN 'HIGH' THEN 2
    WHEN 'MEDIUM' THEN 3
    WHEN 'LOW' THEN 4
  END;

-- Cleanup function for old metrics (retention policy)
CREATE OR REPLACE FUNCTION cleanup_old_migration_metrics()
RETURNS void AS $$
BEGIN
  DELETE FROM migration_metrics 
  WHERE created_at < NOW() - INTERVAL '30 days';
  
  DELETE FROM migration_logs 
  WHERE created_at < NOW() - INTERVAL '90 days';
  
  DELETE FROM migration_alerts 
  WHERE resolved = true 
  AND resolved_at < NOW() - INTERVAL '30 days';
END;
$$ LANGUAGE plpgsql;

-- Grant permissions
GRANT SELECT ON migration_dashboard_summary TO authenticated;
GRANT SELECT ON migration_dashboard_summary TO service_role;
GRANT SELECT ON migration_alerts_summary TO authenticated;
GRANT SELECT ON migration_alerts_summary TO service_role;
