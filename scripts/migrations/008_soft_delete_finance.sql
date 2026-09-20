-- Migration 008: Soft-delete support for expenses and sales
ALTER TABLE public.expenses ADD COLUMN IF NOT EXISTS deleted_at timestamptz;
ALTER TABLE public.expenses ADD COLUMN IF NOT EXISTS updated_at timestamptz;
ALTER TABLE public.sales ADD COLUMN IF NOT EXISTS deleted_at timestamptz;
ALTER TABLE public.sales ADD COLUMN IF NOT EXISTS updated_at timestamptz;

CREATE INDEX IF NOT EXISTS expenses_deleted_at_idx ON public.expenses (deleted_at);
CREATE INDEX IF NOT EXISTS sales_deleted_at_idx ON public.sales (deleted_at);
