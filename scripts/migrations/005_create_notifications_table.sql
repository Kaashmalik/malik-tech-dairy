-- Migration 005: Create in-app notifications table with RLS policies
-- Addresses finding A10 / schema gap for in-app notifications

CREATE TABLE IF NOT EXISTS public.notifications (
  id text PRIMARY KEY,
  tenant_id text NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  user_id text,
  type varchar(50) NOT NULL,
  title varchar(255) NOT NULL,
  message text NOT NULL,
  link text,
  read boolean NOT NULL DEFAULT false,
  metadata jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS notifications_tenant_id_idx ON public.notifications(tenant_id);
CREATE INDEX IF NOT EXISTS notifications_user_id_idx ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS notifications_read_idx ON public.notifications(read);
CREATE INDEX IF NOT EXISTS notifications_created_at_idx ON public.notifications(created_at);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS notifications_select_policy ON public.notifications;
CREATE POLICY notifications_select_policy ON public.notifications
  FOR SELECT TO public
  USING (user_is_member_of_tenant(tenant_id));

DROP POLICY IF EXISTS notifications_insert_policy ON public.notifications;
CREATE POLICY notifications_insert_policy ON public.notifications
  FOR INSERT TO public
  WITH CHECK (user_is_member_of_tenant(tenant_id));

DROP POLICY IF EXISTS notifications_update_policy ON public.notifications;
CREATE POLICY notifications_update_policy ON public.notifications
  FOR UPDATE TO public
  USING (user_is_member_of_tenant(tenant_id));

DROP POLICY IF EXISTS notifications_delete_policy ON public.notifications;
CREATE POLICY notifications_delete_policy ON public.notifications
  FOR DELETE TO public
  USING (user_is_member_of_tenant(tenant_id));

DROP POLICY IF EXISTS "Allow service role full access to notifications" ON public.notifications;
CREATE POLICY "Allow service role full access to notifications" ON public.notifications
  FOR ALL TO service_role
  USING (true)
  WITH CHECK (true);
