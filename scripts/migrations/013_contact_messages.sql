-- Migration 013: contact form inbox (public /contact page -> POST /api/contact)
-- Written only by the server (service role). RLS on, no policies: not readable with
-- the anon key. Safe to re-run.

CREATE TABLE IF NOT EXISTS public.contact_messages (
  id text PRIMARY KEY,
  name varchar(120) NOT NULL,
  phone varchar(30) NOT NULL,
  email varchar(255),
  farm_name varchar(255),
  animal_count varchar(30),
  message text NOT NULL,
  ip_address varchar(45),
  user_agent text,
  status varchar(20) NOT NULL DEFAULT 'new', -- new, replied, closed
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS contact_messages_created_at_idx
  ON public.contact_messages (created_at DESC);

ALTER TABLE public.contact_messages ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.contact_messages FROM anon, authenticated;
