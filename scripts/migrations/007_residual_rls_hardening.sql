-- Migration 007: Residual RLS hardening after 006
-- - Close 2-arg membership oracle to clients
-- - Deny anon on unused UUID overload
-- - Remove duplicate assets INSERT policy

REVOKE EXECUTE ON FUNCTION public.user_is_member_of_tenant(text, text) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.user_is_member_of_tenant(text, text) FROM anon;
REVOKE EXECUTE ON FUNCTION public.user_is_member_of_tenant(text, text) FROM authenticated;

REVOKE EXECUTE ON FUNCTION public.user_is_member_of_tenant(uuid) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.user_is_member_of_tenant(uuid) FROM anon;

DROP POLICY IF EXISTS "Assets: Users can insert assets for their tenant" ON public.assets;
