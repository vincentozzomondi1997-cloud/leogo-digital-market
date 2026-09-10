-- LEOGO TRANSPORT QUOTE / CUSTOMER ACCEPTANCE WORKFLOW
-- Rider submits base price -> LEOGO adds 10% service fee -> customer accepts/rejects -> rider can start only after acceptance.
-- Admin can revise the base price before transport starts.

alter table public.transport_requests
  add column if not exists service_fee numeric(12,2),
  add column if not exists customer_total numeric(12,2),
  add column if not exists quote_status text not null default 'awaiting_rider_quote',
  add column if not exists quote_submitted_at timestamptz,
  add column if not exists quote_updated_at timestamptz,
  add column if not exists quote_updated_by uuid,
  add column if not exists customer_decision_at timestamptz;

-- The live migration is already applied to Supabase. Keep this file as the versioned source of the workflow SQL.
