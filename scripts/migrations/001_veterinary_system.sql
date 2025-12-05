-- Veterinary System Migration - Phase 1
-- Creates tables for disease management, treatment tracking, and vaccination schedules

-- Create disease category enum
CREATE TYPE disease_category AS ENUM (
  'metabolic', 'infectious', 'reproductive', 'nutritional', 
  'parasitic', 'respiratory', 'digestive', 'musculoskeletal'
);

-- Create disease severity enum
CREATE TYPE disease_severity AS ENUM ('mild', 'moderate', 'severe', 'critical');

-- Create treatment outcome enum
CREATE TYPE treatment_outcome AS ENUM (
  'pending', 'recovering', 'recovered', 'chronic', 'deceased', 'euthanized'
);

-- Create vaccine type enum
CREATE TYPE vaccine_type AS ENUM (
  'live_attenuated', 'inactivated', 'subunit', 'toxoid', 'conjugate', 'mrna'
);

-- Create vaccination status enum
CREATE TYPE vaccination_status AS ENUM (
  'scheduled', 'administered', 'overdue', 'skipped', 'reaction_recorded'
);

-- Create protocol type enum
CREATE TYPE protocol_type AS ENUM (
  'treatment', 'prevention', 'emergency', 'routine_care'
);

-- Create diseases table
CREATE TABLE IF NOT EXISTS diseases (
  id TEXT PRIMARY KEY,
  category disease_category NOT NULL,
  name_en VARCHAR(255) NOT NULL,
  name_ur VARCHAR(255),
  symptoms JSONB NOT NULL,
  diagnosis_methods JSONB NOT NULL,
  treatment_protocols JSONB NOT NULL,
  prevention_tips JSONB NOT NULL,
  severity disease_severity NOT NULL,
  zoonotic_risk BOOLEAN DEFAULT false NOT NULL,
  estimated_cost_min INTEGER DEFAULT 0,
  estimated_cost_max INTEGER DEFAULT 0,
  common_in_animal_types JSONB DEFAULT ARRAY['cow', 'buffalo'],
  seasonal_prevalence JSONB DEFAULT '[]',
  is_active BOOLEAN DEFAULT true NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Create treatment_records table
CREATE TABLE IF NOT EXISTS treatment_records (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  animal_id TEXT NOT NULL REFERENCES animals(id) ON DELETE CASCADE,
  disease_id TEXT NOT NULL REFERENCES diseases(id) ON DELETE RESTRICT,
  symptoms_observed JSONB NOT NULL,
  diagnosis TEXT NOT NULL,
  treatment_given JSONB NOT NULL,
  medications JSONB NOT NULL,
  veterinarian_name VARCHAR(255) NOT NULL,
  veterinarian_license VARCHAR(100),
  cost INTEGER DEFAULT 0,
  start_date TIMESTAMP WITH TIME ZONE NOT NULL,
  end_date TIMESTAMP WITH TIME ZONE,
  outcome treatment_outcome DEFAULT 'pending' NOT NULL,
  notes TEXT,
  follow_up_required BOOLEAN DEFAULT false NOT NULL,
  follow_up_date TIMESTAMP WITH TIME ZONE,
  recovery_percentage INTEGER,
  created_by TEXT NOT NULL REFERENCES platform_users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Create vaccination_schedules table
CREATE TABLE IF NOT EXISTS vaccination_schedules (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  animal_id TEXT REFERENCES animals(id) ON DELETE CASCADE,
  vaccine_name VARCHAR(255) NOT NULL,
  vaccine_type vaccine_type NOT NULL,
  target_diseases JSONB NOT NULL,
  scheduled_date TIMESTAMP WITH TIME ZONE NOT NULL,
  administered_date TIMESTAMP WITH TIME ZONE,
  next_due_date TIMESTAMP WITH TIME ZONE,
  status vaccination_status DEFAULT 'scheduled' NOT NULL,
  administered_by TEXT REFERENCES platform_users(id),
  batch_number VARCHAR(100) NOT NULL,
  expiry_date TIMESTAMP WITH TIME ZONE NOT NULL,
  manufacturer VARCHAR(255) NOT NULL,
  adverse_reactions JSONB,
  certificate_url TEXT,
  notes TEXT,
  created_by TEXT NOT NULL REFERENCES platform_users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Create veterinary_protocols table
CREATE TABLE IF NOT EXISTS veterinary_protocols (
  id TEXT PRIMARY KEY,
  disease_id TEXT NOT NULL REFERENCES diseases(id) ON DELETE CASCADE,
  protocol_type protocol_type NOT NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  steps JSONB NOT NULL,
  required_equipment JSONB NOT NULL,
  estimated_duration INTEGER NOT NULL,
  difficulty_level VARCHAR(20) DEFAULT 'intermediate' NOT NULL,
  prerequisites JSONB DEFAULT '[]',
  complications JSONB DEFAULT '[]',
  success_rate INTEGER DEFAULT 80,
  is_active BOOLEAN DEFAULT true NOT NULL,
  last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_by TEXT NOT NULL REFERENCES platform_users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS diseases_category_idx ON diseases(category);
CREATE INDEX IF NOT EXISTS diseases_severity_idx ON diseases(severity);
CREATE INDEX IF NOT EXISTS diseases_name_en_idx ON diseases(name_en);
CREATE INDEX IF NOT EXISTS diseases_is_active_idx ON diseases(is_active);

CREATE INDEX IF NOT EXISTS treatment_records_tenant_id_idx ON treatment_records(tenant_id);
CREATE INDEX IF NOT EXISTS treatment_records_animal_id_idx ON treatment_records(animal_id);
CREATE INDEX IF NOT EXISTS treatment_records_disease_id_idx ON treatment_records(disease_id);
CREATE INDEX IF NOT EXISTS treatment_records_outcome_idx ON treatment_records(outcome);
CREATE INDEX IF NOT EXISTS treatment_records_start_date_idx ON treatment_records(start_date);
CREATE INDEX IF NOT EXISTS treatment_records_veterinarian_idx ON treatment_records(veterinarian_name);

CREATE INDEX IF NOT EXISTS vaccination_schedules_tenant_id_idx ON vaccination_schedules(tenant_id);
CREATE INDEX IF NOT EXISTS vaccination_schedules_animal_id_idx ON vaccination_schedules(animal_id);
CREATE INDEX IF NOT EXISTS vaccination_schedules_status_idx ON vaccination_schedules(status);
CREATE INDEX IF NOT EXISTS vaccination_schedules_scheduled_date_idx ON vaccination_schedules(scheduled_date);
CREATE INDEX IF NOT EXISTS vaccination_schedules_next_due_date_idx ON vaccination_schedules(next_due_date);

CREATE INDEX IF NOT EXISTS veterinary_protocols_disease_id_idx ON veterinary_protocols(disease_id);
CREATE INDEX IF NOT EXISTS veterinary_protocols_protocol_type_idx ON veterinary_protocols(protocol_type);
CREATE INDEX IF NOT EXISTS veterinary_protocols_is_active_idx ON veterinary_protocols(is_active);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_diseases_updated_at BEFORE UPDATE ON diseases
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_treatment_records_updated_at BEFORE UPDATE ON treatment_records
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_vaccination_schedules_updated_at BEFORE UPDATE ON vaccination_schedules
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_veterinary_protocols_updated_at BEFORE UPDATE ON veterinary_protocols
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Row Level Security (RLS)
ALTER TABLE diseases ENABLE ROW LEVEL SECURITY;
ALTER TABLE treatment_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE vaccination_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE veterinary_protocols ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Diseases table - read access for all authenticated users
CREATE POLICY "Diseases read access" ON diseases
    FOR SELECT USING (auth.role() = 'authenticated');

-- Treatment records - tenant isolation
CREATE POLICY "Treatment records tenant access" ON treatment_records
    FOR ALL USING (tenant_id = auth.jwt()->>'orgId');

-- Vaccination schedules - tenant isolation
CREATE POLICY "Vaccination schedules tenant access" ON vaccination_schedules
    FOR ALL USING (tenant_id = auth.jwt()->>'orgId');

-- Veterinary protocols - read access for all authenticated users
CREATE POLICY "Veterinary protocols read access" ON veterinary_protocols
    FOR SELECT USING (auth.role() = 'authenticated');

COMMENT ON TABLE diseases IS 'Comprehensive disease database for veterinary management';
COMMENT ON TABLE treatment_records IS 'Tracks animal treatments and outcomes';
COMMENT ON TABLE vaccination_schedules IS 'Manages vaccination schedules and records';
COMMENT ON TABLE veterinary_protocols IS 'Standardized treatment protocols for diseases';
