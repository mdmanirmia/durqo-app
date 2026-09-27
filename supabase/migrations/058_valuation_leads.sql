-- ============================================================
-- Durqo — Free Valuation lead-generation tool (Sep 27, 2026).
--
-- Site owner: "akta Free Evaluation system ki kora jai jeikhane kisu data
-- share kore akta rough idea pabe seller ra koto USD price sale hote pare
-- tader business and amra o lead collection korte parbo" — a real
-- interactive valuation tool at /valuation, replacing the dead
-- /contact?subject=valuation link the "Get a free valuation" buttons on
-- /sell used to point to (there was never an actual calculator or lead
-- record before this — just a static "illustrative example" card).
--
-- Every submission stores one row here: the business numbers the visitor
-- entered, the range they were shown, and their contact info, so the Durqo
-- team can follow up as a sales lead. Deliberately RLS-enabled with zero
-- client-facing policies (same "service-role only" choice already made for
-- withdrawal_requests, order_reviews' moderation columns, etc.) rather than
-- a permissive anon-insert policy — the only writer is the server-only
-- submitValuationLead() action (src/app/valuation/actions.ts), and the only
-- reader is the admin dashboard (createAdminClient, gated by
-- requireAdmin() — src/app/dashboard/admin/valuation-leads/page.tsx).
-- ============================================================

create table if not exists public.valuation_leads (
  id uuid primary key default uuid_generate_v4(),
  created_at timestamptz not null default now(),
  name text not null,
  email text not null,
  phone text,
  category_id text not null,
  monthly_revenue numeric not null default 0,
  monthly_profit numeric not null default 0,
  business_age_years numeric not null default 0,
  estimated_low numeric not null,
  estimated_high numeric not null,
  -- Set when the submitter happens to be signed in at the time of
  -- submission, purely for cross-reference — never required, since most
  -- visitors using a lead-gen tool like this won't have an account yet.
  user_id uuid references auth.users(id) on delete set null,
  status text not null default 'new' check (status in ('new', 'contacted', 'closed')),
  admin_note text
);

create index if not exists valuation_leads_created_at_idx on public.valuation_leads (created_at desc);
create index if not exists valuation_leads_status_idx on public.valuation_leads (status);

alter table public.valuation_leads enable row level security;
-- No policies added on purpose: RLS-enabled-with-zero-policies denies every
-- role except the service-role client (which bypasses RLS entirely). This
-- table never needs a direct client-side Supabase call in either direction.
