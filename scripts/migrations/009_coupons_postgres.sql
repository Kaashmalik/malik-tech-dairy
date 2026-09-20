-- Migration 009: Coupons + coupon_usage (Postgres cutover from Firestore)
CREATE TABLE IF NOT EXISTS public.coupons (
  id text PRIMARY KEY,
  code varchar(50) NOT NULL UNIQUE,
  type varchar(20) NOT NULL,
  value integer NOT NULL,
  target_plans jsonb NOT NULL DEFAULT '[]'::jsonb,
  min_amount integer,
  max_discount integer,
  valid_from timestamptz NOT NULL,
  valid_until timestamptz NOT NULL,
  max_uses integer,
  max_uses_per_user integer,
  is_active boolean NOT NULL DEFAULT true,
  description text,
  created_by text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.coupon_usage (
  id text PRIMARY KEY,
  coupon_id text NOT NULL REFERENCES public.coupons(id) ON DELETE CASCADE,
  tenant_id text NOT NULL,
  user_id text NOT NULL,
  order_id text NOT NULL,
  discount_amount integer NOT NULL DEFAULT 0,
  used_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS coupons_code_idx ON public.coupons (code);
CREATE INDEX IF NOT EXISTS coupons_is_active_idx ON public.coupons (is_active);
CREATE INDEX IF NOT EXISTS coupon_usage_coupon_id_idx ON public.coupon_usage (coupon_id);
CREATE INDEX IF NOT EXISTS coupon_usage_user_id_idx ON public.coupon_usage (user_id);

ALTER TABLE public.coupons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coupon_usage ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS coupons_service_role ON public.coupons;
CREATE POLICY coupons_service_role ON public.coupons FOR ALL TO service_role USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS coupon_usage_service_role ON public.coupon_usage;
CREATE POLICY coupon_usage_service_role ON public.coupon_usage FOR ALL TO service_role USING (true) WITH CHECK (true);
