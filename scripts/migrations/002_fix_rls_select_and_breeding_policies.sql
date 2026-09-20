-- Migration 002: Fix RLS SELECT and breeding policies for tenant isolation
-- Addresses SEC-002, DB-001, and SEC-005

-- 1. Secure and unify user_is_member_of_tenant functions with SET search_path = public
CREATE OR REPLACE FUNCTION public.user_is_member_of_tenant(tenant_uuid text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.tenant_members 
    WHERE tenant_id = tenant_uuid 
    AND user_id = auth.uid()::text 
    AND status = 'active'
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.user_is_member_of_tenant(tenant_uuid uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.tenant_members 
    WHERE tenant_id = tenant_uuid::text 
    AND user_id = auth.uid()::text 
    AND status = 'active'
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.user_is_member_of_tenant(p_user_id text, p_tenant_id text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.tenant_members 
    WHERE user_id = p_user_id 
    AND tenant_id = p_tenant_id 
    AND status = 'active'
  );
END;
$$;

-- 2. Drop insecure 'true' SELECT policies and replace with tenant isolation
-- animals
DROP POLICY IF EXISTS animals_read_policy ON public.animals;
CREATE POLICY animals_read_policy ON public.animals
  FOR SELECT TO public
  USING (user_is_member_of_tenant(tenant_id));

-- expenses
DROP POLICY IF EXISTS expenses_read_policy ON public.expenses;
CREATE POLICY expenses_read_policy ON public.expenses
  FOR SELECT TO public
  USING (user_is_member_of_tenant(tenant_id));

-- sales
DROP POLICY IF EXISTS sales_read_policy ON public.sales;
CREATE POLICY sales_read_policy ON public.sales
  FOR SELECT TO public
  USING (user_is_member_of_tenant(tenant_id));

-- milk_logs
DROP POLICY IF EXISTS milk_logs_read_policy ON public.milk_logs;
CREATE POLICY milk_logs_read_policy ON public.milk_logs
  FOR SELECT TO public
  USING (user_is_member_of_tenant(tenant_id));

-- health_records
DROP POLICY IF EXISTS health_records_read_policy ON public.health_records;
CREATE POLICY health_records_read_policy ON public.health_records
  FOR SELECT TO public
  USING (user_is_member_of_tenant(tenant_id));

-- feed_logs
DROP POLICY IF EXISTS feed_logs_read_policy ON public.feed_logs;
CREATE POLICY feed_logs_read_policy ON public.feed_logs
  FOR SELECT TO public
  USING (user_is_member_of_tenant(tenant_id));

-- vaccinations
DROP POLICY IF EXISTS vaccinations_read_policy ON public.vaccinations;
CREATE POLICY vaccinations_read_policy ON public.vaccinations
  FOR SELECT TO public
  USING (user_is_member_of_tenant(tenant_id));

-- medicine_inventory
DROP POLICY IF EXISTS medicine_inventory_read_policy ON public.medicine_inventory;
CREATE POLICY medicine_inventory_read_policy ON public.medicine_inventory
  FOR SELECT TO public
  USING (user_is_member_of_tenant(tenant_id));

-- medicine_logs
DROP POLICY IF EXISTS medicine_logs_read_policy ON public.medicine_logs;
CREATE POLICY medicine_logs_read_policy ON public.medicine_logs
  FOR SELECT TO public
  USING (user_is_member_of_tenant(tenant_id));

-- weather_data
DROP POLICY IF EXISTS weather_data_read_policy ON public.weather_data;
CREATE POLICY weather_data_read_policy ON public.weather_data
  FOR SELECT TO public
  USING (user_is_member_of_tenant(tenant_id));

-- assets
DROP POLICY IF EXISTS assets_read_policy ON public.assets;
DROP POLICY IF EXISTS "Assets: Users can view assets for their tenant" ON public.assets;
CREATE POLICY assets_read_policy ON public.assets
  FOR SELECT TO public
  USING (user_is_member_of_tenant(tenant_id));

-- 3. Fix breeding tables (heat_detections, pregnancy_checks, semen_inventory)
-- heat_detections
DROP POLICY IF EXISTS "Tenant isolation for heat_detections" ON public.heat_detections;
DROP POLICY IF EXISTS heat_detections_select_policy ON public.heat_detections;
DROP POLICY IF EXISTS heat_detections_insert_policy ON public.heat_detections;
DROP POLICY IF EXISTS heat_detections_update_policy ON public.heat_detections;
DROP POLICY IF EXISTS heat_detections_delete_policy ON public.heat_detections;

CREATE POLICY heat_detections_select_policy ON public.heat_detections
  FOR SELECT TO public USING (user_is_member_of_tenant(tenant_id));
CREATE POLICY heat_detections_insert_policy ON public.heat_detections
  FOR INSERT TO public WITH CHECK (user_is_member_of_tenant(tenant_id));
CREATE POLICY heat_detections_update_policy ON public.heat_detections
  FOR UPDATE TO public USING (user_is_member_of_tenant(tenant_id));
CREATE POLICY heat_detections_delete_policy ON public.heat_detections
  FOR DELETE TO public USING (user_is_member_of_tenant(tenant_id));

-- pregnancy_checks
DROP POLICY IF EXISTS "Tenant isolation for pregnancy_checks" ON public.pregnancy_checks;
DROP POLICY IF EXISTS pregnancy_checks_select_policy ON public.pregnancy_checks;
DROP POLICY IF EXISTS pregnancy_checks_insert_policy ON public.pregnancy_checks;
DROP POLICY IF EXISTS pregnancy_checks_update_policy ON public.pregnancy_checks;
DROP POLICY IF EXISTS pregnancy_checks_delete_policy ON public.pregnancy_checks;

CREATE POLICY pregnancy_checks_select_policy ON public.pregnancy_checks
  FOR SELECT TO public USING (user_is_member_of_tenant(tenant_id));
CREATE POLICY pregnancy_checks_insert_policy ON public.pregnancy_checks
  FOR INSERT TO public WITH CHECK (user_is_member_of_tenant(tenant_id));
CREATE POLICY pregnancy_checks_update_policy ON public.pregnancy_checks
  FOR UPDATE TO public USING (user_is_member_of_tenant(tenant_id));
CREATE POLICY pregnancy_checks_delete_policy ON public.pregnancy_checks
  FOR DELETE TO public USING (user_is_member_of_tenant(tenant_id));

-- semen_inventory
DROP POLICY IF EXISTS "Tenant isolation for semen_inventory" ON public.semen_inventory;
DROP POLICY IF EXISTS semen_inventory_select_policy ON public.semen_inventory;
DROP POLICY IF EXISTS semen_inventory_insert_policy ON public.semen_inventory;
DROP POLICY IF EXISTS semen_inventory_update_policy ON public.semen_inventory;
DROP POLICY IF EXISTS semen_inventory_delete_policy ON public.semen_inventory;

CREATE POLICY semen_inventory_select_policy ON public.semen_inventory
  FOR SELECT TO public USING (user_is_member_of_tenant(tenant_id));
CREATE POLICY semen_inventory_insert_policy ON public.semen_inventory
  FOR INSERT TO public WITH CHECK (user_is_member_of_tenant(tenant_id));
CREATE POLICY semen_inventory_update_policy ON public.semen_inventory
  FOR UPDATE TO public USING (user_is_member_of_tenant(tenant_id));
CREATE POLICY semen_inventory_delete_policy ON public.semen_inventory
  FOR DELETE TO public USING (user_is_member_of_tenant(tenant_id));
