-- ============================================================
-- Durqo — mutual buyer/seller reviews after a sale completes.
--
-- Site owner (Sep 24, 2026): after a sale completes, let the seller
-- review the buyer and the buyer review the seller. Explicitly scoped
-- down from the fuller idea discussed first (which also proposed a
-- public buyer profile page) — "buyer er boro feature ekhon dorkar
-- nei": the buyer side of this stays functional but low-key. A buyer's
-- review of their seller feeds a public rating shown on that seller's
-- listings (mirrors the existing Seller panel stats — see
-- seller-stats-panel-addendum.md); a seller's review of their buyer is
-- stored the same way but only ever surfaces privately, to the two
-- order participants and to admins — no public buyer profile, no
-- aggregate buyer badge, nothing new to build there.
--
-- Design choices, matching the idea as discussed with the owner:
--   - Double-blind release: each side's review of the other stays
--     hidden from the other party until BOTH have submitted one for
--     that order, or 14 days have passed since the order completed —
--     whichever comes first. Without this, whoever reviews second
--     could read the first review and retaliate/inflate; eBay/Upwork
--     use the same mechanic for the same reason.
--   - One review per order per direction (unique constraint), never
--     editable after submission — matches this codebase's existing
--     "immutable audit trail" pattern (asset_transfer_events,
--     order_verifications) rather than a live-editable record.
--   - Only reachable once orders.status = 'completed' (payment
--     actually released, not just in_escrow — see the seller-stats
--     lifetime-sales fix from Sep 8 for why that distinction matters
--     here too).
--   - All writes go through a single SECURITY DEFINER RPC
--     (submit_order_review below) rather than a permissive client
--     INSERT policy — same "zero permissive client-write policy"
--     choice order_verifications made (053), so every validation rule
--     (order really completed, reviewer really a party to it, rating
--     in range, no double-submit) lives in one place instead of being
--     re-implemented in RLS.
-- ============================================================

-- ---- 1. orders.completed_at ---------------------------------------
-- Needed for the 14-day blind-reveal fallback below. `orders` has never
-- recorded *when* a sale actually completed, only `created_at` (when it
-- was first requested). The only place `status` is ever set to
-- 'completed' is the transfer-approval RPC (039, superseded by 043) —
-- a BEFORE UPDATE trigger here catches that transition regardless of
-- which version of that RPC (or any future one) performs it.
alter table public.orders
  add column if not exists completed_at timestamptz;

create or replace function public.set_order_completed_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if new.status = 'completed' and (old.status is distinct from 'completed') and new.completed_at is null then
    new.completed_at := now();
  end if;
  return new;
end;
$$;

drop trigger if exists orders_set_completed_at_trg on public.orders;
create trigger orders_set_completed_at_trg
  before update on public.orders
  for each row
  execute function public.set_order_completed_at();

-- Backfill for orders that completed before this migration existed.
-- The exact completion moment was never recorded anywhere upstream, so
-- created_at is used as a reasonable stand-in — it only ever feeds the
-- 14-day blind-reveal fallback below, nothing else reads it.
update public.orders
  set completed_at = created_at
  where status = 'completed' and completed_at is null;

-- ---- 2. order_reviews -----------------------------------------------
create table if not exists public.order_reviews (
  id uuid primary key default uuid_generate_v4(),
  order_id uuid not null references public.orders(id) on delete cascade,
  reviewer_id uuid not null references public.profiles(id),
  reviewee_id uuid not null references public.profiles(id),
  -- The reviewer's role *in this order* — not a general account role —
  -- so the aggregate query below can select "reviews written by a
  -- buyer about their seller" without re-deriving it from `orders`.
  reviewer_role text not null check (reviewer_role in ('buyer', 'seller')),
  rating smallint not null check (rating between 1 and 5),
  comment text,
  -- Admin moderation (takedown of an abusive/fake review), set only via
  -- the service-role client — no client-facing update path exists for
  -- this column at all, deliberately: there's no admin UI for it yet,
  -- this just leaves room for one without another migration.
  hidden_at timestamptz,
  hidden_reason text,
  created_at timestamptz not null default now(),
  unique (order_id, reviewer_id)
);

create index if not exists order_reviews_reviewee_idx on public.order_reviews(reviewee_id);
create index if not exists order_reviews_order_idx on public.order_reviews(order_id);

alter table public.order_reviews enable row level security;

-- Read policy implements the double-blind reveal: you can always read
-- your own submitted review; you can read a review written *about* you
-- once the other side has also reviewed this order, or 14 days have
-- passed since it completed — whichever comes first. No public/anon
-- select policy — the public seller rating badge is computed through
-- get_seller_review_stats() below (SECURITY DEFINER), never by reading
-- this table directly, so raw comments/identities are never exposed to
-- a marketplace visitor.
drop policy if exists "order_reviews_select_participant" on public.order_reviews;
create policy "order_reviews_select_participant" on public.order_reviews for select
  using (
    reviewer_id = auth.uid()
    or (
      reviewee_id = auth.uid()
      and (
        exists (
          select 1 from public.order_reviews r2
          where r2.order_id = order_reviews.order_id and r2.reviewer_id = order_reviews.reviewee_id
        )
        or exists (
          select 1 from public.orders o
          where o.id = order_reviews.order_id
            and o.completed_at is not null
            and o.completed_at < now() - interval '14 days'
        )
      )
    )
  );

-- ---- 3. submit_order_review — the only way to write a review --------
create or replace function public.submit_order_review(
  p_order_id uuid,
  p_rating smallint,
  p_comment text default null
) returns public.order_reviews
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_order public.orders;
  v_role text;
  v_reviewee uuid;
  v_row public.order_reviews;
begin
  if v_uid is null then
    raise exception 'Not signed in.';
  end if;
  if not public.is_account_active(v_uid) then
    raise exception 'Your account has been blocked. Contact Durqo support for help.';
  end if;
  if p_rating is null or p_rating < 1 or p_rating > 5 then
    raise exception 'Rating must be between 1 and 5.';
  end if;

  select * into v_order from public.orders where id = p_order_id;
  if v_order.id is null then
    raise exception 'Order not found.';
  end if;
  if v_order.status <> 'completed' then
    raise exception 'This order isn''t complete yet.';
  end if;

  if v_order.buyer_id = v_uid then
    v_role := 'buyer';
    v_reviewee := v_order.seller_id;
  elsif v_order.seller_id = v_uid then
    v_role := 'seller';
    v_reviewee := v_order.buyer_id;
  else
    raise exception 'You are not part of this order.';
  end if;

  begin
    insert into public.order_reviews (order_id, reviewer_id, reviewee_id, reviewer_role, rating, comment)
    values (p_order_id, v_uid, v_reviewee, v_role, p_rating, nullif(trim(coalesce(p_comment, '')), ''))
    returning * into v_row;
  exception when unique_violation then
    raise exception 'You already reviewed this order.';
  end;

  return v_row;
end;
$$;

grant execute on function public.submit_order_review(uuid, smallint, text) to authenticated;

-- ---- 4. get_seller_review_stats — the only public read path ---------
-- Returns exactly one row (review_count = 0, avg_rating = null when the
-- seller has no revealed reviews yet) — same "aggregate only, never a
-- raw row" pattern the seller-stats panel already uses for lifetime
-- sales/active listings via the admin client. Marked SECURITY DEFINER
-- and granted to anon/authenticated so it also works if a future public
-- page ever calls it directly instead of through the service-role
-- client, but today it's called from hydrateListingRow() via the
-- service-role admin client, same as every other seller stat.
create or replace function public.get_seller_review_stats(p_seller_id uuid)
returns table(review_count int, avg_rating numeric)
language sql
security definer
set search_path = public
stable
as $$
  select count(*)::int, round(avg(rating)::numeric, 2)
  from public.order_reviews r
  where r.reviewee_id = p_seller_id
    and r.reviewer_role = 'buyer'
    and r.hidden_at is null
    and (
      exists (
        select 1 from public.order_reviews r2
        where r2.order_id = r.order_id and r2.reviewer_role = 'seller'
      )
      or exists (
        select 1 from public.orders o
        where o.id = r.order_id
          and o.completed_at is not null
          and o.completed_at < now() - interval '14 days'
      )
    );
$$;

grant execute on function public.get_seller_review_stats(uuid) to anon, authenticated;
