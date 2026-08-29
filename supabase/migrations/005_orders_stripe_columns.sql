-- ============================================================
-- Durqo — Stripe Checkout integration. Links an orders row back to the
-- Stripe Checkout Session that collected payment for it, and (once payment
-- succeeds) the resulting PaymentIntent. Both nullable: rows created before
-- this migration, or orders that never reach a completed checkout, simply
-- have no Stripe id attached.
--
-- No RLS policy changes needed — the existing orders_select_involved /
-- orders_update_involved policies already cover these columns, and the
-- webhook handler that sets stripe_payment_intent_id writes through the
-- service-role admin client (src/lib/supabase/admin.ts), which bypasses RLS
-- entirely (there's no buyer session inside a webhook request).
-- ============================================================

alter table public.orders
  add column if not exists stripe_checkout_session_id text,
  add column if not exists stripe_payment_intent_id text;

create index if not exists orders_stripe_checkout_session_idx
  on public.orders(stripe_checkout_session_id);
