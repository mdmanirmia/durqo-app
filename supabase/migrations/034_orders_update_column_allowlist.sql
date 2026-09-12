-- ============================================================
-- Durqo — close the already-flagged orders_update_involved RLS gap.
--
-- orders_update_involved (schema.sql) only checks ROW ownership
-- (auth.uid() = buyer_id or auth.uid() = seller_id) — it has never
-- restricted which COLUMNS a buyer or seller can set on their own order
-- row. Combined with Supabase's default project-wide table grant (full
-- select/insert/update/delete on every public table to `authenticated`),
-- this means any signed-in buyer or seller could today call
-- `.from("orders").update({...}).eq("id", myOwnOrderId)` with ANY column
-- in the payload — status, amount, buyer_id, seller_id, withdrawal_id,
-- payment_channel, etc. — and RLS would allow it, since row-level
-- policies can't see which columns are in a client's UPDATE. This was
-- flagged as a known gap during the Asset Transfer System v2 feasibility
-- review (Sep 2026) and is fixed here on its own, ahead of and
-- independent from that larger project — this is a general
-- hardening fix, not new business logic.
--
-- RLS policies alone cannot express "these columns only" — that's a
-- privilege-grant concept in Postgres, not a row-security concept. The
-- correct primitive is a column-level GRANT: narrow what `authenticated`
-- is allowed to SET in an UPDATE at all, and let the existing RLS policy
-- keep doing its job of restricting which ROWS.
--
-- The column allowlist below was derived by auditing every place in this
-- codebase that updates `orders` as the signed-in buyer/seller (not via
-- the service-role admin client, which bypasses RLS/grants entirely, and
-- not via a SECURITY DEFINER RPC, which runs as its definer):
--   - src/app/api/checkout/route.ts        -> stripe_checkout_session_id
--   - src/app/api/sslcommerz/init/route.ts -> sslcommerz_tran_id,
--                                              sslcommerz_bdt_amount,
--                                              sslcommerz_rate
--   - src/app/api/escrow/init/route.ts     -> escrow_transaction_id
-- Every other write to `orders` (webhook/IPN status flips, admin actions,
-- withdrawal claiming) already goes through src/lib/supabase/admin.ts
-- (service role) or a SECURITY DEFINER function, neither of which is
-- gated by this table-level grant — so narrowing it here cannot break
-- any of those paths. (online_charge_usd / remainder_usd are set at
-- INSERT time, inside orders_insert_buyer's payload, not via a later
-- UPDATE, so they don't need to be in this allowlist.)
--
-- If a future checkout-init route needs to set a new column as the
-- buyer's own session, it must be added to this allowlist explicitly —
-- that's the point of this fix, not an inconvenience to route around.
-- ============================================================

revoke update on public.orders from authenticated;

grant update (
  stripe_checkout_session_id,
  sslcommerz_tran_id,
  sslcommerz_bdt_amount,
  sslcommerz_rate,
  escrow_transaction_id
) on public.orders to authenticated;
