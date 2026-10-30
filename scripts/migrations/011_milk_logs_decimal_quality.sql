-- Migration 011: milk_logs - decimal litres, SNF, and one entry per animal/session
--
-- Why: milk_logs.quantity was INTEGER while the app records litres with one decimal
-- (e.g. 12.5). Postgres rejected every fractional entry. Existing rows already hold
-- whole litres (that is what the app wrote), so a plain cast keeps them correct.
--
-- fat and snf are stored as percentage * 100 (450 = 4.50%), matching the existing
-- fat column encoding.
--
-- Safe to re-run.

BEGIN;

-- 1. Litres with two decimals
ALTER TABLE public.milk_logs
  ALTER COLUMN quantity TYPE numeric(6,2) USING quantity::numeric;

-- 2. Solids-not-fat for fat/SNF based milk pricing
ALTER TABLE public.milk_logs ADD COLUMN IF NOT EXISTS snf integer;

ALTER TABLE public.milk_logs DROP CONSTRAINT IF EXISTS milk_logs_fat_range;
ALTER TABLE public.milk_logs
  ADD CONSTRAINT milk_logs_fat_range CHECK (fat IS NULL OR (fat >= 0 AND fat <= 2000));
ALTER TABLE public.milk_logs DROP CONSTRAINT IF EXISTS milk_logs_snf_range;
ALTER TABLE public.milk_logs
  ADD CONSTRAINT milk_logs_snf_range CHECK (snf IS NULL OR (snf >= 0 AND snf <= 2000));

-- 3. Fast per-farm date queries (dashboard, reports)
CREATE INDEX IF NOT EXISTS milk_logs_tenant_date_idx ON public.milk_logs (tenant_id, date);

COMMIT;

-- 4. One milk entry per animal per session per day.
--    Only created when there are no existing duplicates; otherwise it reports them
--    so you can decide which rows to keep (see DUPLICATE CHECK below).
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM public.milk_logs
    GROUP BY tenant_id, animal_id, date, session HAVING count(*) > 1
  ) THEN
    RAISE NOTICE 'Duplicates found - unique index NOT created. Run the DUPLICATE CHECK query, clean up, then re-run this file.';
  ELSE
    CREATE UNIQUE INDEX IF NOT EXISTS milk_logs_one_per_session_idx
      ON public.milk_logs (tenant_id, animal_id, date, session);
  END IF;
END
$$;

-- DUPLICATE CHECK (read-only):
-- SELECT tenant_id, animal_id, date, session, count(*), array_agg(id ORDER BY created_at)
-- FROM public.milk_logs GROUP BY 1,2,3,4 HAVING count(*) > 1;

-- POST-CHECK:
-- SELECT column_name, data_type FROM information_schema.columns
-- WHERE table_name = 'milk_logs' AND column_name IN ('quantity','fat','snf');
-- SELECT indexname FROM pg_indexes WHERE tablename = 'milk_logs';
