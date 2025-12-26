-- MTK Dairy - Comprehensive Disease & Medicine Management System
-- Based on research from Pakistan veterinary sources and pharmaceutical companies
-- Migration Date: December 26, 2024

-- =====================================================
-- PART 1: TABLE STRUCTURES
-- =====================================================

-- Medicine Categories Enum
DO $$ BEGIN
    CREATE TYPE medicine_category AS ENUM (
        'antibiotic', 'anti_inflammatory', 'antiparasitic', 'anthelmintic',
        'vaccine', 'vitamin', 'mineral', 'hormonal', 'antifungal',
        'antiseptic', 'analgesic', 'antipyretic', 'antihistamine',
        'cardiac', 'respiratory', 'digestive', 'reproductive', 'topical'
    );
EXCEPTION WHEN duplicate_object THEN null;
END $$;

-- Medicine Form Enum
DO $$ BEGIN
    CREATE TYPE medicine_form AS ENUM (
        'injection', 'oral_liquid', 'oral_powder', 'bolus', 'tablet',
        'capsule', 'paste', 'ointment', 'spray', 'pour_on', 'drench',
        'intramammary', 'implant', 'suspension'
    );
EXCEPTION WHEN duplicate_object THEN null;
END $$;

-- Route of Administration Enum
DO $$ BEGIN
    CREATE TYPE administration_route AS ENUM (
        'intramuscular', 'intravenous', 'subcutaneous', 'oral',
        'intramammary', 'topical', 'intranasal', 'intrauterine',
        'per_rectum', 'pour_on'
    );
EXCEPTION WHEN duplicate_object THEN null;
END $$;

-- =====================================================
-- DISEASES TABLE - Master list of diseases
-- =====================================================
CREATE TABLE IF NOT EXISTS diseases (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    name VARCHAR(255) NOT NULL,
    name_urdu VARCHAR(255),
    local_name VARCHAR(255), -- Common Pakistani/regional names
    category VARCHAR(50) NOT NULL, -- metabolic, infectious, reproductive, nutritional, parasitic, respiratory, digestive, musculoskeletal
    subcategory VARCHAR(100),
    causative_agent TEXT, -- Bacteria, virus, parasite, etc.
    affected_species TEXT[] NOT NULL DEFAULT ARRAY['cow', 'buffalo'], -- cow, buffalo, goat, sheep, horse
    
    -- Symptoms
    symptoms TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
    early_signs TEXT[],
    advanced_signs TEXT[],
    
    -- Transmission & Risk
    transmission_mode TEXT, -- direct contact, vector-borne, airborne, fecal-oral
    incubation_period VARCHAR(100),
    mortality_rate VARCHAR(50),
    morbidity_rate VARCHAR(50),
    zoonotic BOOLEAN DEFAULT FALSE,
    
    -- Seasonality in Pakistan
    peak_season VARCHAR(100), -- monsoon, summer, winter, year-round
    high_risk_regions TEXT[], -- Punjab, Sindh, KPK, Balochistan
    
    -- Prevention
    preventive_measures TEXT[],
    vaccination_available BOOLEAN DEFAULT FALSE,
    
    -- Economic Impact (1-5 scale)
    economic_impact_score INTEGER DEFAULT 3 CHECK (economic_impact_score >= 1 AND economic_impact_score <= 5),
    milk_production_impact VARCHAR(100),
    
    -- Metadata
    severity_default VARCHAR(20) DEFAULT 'moderate', -- mild, moderate, severe, critical
    is_notifiable BOOLEAN DEFAULT FALSE, -- Government notification required
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_diseases_category ON diseases(category);
CREATE INDEX IF NOT EXISTS idx_diseases_affected_species ON diseases USING GIN(affected_species);
CREATE INDEX IF NOT EXISTS idx_diseases_name ON diseases(name);

-- =====================================================
-- MEDICINES TABLE - Master list of medicines
-- =====================================================
CREATE TABLE IF NOT EXISTS medicines (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    
    -- Basic Info
    name VARCHAR(255) NOT NULL,
    generic_name VARCHAR(255),
    brand_name VARCHAR(255),
    manufacturer VARCHAR(255), -- Star Labs, SAMI Pharma, Hilton, Prix Pharma, etc.
    
    -- Classification
    category medicine_category NOT NULL,
    form medicine_form NOT NULL,
    route administration_route NOT NULL,
    
    -- Composition
    active_ingredients JSONB, -- [{name, concentration, unit}]
    strength VARCHAR(100), -- e.g., "100mg/ml", "20%"
    
    -- Dosage Info
    dosage_per_kg VARCHAR(100), -- e.g., "1ml per 10kg"
    dosage_instructions TEXT,
    frequency VARCHAR(100), -- e.g., "Once daily for 3-5 days"
    duration_days INTEGER,
    
    -- Species-specific dosing
    species_dosage JSONB, -- {cow: {dose, route}, buffalo: {dose, route}, ...}
    
    -- Precautions
    withdrawal_period_milk INTEGER, -- days
    withdrawal_period_meat INTEGER, -- days
    contraindications TEXT[],
    side_effects TEXT[],
    drug_interactions TEXT[],
    pregnancy_safe BOOLEAN,
    lactation_safe BOOLEAN,
    
    -- Storage
    storage_conditions TEXT,
    shelf_life_months INTEGER,
    
    -- Availability in Pakistan
    available_in_pakistan BOOLEAN DEFAULT TRUE,
    prescription_required BOOLEAN DEFAULT TRUE,
    price_range_pkr VARCHAR(100), -- e.g., "500-1500"
    pack_sizes TEXT[], -- ["10ml", "50ml", "100ml"]
    
    -- Ratings (based on vet reviews)
    effectiveness_rating DECIMAL(3,2) DEFAULT 4.0 CHECK (effectiveness_rating >= 0 AND effectiveness_rating <= 5),
    popularity_score INTEGER DEFAULT 50 CHECK (popularity_score >= 0 AND popularity_score <= 100),
    
    -- Metadata
    is_active BOOLEAN DEFAULT TRUE,
    notes TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_medicines_category ON medicines(category);
CREATE INDEX IF NOT EXISTS idx_medicines_manufacturer ON medicines(manufacturer);
CREATE INDEX IF NOT EXISTS idx_medicines_name ON medicines(name);
CREATE INDEX IF NOT EXISTS idx_medicines_generic_name ON medicines(generic_name);

-- =====================================================
-- DISEASE_TREATMENTS - Links diseases to recommended medicines
-- =====================================================
CREATE TABLE IF NOT EXISTS disease_treatments (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    disease_id TEXT NOT NULL REFERENCES diseases(id) ON DELETE CASCADE,
    medicine_id TEXT NOT NULL REFERENCES medicines(id) ON DELETE CASCADE,
    
    -- Treatment details
    is_primary_treatment BOOLEAN DEFAULT FALSE,
    treatment_line INTEGER DEFAULT 1, -- 1st line, 2nd line, 3rd line
    effectiveness_rating DECIMAL(3,2) DEFAULT 4.0,
    
    -- Dosage for this specific disease
    recommended_dosage TEXT,
    dosage_per_kg TEXT,
    frequency TEXT,
    duration_days INTEGER,
    
    -- Species-specific
    for_species TEXT[] DEFAULT ARRAY['cow', 'buffalo', 'goat', 'sheep'],
    
    -- Notes
    special_instructions TEXT,
    when_to_use TEXT, -- "early stage", "severe cases", "as supportive therapy"
    
    created_at TIMESTAMP DEFAULT NOW(),
    
    UNIQUE(disease_id, medicine_id)
);

CREATE INDEX IF NOT EXISTS idx_disease_treatments_disease ON disease_treatments(disease_id);
CREATE INDEX IF NOT EXISTS idx_disease_treatments_medicine ON disease_treatments(medicine_id);

-- =====================================================
-- VACCINATION_SCHEDULES - Recommended vaccination protocols
-- =====================================================
CREATE TABLE IF NOT EXISTS vaccination_schedules (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    
    disease_id TEXT REFERENCES diseases(id) ON DELETE CASCADE,
    vaccine_medicine_id TEXT REFERENCES medicines(id) ON DELETE CASCADE,
    
    -- Schedule details
    species TEXT NOT NULL, -- cow, buffalo, goat, sheep
    animal_age_start_months INTEGER, -- Minimum age for first dose
    animal_age_start_label VARCHAR(100), -- "3 months", "At birth"
    
    -- Doses
    dose_number INTEGER DEFAULT 1,
    interval_from_previous_days INTEGER, -- Days after previous dose
    booster_interval_months INTEGER, -- For annual/periodic boosters
    
    -- Timing
    recommended_season VARCHAR(100), -- "Before monsoon", "Pre-winter"
    recommended_months TEXT[], -- ["March", "April", "September"]
    
    -- Administration
    route administration_route,
    dosage TEXT,
    
    -- Priority (for Pakistan context)
    priority VARCHAR(20) DEFAULT 'recommended', -- essential, recommended, optional
    government_program BOOLEAN DEFAULT FALSE, -- Part of govt vaccination drive
    
    notes TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_vaccination_schedules_species ON vaccination_schedules(species);
CREATE INDEX IF NOT EXISTS idx_vaccination_schedules_disease ON vaccination_schedules(disease_id);

-- =====================================================
-- TREATMENT_PROTOCOLS - Standard treatment protocols
-- =====================================================
CREATE TABLE IF NOT EXISTS treatment_protocols (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    
    disease_id TEXT NOT NULL REFERENCES diseases(id) ON DELETE CASCADE,
    
    -- Protocol info
    name VARCHAR(255) NOT NULL,
    protocol_type VARCHAR(50) NOT NULL, -- diagnosis, treatment, prevention, emergency_care
    severity_level VARCHAR(20), -- mild, moderate, severe, critical
    
    -- Steps
    steps JSONB NOT NULL, -- [{order, action, duration, notes}]
    
    -- Medicines in protocol
    medicines_required JSONB, -- [{medicine_id, dosage, frequency, duration}]
    
    -- Supportive care
    supportive_care TEXT[],
    dietary_recommendations TEXT[],
    isolation_required BOOLEAN DEFAULT FALSE,
    
    -- Expected outcomes
    expected_recovery_days INTEGER,
    success_rate VARCHAR(50),
    
    -- When to escalate
    escalation_signs TEXT[],
    refer_to_vet_when TEXT[],
    
    -- Source
    source VARCHAR(255), -- "Pakistan Veterinary Guidelines", "Star Labs Protocol"
    
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_treatment_protocols_disease ON treatment_protocols(disease_id);
CREATE INDEX IF NOT EXISTS idx_treatment_protocols_type ON treatment_protocols(protocol_type);

-- =====================================================
-- TENANT_MEDICINE_INVENTORY - Farm's medicine stock
-- =====================================================
CREATE TABLE IF NOT EXISTS tenant_medicine_inventory (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    tenant_id TEXT NOT NULL,
    medicine_id TEXT NOT NULL REFERENCES medicines(id) ON DELETE CASCADE,
    
    -- Stock info
    quantity INTEGER NOT NULL DEFAULT 0,
    unit VARCHAR(50), -- ml, tablets, vials, etc.
    batch_number VARCHAR(100),
    
    -- Dates
    purchase_date TIMESTAMP,
    expiry_date TIMESTAMP,
    
    -- Cost
    purchase_price INTEGER, -- in smallest currency unit (paise)
    supplier VARCHAR(255),
    
    -- Location
    storage_location VARCHAR(255),
    
    -- Thresholds
    reorder_level INTEGER DEFAULT 5,
    
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    
    UNIQUE(tenant_id, medicine_id, batch_number)
);

CREATE INDEX IF NOT EXISTS idx_tenant_medicine_inventory_tenant ON tenant_medicine_inventory(tenant_id);
CREATE INDEX IF NOT EXISTS idx_tenant_medicine_inventory_medicine ON tenant_medicine_inventory(medicine_id);
CREATE INDEX IF NOT EXISTS idx_tenant_medicine_inventory_expiry ON tenant_medicine_inventory(expiry_date);

-- =====================================================
-- ANIMAL_TREATMENTS - Records of treatments given to animals
-- =====================================================
CREATE TABLE IF NOT EXISTS animal_treatments (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    tenant_id TEXT NOT NULL,
    animal_id TEXT NOT NULL,
    health_record_id TEXT, -- Link to existing health_records table
    
    -- Disease/Condition
    disease_id TEXT REFERENCES diseases(id),
    condition_name VARCHAR(255), -- For custom conditions not in disease list
    symptoms_observed TEXT[],
    
    -- Diagnosis
    diagnosis_date TIMESTAMP NOT NULL,
    diagnosed_by VARCHAR(255),
    diagnosis_method VARCHAR(100), -- clinical_exam, lab_test, ultrasound
    severity VARCHAR(20) DEFAULT 'moderate',
    
    -- Treatment
    treatment_protocol_id TEXT REFERENCES treatment_protocols(id),
    treatment_start_date TIMESTAMP NOT NULL,
    treatment_end_date TIMESTAMP,
    
    -- Medicines administered
    medicines_given JSONB, -- [{medicine_id, dosage, frequency, start_date, end_date, administered_by}]
    
    -- Outcome
    status VARCHAR(30) DEFAULT 'in_treatment', -- in_treatment, recovering, recovered, chronic, deceased
    outcome_date TIMESTAMP,
    outcome_notes TEXT,
    
    -- Follow-up
    follow_up_required BOOLEAN DEFAULT FALSE,
    next_follow_up_date TIMESTAMP,
    
    -- Cost tracking
    total_cost INTEGER DEFAULT 0,
    
    -- Metadata
    recorded_by TEXT,
    notes TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_animal_treatments_tenant ON animal_treatments(tenant_id);
CREATE INDEX IF NOT EXISTS idx_animal_treatments_animal ON animal_treatments(animal_id);
CREATE INDEX IF NOT EXISTS idx_animal_treatments_disease ON animal_treatments(disease_id);
CREATE INDEX IF NOT EXISTS idx_animal_treatments_status ON animal_treatments(status);

-- =====================================================
-- ANIMAL_VACCINATIONS - Vaccination records for animals
-- =====================================================
CREATE TABLE IF NOT EXISTS animal_vaccinations (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    tenant_id TEXT NOT NULL,
    animal_id TEXT NOT NULL,
    
    -- Vaccine info
    vaccine_id TEXT REFERENCES medicines(id),
    disease_id TEXT REFERENCES diseases(id),
    vaccine_name VARCHAR(255), -- For custom/unlisted vaccines
    
    -- Administration
    vaccination_date TIMESTAMP NOT NULL,
    administered_by VARCHAR(255),
    batch_number VARCHAR(100),
    
    -- Dosage
    dose_number INTEGER DEFAULT 1,
    dosage TEXT,
    route administration_route,
    injection_site VARCHAR(100),
    
    -- Schedule
    schedule_id TEXT REFERENCES vaccination_schedules(id),
    next_due_date TIMESTAMP,
    
    -- Reaction tracking
    adverse_reaction BOOLEAN DEFAULT FALSE,
    reaction_details TEXT,
    reaction_severity VARCHAR(20), -- mild, moderate, severe
    
    -- Cost
    cost INTEGER,
    
    -- Status
    status VARCHAR(30) DEFAULT 'administered', -- scheduled, administered, overdue, skipped
    
    -- Metadata
    notes TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_animal_vaccinations_tenant ON animal_vaccinations(tenant_id);
CREATE INDEX IF NOT EXISTS idx_animal_vaccinations_animal ON animal_vaccinations(animal_id);
CREATE INDEX IF NOT EXISTS idx_animal_vaccinations_vaccine ON animal_vaccinations(vaccine_id);
CREATE INDEX IF NOT EXISTS idx_animal_vaccinations_next_due ON animal_vaccinations(next_due_date);
