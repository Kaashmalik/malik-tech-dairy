-- Migration 004: Add financial and quantity CHECK constraints
-- Prevents negative amounts and invalid numbers from corrupting financial and production logs

ALTER TABLE public.expenses
  ADD CONSTRAINT expenses_amount_non_negative CHECK (amount >= 0);

ALTER TABLE public.sales
  ADD CONSTRAINT sales_total_non_negative CHECK (total >= 0),
  ADD CONSTRAINT sales_quantity_non_negative CHECK (quantity >= 0);

ALTER TABLE public.payments
  ADD CONSTRAINT payments_amount_non_negative CHECK (amount >= 0);

ALTER TABLE public.milk_logs
  ADD CONSTRAINT milk_logs_quantity_non_negative CHECK (quantity >= 0);
