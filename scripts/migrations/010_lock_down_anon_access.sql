-- Migration 010: Deny all direct table access from the public anon/authenticated roles
--
-- Context (Phase 2): the app authenticates users with Clerk, not Supabase Auth, and
-- every data access now goes through server routes using the service role
-- (lib/supabase/tenant-db.ts enforces tenant_id). The anon key is shipped to every
-- browser, so any table it can reach is effectively public. This migration makes the
-- database deny-by-default for those roles. The service role bypasses RLS and is
-- unaffected.
--
-- Safe to re-run. Review in a staging project first:
--   1. Run the PRE-CHECK query and note tables with RLS disabled.
--   2. Apply this file in the Supabase SQL editor.
--   3. Run the POST-CHECK query; every row should show rls_enabled = true and no
--      anon/authenticated grants.

-- PRE-CHECK (read-only):
-- SELECT c.relname AS table_name, c.relrowsecurity AS rls_enabled
-- FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
-- WHERE n.nspname = 'public' AND c.relkind = 'r' ORDER BY 2, 1;

BEGIN;

-- 1. Enable RLS on every table in public (existing policies keep working; tables
--    without policies become deny-all for non-service roles).
DO $$
DECLARE
  t record;
BEGIN
  FOR t IN
    SELECT c.relname
    FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public' AND c.relkind IN ('r', 'p')
  LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t.relname);
  END LOOP;
END
$$;

-- 2. Remove table/sequence/function privileges from the browser-facing roles.
REVOKE ALL ON ALL TABLES IN SCHEMA public FROM anon, authenticated;
REVOKE ALL ON ALL SEQUENCES IN SCHEMA public FROM anon, authenticated;
REVOKE EXECUTE ON ALL FUNCTIONS IN SCHEMA public FROM anon, authenticated;

-- 3. Keep it that way for objects created later.
ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE ALL ON TABLES FROM anon, authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE ALL ON SEQUENCES FROM anon, authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE EXECUTE ON FUNCTIONS FROM anon, authenticated;

COMMIT;

-- POST-CHECK (read-only):
-- SELECT c.relname, c.relrowsecurity AS rls_enabled,
--        has_table_privilege('anon', c.oid, 'SELECT') AS anon_select,
--        has_table_privilege('authenticated', c.oid, 'SELECT') AS auth_select
-- FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
-- WHERE n.nspname = 'public' AND c.relkind = 'r' ORDER BY 1;
