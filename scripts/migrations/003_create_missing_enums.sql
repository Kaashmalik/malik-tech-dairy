-- Migration 003: Create missing PostgreSQL ENUM types defined in Drizzle schema
-- Addresses DB-003

DO $$ BEGIN
  CREATE TYPE public.disease_category AS ENUM (
    'metabolic', 'infectious', 'reproductive', 'nutritional',
    'parasitic', 'respiratory', 'digestive', 'musculoskeletal'
  );
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE public.disease_severity AS ENUM (
    'mild', 'moderate', 'severe', 'critical'
  );
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE public.treatment_outcome AS ENUM (
    'pending', 'recovering', 'recovered', 'chronic', 'deceased', 'euthanized'
  );
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE public.vaccine_type AS ENUM (
    'live_attenuated', 'inactivated', 'subunit', 'toxoid', 'conjugate', 'mrna'
  );
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE public.vaccination_status AS ENUM (
    'scheduled', 'administered', 'overdue', 'skipped', 'reaction_recorded'
  );
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE public.protocol_type AS ENUM (
    'diagnosis', 'treatment', 'prevention', 'emergency_care'
  );
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE public.feed_type AS ENUM (
    'concentrate', 'silage', 'hay', 'minerals', 'supplements', 'water'
  );
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE public.feed_unit AS ENUM (
    'kg', 'liters', 'grams', 'tons'
  );
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE public.task_status AS ENUM (
    'pending', 'in_progress', 'completed', 'overdue', 'cancelled'
  );
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE public.task_priority AS ENUM (
    'low', 'medium', 'high', 'urgent'
  );
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE public.attendance_status AS ENUM (
    'present', 'absent', 'late', 'on_leave'
  );
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE public.device_type AS ENUM (
    'milk_meter', 'activity_monitor', 'temperature_sensor',
    'automatic_feeder', 'water_meter', 'gps_tracker'
  );
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE public.device_status AS ENUM (
    'active', 'inactive', 'maintenance', 'error', 'offline'
  );
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE public.quality_grade AS ENUM (
    'premium', 'grade_a', 'grade_b', 'grade_c', 'rejected'
  );
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE public.test_status AS ENUM (
    'pending', 'passed', 'failed', 'requires_retest'
  );
EXCEPTION WHEN duplicate_object THEN null; END $$;
