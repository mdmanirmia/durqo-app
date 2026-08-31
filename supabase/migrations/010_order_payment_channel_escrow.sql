-- ============================================================
-- Durqo — add "escrow" as a payment_channel option (migration 009
-- only allowed stripe / durqo_platform / bangladesh_gateway). This
-- lets admin mark a payment as currently held in escrow rather than
-- forcing it into one of the three settlement rails.
--
-- Postgres names an inline column check constraint
-- "<table>_<column>_check" by default, so that's what migration 009
-- created it as; drop and recreate it with the wider list.
-- ============================================================

alter table public.orders
  drop constraint if exists orders_payment_channel_check;

alter table public.orders
  add constraint orders_payment_channel_check
    check (payment_channel in ('stripe', 'durqo_platform', 'bangladesh_gateway', 'escrow'));
