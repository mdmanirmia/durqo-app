-- Records, per order, what was actually charged online versus what's left
-- to be settled directly between buyer and seller (per each listing's
-- "Payment Terms" section — src/lib/payment-terms.ts), plus the exact BDT
-- amount and USD->BDT rate applied when the order was paid through
-- SSLCommerz. Without this, an order's history only ever showed the full
-- USD sale price, with no durable record of the actual online charge, the
-- conversion rate a Bangladeshi buyer paid, or how much remained to be
-- settled offline — needed on the buyer/seller/admin order views.
alter table public.orders
  add column if not exists online_charge_usd numeric,
  add column if not exists remainder_usd numeric,
  add column if not exists sslcommerz_bdt_amount numeric,
  add column if not exists sslcommerz_rate numeric;
