-- Migration 012: farm suspension (super-admin "Pause farm")
--
-- While tenants.suspended_at is set, every tenant API returns 423 for that farm's
-- members (lib/tenant/context.ts getTenantContext). Super admins keep access.
-- The app works without this migration (suspend action then reports an error).
--
-- Safe to re-run.

ALTER TABLE public.tenants ADD COLUMN IF NOT EXISTS suspended_at timestamptz;
ALTER TABLE public.tenants ADD COLUMN IF NOT EXISTS suspended_reason text;

CREATE INDEX IF NOT EXISTS tenants_suspended_at_idx
  ON public.tenants (suspended_at) WHERE suspended_at IS NOT NULL;

-- POST-CHECK:
-- SELECT column_name FROM information_schema.columns
-- WHERE table_name = 'tenants' AND column_name IN ('suspended_at', 'suspended_reason');
