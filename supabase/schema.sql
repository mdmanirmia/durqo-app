-- ============================================================
-- Durqo Marketplace — Core Schema (Phase 1)
-- Run this in the Supabase SQL editor after project creation.
-- ============================================================

create extension if not exists "uuid-ossp";

-- ---------- PROFILES ----------
-- Extends Supabase auth.users with marketplace-specific fields.
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  avatar_url text,
  role text not null default 'buyer' check (role in ('buyer','seller','admin')),
  bio text,
  location text,
  is_verified boolean not null default false,
  verification_method text check (verification_method in ('passport','national_id','driving_license')),
  verification_status text not null default 'unverified' check (verification_status in ('unverified','pending','verified','rejected')),
  total_purchases int not null default 0,
  total_sales int not null default 0,
  created_at timestamptz not null default now()
);

-- ---------- CATEGORIES ----------
create table if not exists public.categories (
  id text primary key,           -- slug, e.g. 'websites'
  name text not null,
  description text,
  sort_order int not null default 0
);

-- ---------- MONETIZATION TYPES ----------
create table if not exists public.monetization_types (
  id text primary key,           -- slug, e.g. 'adsense'
  name text not null
);

-- ---------- LISTINGS ----------
create table if not exists public.listings (
  id uuid primary key default uuid_generate_v4(),
  seller_id uuid not null references public.profiles(id) on delete cascade,
  category_id text not null references public.categories(id),
  title text not null,
  business_url text,
  location text,
  price numeric(12,2) not null,
  discounted_price numeric(12,2),
  business_age_years numeric(4,1),
  overview text,
  monthly_expenses jsonb default '[]',      -- [{label, amount}]
  monetization_type_ids text[] default '{}',
  sale_includes_assets text,
  sale_includes_support text,

  -- Quick-stat fields (category dependent — nullable, UI shows only what's relevant)
  monthly_income numeric(12,2),
  monthly_visitors int,
  domain_authority int,
  articles_posted int,
  income_multiple numeric(5,2),
  subscribers int,
  open_rate numeric(5,2),
  click_through_rate numeric(5,2),
  unsubscribe_rate numeric(5,2),
  channel_age_years numeric(4,1),
  total_videos int,
  total_downloads int,
  total_reviews int,
  rating numeric(3,2),
  active_clients int,
  domain_expires date,
  domain_registrar text,

  status text not null default 'draft' check (status in ('draft','pending_review','published','sold','archived')),
  is_verified boolean not null default false,
  views int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists listings_category_idx on public.listings(category_id);
create index if not exists listings_status_idx on public.listings(status);
create index if not exists listings_seller_idx on public.listings(seller_id);

-- ---------- LISTING IMAGES ----------
create table if not exists public.listing_images (
  id uuid primary key default uuid_generate_v4(),
  listing_id uuid not null references public.listings(id) on delete cascade,
  url text not null,
  kind text not null default 'gallery' check (kind in ('cover','gallery','proof_of_income','google_analytics','search_console','semrush','ahrefs')),
  sort_order int not null default 0
);

-- ---------- MONTHLY PERFORMANCE (income / GA users / GA pageviews time series) ----------
create table if not exists public.listing_monthly_stats (
  id uuid primary key default uuid_generate_v4(),
  listing_id uuid not null references public.listings(id) on delete cascade,
  month date not null,                      -- first-of-month
  income numeric(12,2),
  ga_total_users int,
  ga_page_views int,
  unique (listing_id, month)
);

-- ---------- GA / GSC / SEMRUSH / AHREFS SNAPSHOT DATA ----------
create table if not exists public.listing_seo_data (
  listing_id uuid primary key references public.listings(id) on delete cascade,
  -- Google Analytics engagement
  ga_total_users int,
  ga_new_users int,
  ga_total_page_views int,
  ga_avg_engagement_seconds int,
  ga_engagement_rate numeric(5,2),
  ga_top_channels jsonb default '[]',        -- [{name, users}]
  ga_top_countries jsonb default '[]',
  ga_top_devices jsonb default '[]',
  -- Google Search Console
  gsc_total_clicks int,
  gsc_total_impressions int,
  gsc_indexed_pages int,
  gsc_non_indexed_pages int,
  gsc_avg_ctr numeric(5,2),
  -- SEMrush
  semrush_authority_score int,
  semrush_total_traffic int,
  semrush_total_keywords int,
  semrush_top10_keywords int,
  semrush_total_backlinks int,
  -- Ahrefs
  ahrefs_dr numeric(5,2),
  ahrefs_ur numeric(5,2),
  ahrefs_referring_domains int,
  ahrefs_total_keywords int,
  ahrefs_total_backlinks int
);

-- ---------- SOCIAL MEDIA STATS ----------
create table if not exists public.listing_social_stats (
  id uuid primary key default uuid_generate_v4(),
  listing_id uuid not null references public.listings(id) on delete cascade,
  platform text not null,      -- 'instagram','youtube','tiktok','x','email'
  followers int
);

-- ---------- WISHLIST ----------
create table if not exists public.wishlists (
  user_id uuid not null references public.profiles(id) on delete cascade,
  listing_id uuid not null references public.listings(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, listing_id)
);

-- ---------- CART ----------
create table if not exists public.cart_items (
  user_id uuid not null references public.profiles(id) on delete cascade,
  listing_id uuid not null references public.listings(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, listing_id)
);

-- ---------- ORDERS ----------
create table if not exists public.orders (
  id uuid primary key default uuid_generate_v4(),
  listing_id uuid not null references public.listings(id),
  buyer_id uuid not null references public.profiles(id),
  seller_id uuid not null references public.profiles(id),
  amount numeric(12,2) not null,
  status text not null default 'requested' check (status in ('requested','awaiting_payment','in_escrow','completed','cancelled')),
  created_at timestamptz not null default now()
);

-- ---------- MESSAGES (buyer <-> seller chat) ----------
create table if not exists public.messages (
  id uuid primary key default uuid_generate_v4(),
  listing_id uuid references public.listings(id) on delete cascade,
  sender_id uuid not null references public.profiles(id),
  recipient_id uuid not null references public.profiles(id),
  body text not null,
  read_at timestamptz,
  created_at timestamptz not null default now()
);

-- ---------- COMMENTS (public, Flippa-style, on a listing) ----------
create table if not exists public.comments (
  id uuid primary key default uuid_generate_v4(),
  listing_id uuid not null references public.listings(id) on delete cascade,
  author_id uuid not null references public.profiles(id),
  parent_id uuid references public.comments(id) on delete cascade,
  body text not null,
  created_at timestamptz not null default now()
);

-- ---------- FAQ (seller-authored, per listing) ----------
create table if not exists public.listing_faqs (
  id uuid primary key default uuid_generate_v4(),
  listing_id uuid not null references public.listings(id) on delete cascade,
  question text not null,
  answer text,
  sort_order int not null default 0
);

-- ============================================================
-- Row Level Security
-- ============================================================
alter table public.profiles enable row level security;
alter table public.listings enable row level security;
alter table public.listing_images enable row level security;
alter table public.listing_monthly_stats enable row level security;
alter table public.listing_seo_data enable row level security;
alter table public.listing_social_stats enable row level security;
alter table public.wishlists enable row level security;
alter table public.cart_items enable row level security;
alter table public.orders enable row level security;
alter table public.messages enable row level security;
alter table public.comments enable row level security;
alter table public.listing_faqs enable row level security;

-- Profiles: readable by everyone, editable only by owner
create policy "profiles_select_all" on public.profiles for select using (true);
create policy "profiles_update_own" on public.profiles for update using (auth.uid() = id);
create policy "profiles_insert_own" on public.profiles for insert with check (auth.uid() = id);

-- Listings: published listings readable by everyone; sellers manage their own
create policy "listings_select_published" on public.listings for select
  using (status = 'published' or seller_id = auth.uid());
create policy "listings_insert_own" on public.listings for insert with check (seller_id = auth.uid());
create policy "listings_update_own" on public.listings for update using (seller_id = auth.uid());
create policy "listings_delete_own" on public.listings for delete using (seller_id = auth.uid());

-- Related listing detail tables: readable with the parent listing, writable by the owning seller
create policy "listing_images_select" on public.listing_images for select using (true);
create policy "listing_images_write" on public.listing_images for all using (
  exists (select 1 from public.listings l where l.id = listing_id and l.seller_id = auth.uid())
);

create policy "listing_monthly_stats_select" on public.listing_monthly_stats for select using (true);
create policy "listing_monthly_stats_write" on public.listing_monthly_stats for all using (
  exists (select 1 from public.listings l where l.id = listing_id and l.seller_id = auth.uid())
);

create policy "listing_seo_data_select" on public.listing_seo_data for select using (true);
create policy "listing_seo_data_write" on public.listing_seo_data for all using (
  exists (select 1 from public.listings l where l.id = listing_id and l.seller_id = auth.uid())
);

create policy "listing_social_stats_select" on public.listing_social_stats for select using (true);
create policy "listing_social_stats_write" on public.listing_social_stats for all using (
  exists (select 1 from public.listings l where l.id = listing_id and l.seller_id = auth.uid())
);

create policy "listing_faqs_select" on public.listing_faqs for select using (true);
create policy "listing_faqs_write" on public.listing_faqs for all using (
  exists (select 1 from public.listings l where l.id = listing_id and l.seller_id = auth.uid())
);

-- Wishlist / cart: private to the owning user
create policy "wishlists_own" on public.wishlists for all using (auth.uid() = user_id);
create policy "cart_items_own" on public.cart_items for all using (auth.uid() = user_id);

-- Orders: visible to buyer or seller involved
create policy "orders_select_involved" on public.orders for select
  using (auth.uid() = buyer_id or auth.uid() = seller_id);
create policy "orders_insert_buyer" on public.orders for insert with check (auth.uid() = buyer_id);
create policy "orders_update_involved" on public.orders for update
  using (auth.uid() = buyer_id or auth.uid() = seller_id);

-- Messages: visible to sender or recipient
create policy "messages_select_involved" on public.messages for select
  using (auth.uid() = sender_id or auth.uid() = recipient_id);
create policy "messages_insert_sender" on public.messages for insert with check (auth.uid() = sender_id);

-- Comments: readable by everyone, writable by logged-in authors, editable by author
create policy "comments_select_all" on public.comments for select using (true);
create policy "comments_insert_own" on public.comments for insert with check (auth.uid() = author_id);
create policy "comments_update_own" on public.comments for update using (auth.uid() = author_id);
create policy "comments_delete_own" on public.comments for delete using (auth.uid() = author_id);

-- Categories / monetization types: public reference data
alter table public.categories enable row level security;
alter table public.monetization_types enable row level security;
create policy "categories_select_all" on public.categories for select using (true);
create policy "monetization_types_select_all" on public.monetization_types for select using (true);

-- ============================================================
-- Auto-create a profile row when a new auth user signs up
-- ============================================================
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, coalesce(new.raw_user_meta_data->>'full_name', new.email));
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
