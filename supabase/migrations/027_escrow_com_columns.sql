-- ============================================================
-- Durqo — real Escrow.com integration (Sep 10, 2026). Distinct from the
-- existing payment_channel value 'escrow' (migration 010), which is just a
-- manual admin label meaning "funds are currently held, rail unspecified"
-- and isn't wired to any real gateway. This is the opposite: a genuine
-- third checkout option, alongside Stripe and SSLCommerz, that actually
-- calls the Escrow.com API. Named 'escrow_com' throughout (column values,
-- code) specifically so it's never confused with the pre-existing manual
-- 'escrow' label admin can still pick from the Orders dashboard dropdown.
--
-- escrow_transaction_id: the numeric id Escrow.com assigns the transaction
-- on creation (POST /transaction) — everything else about that transaction
-- (parties, items, funding status) is fetched live from Escrow.com's own
-- API when needed rather than mirrored here, the same "re-fetch, don't
-- trust a cached copy" posture the webhook handler uses (Escrow.com
-- webhooks aren't signed, so the transaction id is the only thing worth
-- persisting — the payload itself is never trusted).
--
-- Mirrors migration 005/024's reasoning: no RLS policy changes needed,
-- since orders_select_involved/orders_update_involved already cover new
-- columns, and the only writer of escrow_transaction_id (the init route)
-- runs as the signed-in buyer through normal RLS, same as every other
-- orders insert.
-- ============================================================

alter table public.orders
  add column if not exists escrow_transaction_id bigint;

create index if not exists orders_escrow_transaction_id_idx
  on public.orders(escrow_transaction_id);

alter table public.orders
  drop constraint if exists orders_payment_channel_check;

alter table public.orders
  add constraint orders_payment_channel_check
    check (payment_channel in ('stripe', 'durqo_platform', 'bangladesh_gateway', 'escrow', 'escrow_com'));
