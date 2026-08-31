-- ============================================================
-- Durqo — track which rail an order was actually paid through, as
-- a manual admin-set label (not wired to any real payment gateway
-- — a Bangladesh gateway isn't integrated yet; this just lets
-- admin record how a sale was actually settled).
--
-- orders.payment_channel is read/written only from
-- setOrderPaymentChannel() in src/app/dashboard/admin/actions.ts.
-- ============================================================

alter table public.orders
  add column if not exists payment_channel text not null default 'stripe'
    check (payment_channel in ('stripe', 'durqo_platform', 'bangladesh_gateway'));
