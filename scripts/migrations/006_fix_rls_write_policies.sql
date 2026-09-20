-- Migration 006: Fix RLS write policies and remove broken ::uuid casts
-- Replaces (tenant_id)::uuid with text-based user_is_member_of_tenant(tenant_id)
-- Resolves FINDING-P1-01

-- 1. animals
DROP POLICY IF EXISTS animals_insert_policy ON public.animals;
DROP POLICY IF EXISTS animals_update_policy ON public.animals;
DROP POLICY IF EXISTS animals_delete_policy ON public.animals;

CREATE POLICY animals_insert_policy ON public.animals
  FOR INSERT TO public WITH CHECK (user_is_member_of_tenant(tenant_id));
CREATE POLICY animals_update_policy ON public.animals
  FOR UPDATE TO public USING (user_is_member_of_tenant(tenant_id));
CREATE POLICY animals_delete_policy ON public.animals
  FOR DELETE TO public USING (user_is_member_of_tenant(tenant_id));

-- 2. expenses
DROP POLICY IF EXISTS expenses_insert_policy ON public.expenses;
DROP POLICY IF EXISTS expenses_update_policy ON public.expenses;
DROP POLICY IF EXISTS expenses_delete_policy ON public.expenses;

CREATE POLICY expenses_insert_policy ON public.expenses
  FOR INSERT TO public WITH CHECK (user_is_member_of_tenant(tenant_id));
CREATE POLICY expenses_update_policy ON public.expenses
  FOR UPDATE TO public USING (user_is_member_of_tenant(tenant_id));
CREATE POLICY expenses_delete_policy ON public.expenses
  FOR DELETE TO public USING (user_is_member_of_tenant(tenant_id));

-- 3. sales
DROP POLICY IF EXISTS sales_insert_policy ON public.sales;
DROP POLICY IF EXISTS sales_update_policy ON public.sales;
DROP POLICY IF EXISTS sales_delete_policy ON public.sales;

CREATE POLICY sales_insert_policy ON public.sales
  FOR INSERT TO public WITH CHECK (user_is_member_of_tenant(tenant_id));
CREATE POLICY sales_update_policy ON public.sales
  FOR UPDATE TO public USING (user_is_member_of_tenant(tenant_id));
CREATE POLICY sales_delete_policy ON public.sales
  FOR DELETE TO public USING (user_is_member_of_tenant(tenant_id));

-- 4. milk_logs
DROP POLICY IF EXISTS milk_logs_insert_policy ON public.milk_logs;
DROP POLICY IF EXISTS milk_logs_update_policy ON public.milk_logs;
DROP POLICY IF EXISTS milk_logs_delete_policy ON public.milk_logs;

CREATE POLICY milk_logs_insert_policy ON public.milk_logs
  FOR INSERT TO public WITH CHECK (user_is_member_of_tenant(tenant_id));
CREATE POLICY milk_logs_update_policy ON public.milk_logs
  FOR UPDATE TO public USING (user_is_member_of_tenant(tenant_id));
CREATE POLICY milk_logs_delete_policy ON public.milk_logs
  FOR DELETE TO public USING (user_is_member_of_tenant(tenant_id));

-- 5. health_records
DROP POLICY IF EXISTS health_records_insert_policy ON public.health_records;
DROP POLICY IF EXISTS health_records_update_policy ON public.health_records;
DROP POLICY IF EXISTS health_records_delete_policy ON public.health_records;

CREATE POLICY health_records_insert_policy ON public.health_records
  FOR INSERT TO public WITH CHECK (user_is_member_of_tenant(tenant_id));
CREATE POLICY health_records_update_policy ON public.health_records
  FOR UPDATE TO public USING (user_is_member_of_tenant(tenant_id));
CREATE POLICY health_records_delete_policy ON public.health_records
  FOR DELETE TO public USING (user_is_member_of_tenant(tenant_id));

-- 6. feed_logs
DROP POLICY IF EXISTS feed_logs_insert_policy ON public.feed_logs;
DROP POLICY IF EXISTS feed_logs_update_policy ON public.feed_logs;
DROP POLICY IF EXISTS feed_logs_delete_policy ON public.feed_logs;

CREATE POLICY feed_logs_insert_policy ON public.feed_logs
  FOR INSERT TO public WITH CHECK (user_is_member_of_tenant(tenant_id));
CREATE POLICY feed_logs_update_policy ON public.feed_logs
  FOR UPDATE TO public USING (user_is_member_of_tenant(tenant_id));
CREATE POLICY feed_logs_delete_policy ON public.feed_logs
  FOR DELETE TO public USING (user_is_member_of_tenant(tenant_id));

-- 7. vaccinations
DROP POLICY IF EXISTS vaccinations_insert_policy ON public.vaccinations;
DROP POLICY IF EXISTS vaccinations_update_policy ON public.vaccinations;
DROP POLICY IF EXISTS vaccinations_delete_policy ON public.vaccinations;

CREATE POLICY vaccinations_insert_policy ON public.vaccinations
  FOR INSERT TO public WITH CHECK (user_is_member_of_tenant(tenant_id));
CREATE POLICY vaccinations_update_policy ON public.vaccinations
  FOR UPDATE TO public USING (user_is_member_of_tenant(tenant_id));
CREATE POLICY vaccinations_delete_policy ON public.vaccinations
  FOR DELETE TO public USING (user_is_member_of_tenant(tenant_id));

-- 8. medicine_inventory
DROP POLICY IF EXISTS medicine_inventory_insert_policy ON public.medicine_inventory;
DROP POLICY IF EXISTS medicine_inventory_update_policy ON public.medicine_inventory;
DROP POLICY IF EXISTS medicine_inventory_delete_policy ON public.medicine_inventory;

CREATE POLICY medicine_inventory_insert_policy ON public.medicine_inventory
  FOR INSERT TO public WITH CHECK (user_is_member_of_tenant(tenant_id));
CREATE POLICY medicine_inventory_update_policy ON public.medicine_inventory
  FOR UPDATE TO public USING (user_is_member_of_tenant(tenant_id));
CREATE POLICY medicine_inventory_delete_policy ON public.medicine_inventory
  FOR DELETE TO public USING (user_is_member_of_tenant(tenant_id));

-- 9. medicine_logs
DROP POLICY IF EXISTS medicine_logs_insert_policy ON public.medicine_logs;
DROP POLICY IF EXISTS medicine_logs_update_policy ON public.medicine_logs;
DROP POLICY IF EXISTS medicine_logs_delete_policy ON public.medicine_logs;

CREATE POLICY medicine_logs_insert_policy ON public.medicine_logs
  FOR INSERT TO public WITH CHECK (user_is_member_of_tenant(tenant_id));
CREATE POLICY medicine_logs_update_policy ON public.medicine_logs
  FOR UPDATE TO public USING (user_is_member_of_tenant(tenant_id));
CREATE POLICY medicine_logs_delete_policy ON public.medicine_logs
  FOR DELETE TO public USING (user_is_member_of_tenant(tenant_id));

-- 10. weather_data
DROP POLICY IF EXISTS weather_data_insert_policy ON public.weather_data;
DROP POLICY IF EXISTS weather_data_update_policy ON public.weather_data;
DROP POLICY IF EXISTS weather_data_delete_policy ON public.weather_data;

CREATE POLICY weather_data_insert_policy ON public.weather_data
  FOR INSERT TO public WITH CHECK (user_is_member_of_tenant(tenant_id));
CREATE POLICY weather_data_update_policy ON public.weather_data
  FOR UPDATE TO public USING (user_is_member_of_tenant(tenant_id));
CREATE POLICY weather_data_delete_policy ON public.weather_data
  FOR DELETE TO public USING (user_is_member_of_tenant(tenant_id));

-- 11. animal_treatments
DROP POLICY IF EXISTS "Users can delete animal treatments" ON public.animal_treatments;
DROP POLICY IF EXISTS "Users can insert animal treatments" ON public.animal_treatments;
DROP POLICY IF EXISTS "Users can update animal treatments" ON public.animal_treatments;
DROP POLICY IF EXISTS "Users can view animal treatments" ON public.animal_treatments;

CREATE POLICY "Users can view animal treatments" ON public.animal_treatments
  FOR SELECT TO public USING (user_is_member_of_tenant(tenant_id));
CREATE POLICY "Users can insert animal treatments" ON public.animal_treatments
  FOR INSERT TO public WITH CHECK (user_is_member_of_tenant(tenant_id));
CREATE POLICY "Users can update animal treatments" ON public.animal_treatments
  FOR UPDATE TO public USING (user_is_member_of_tenant(tenant_id));
CREATE POLICY "Users can delete animal treatments" ON public.animal_treatments
  FOR DELETE TO public USING (user_is_member_of_tenant(tenant_id));

-- 12. animal_vaccinations
DROP POLICY IF EXISTS "Users can delete animal vaccinations" ON public.animal_vaccinations;
DROP POLICY IF EXISTS "Users can insert animal vaccinations" ON public.animal_vaccinations;
DROP POLICY IF EXISTS "Users can update animal vaccinations" ON public.animal_vaccinations;
DROP POLICY IF EXISTS "Users can view animal vaccinations" ON public.animal_vaccinations;

CREATE POLICY "Users can view animal vaccinations" ON public.animal_vaccinations
  FOR SELECT TO public USING (user_is_member_of_tenant(tenant_id));
CREATE POLICY "Users can insert animal vaccinations" ON public.animal_vaccinations
  FOR INSERT TO public WITH CHECK (user_is_member_of_tenant(tenant_id));
CREATE POLICY "Users can update animal vaccinations" ON public.animal_vaccinations
  FOR UPDATE TO public USING (user_is_member_of_tenant(tenant_id));
CREATE POLICY "Users can delete animal vaccinations" ON public.animal_vaccinations
  FOR DELETE TO public USING (user_is_member_of_tenant(tenant_id));

-- 13. tenant_medicine_inventory
DROP POLICY IF EXISTS "Users can delete tenant medicine inventory" ON public.tenant_medicine_inventory;
DROP POLICY IF EXISTS "Users can insert tenant medicine inventory" ON public.tenant_medicine_inventory;
DROP POLICY IF EXISTS "Users can update tenant medicine inventory" ON public.tenant_medicine_inventory;
DROP POLICY IF EXISTS "Users can view tenant medicine inventory" ON public.tenant_medicine_inventory;

CREATE POLICY "Users can view tenant medicine inventory" ON public.tenant_medicine_inventory
  FOR SELECT TO public USING (user_is_member_of_tenant(tenant_id));
CREATE POLICY "Users can insert tenant medicine inventory" ON public.tenant_medicine_inventory
  FOR INSERT TO public WITH CHECK (user_is_member_of_tenant(tenant_id));
CREATE POLICY "Users can update tenant medicine inventory" ON public.tenant_medicine_inventory
  FOR UPDATE TO public USING (user_is_member_of_tenant(tenant_id));
CREATE POLICY "Users can delete tenant medicine inventory" ON public.tenant_medicine_inventory
  FOR DELETE TO public USING (user_is_member_of_tenant(tenant_id));

-- 14. assets
DROP POLICY IF EXISTS assets_update_policy ON public.assets;
DROP POLICY IF EXISTS assets_delete_policy ON public.assets;

CREATE POLICY assets_update_policy ON public.assets
  FOR UPDATE TO public USING (user_is_member_of_tenant(tenant_id));
CREATE POLICY assets_delete_policy ON public.assets
  FOR DELETE TO public USING (user_is_member_of_tenant(tenant_id));
