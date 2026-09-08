-- ============================================================================
-- 0001_init_schema.sql
-- Core schema for the Preloved Marketplace.
--
-- Design notes for future multi-seller evolution (see README "Future
-- Architecture"): products already belong to a `sellers` row instead of a
-- hardcoded admin id, and `profiles` already carries a `role` column. In V1
-- there is exactly one seller (the site owner), but the shape of the schema
-- does not need to change when V2 introduces seller signup.
-- ============================================================================

create extension if not exists "pgcrypto";
create extension if not exists "pg_trgm";

-- ----------------------------------------------------------------------------
-- Enums
-- ----------------------------------------------------------------------------

create type public.user_role as enum ('admin', 'customer');
create type public.product_status as enum ('available', 'reserved', 'sold', 'hidden');
create type public.product_condition as enum ('new_with_tags', 'like_new', 'excellent', 'good', 'fair');
create type public.order_status as enum ('pending', 'confirmed', 'completed', 'cancelled');
create type public.contact_method as enum ('phone', 'line', 'instagram', 'email', 'other');

-- ----------------------------------------------------------------------------
-- profiles: one row per auth.users row. Only admins sign in during V1;
-- customers remain anonymous. This table is what lets V2 add customer
-- accounts (favorites, order history) without a schema migration.
-- ----------------------------------------------------------------------------

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text,
  role public.user_role not null default 'customer',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.profiles is 'Extends auth.users. role=admin grants access to /admin.';

-- ----------------------------------------------------------------------------
-- sellers: exactly one row in V1 (the site owner). Products reference a
-- seller instead of a user directly so V3 (multi-seller marketplace) can
-- add seller signup, storefronts and commissions by adding rows here and to
-- new tables, without touching the products/orders schema.
-- ----------------------------------------------------------------------------

create table public.sellers (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles (id) on delete cascade,
  store_name text not null,
  slug text not null unique,
  bio text,
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index sellers_profile_id_idx on public.sellers (profile_id);

-- ----------------------------------------------------------------------------
-- categories
-- ----------------------------------------------------------------------------

create table public.categories (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  slug text not null unique,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

-- ----------------------------------------------------------------------------
-- products
-- ----------------------------------------------------------------------------

create table public.products (
  id uuid primary key default gen_random_uuid(),
  seller_id uuid not null references public.sellers (id) on delete cascade,
  category_id uuid references public.categories (id) on delete set null,
  name text not null,
  slug text not null unique,
  description text not null default '',
  brand text,
  price numeric(10, 2) not null check (price >= 0),
  original_price numeric(10, 2) check (original_price is null or original_price >= 0),
  size text not null,
  condition public.product_condition not null,
  color text,
  material text,
  measurements jsonb not null default '{}'::jsonb,
  sku text,
  tags text[] not null default '{}'::text[],
  status public.product_status not null default 'available',
  -- Each garment is unique; quantity only ever meaningfully takes 0 or 1.
  quantity integer not null default 1 check (quantity in (0, 1)),
  search_vector tsvector generated always as (
    setweight(to_tsvector('simple', coalesce(name, '')), 'A') ||
    setweight(to_tsvector('simple', coalesce(brand, '')), 'B') ||
    setweight(to_tsvector('simple', coalesce(description, '')), 'C')
  ) stored,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  sold_at timestamptz,
  constraint products_sold_at_consistency check (
    (status = 'sold' and sold_at is not null) or
    (status <> 'sold' and sold_at is null)
  )
);

create index products_status_idx on public.products (status);
create index products_category_id_idx on public.products (category_id);
create index products_seller_id_idx on public.products (seller_id);
create index products_created_at_idx on public.products (created_at desc);
create index products_price_idx on public.products (price);
create index products_search_vector_idx on public.products using gin (search_vector);
create index products_brand_trgm_idx on public.products using gin (brand gin_trgm_ops);

-- ----------------------------------------------------------------------------
-- product_images
-- ----------------------------------------------------------------------------

create table public.product_images (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products (id) on delete cascade,
  image_url text not null,
  storage_path text not null,
  sort_order integer not null default 0,
  is_primary boolean not null default false,
  created_at timestamptz not null default now()
);

create index product_images_product_id_idx on public.product_images (product_id, sort_order);

-- Only one primary image per product.
create unique index product_images_one_primary_per_product
  on public.product_images (product_id)
  where (is_primary);

-- ----------------------------------------------------------------------------
-- orders / order_items
-- Kept intentionally simple for V1: a lightweight "contact to buy" flow
-- rather than a checkout/payment system.
-- ----------------------------------------------------------------------------

create table public.orders (
  id uuid primary key default gen_random_uuid(),
  customer_name text not null,
  contact_method public.contact_method not null,
  contact_value text not null,
  message text,
  status public.order_status not null default 'pending',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index orders_status_idx on public.orders (status);
create index orders_created_at_idx on public.orders (created_at desc);

create table public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders (id) on delete cascade,
  product_id uuid not null references public.products (id) on delete restrict,
  price numeric(10, 2) not null check (price >= 0),
  created_at timestamptz not null default now(),
  -- A given product can only ever be sold once, so it can only appear in one
  -- order line item. This is a second line of defense on top of the
  -- create_order() transaction in 0002_rls_and_functions.sql.
  constraint order_items_product_unique unique (product_id)
);

create index order_items_order_id_idx on public.order_items (order_id);

-- ----------------------------------------------------------------------------
-- updated_at triggers
-- ----------------------------------------------------------------------------

create function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger set_updated_at before update on public.profiles
  for each row execute function public.set_updated_at();

create trigger set_updated_at before update on public.sellers
  for each row execute function public.set_updated_at();

create trigger set_updated_at before update on public.products
  for each row execute function public.set_updated_at();

create trigger set_updated_at before update on public.orders
  for each row execute function public.set_updated_at();

-- ----------------------------------------------------------------------------
-- Auto-create a profile row whenever a new auth user signs up.
-- ----------------------------------------------------------------------------

create function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, new.raw_user_meta_data ->> 'full_name');
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ----------------------------------------------------------------------------
-- Keep sold_at in sync with status transitions automatically, so application
-- code never has to remember to set it.
-- ----------------------------------------------------------------------------

create function public.sync_product_sold_at()
returns trigger
language plpgsql
as $$
begin
  if new.status = 'sold' and old.status <> 'sold' then
    new.sold_at = now();
  elsif new.status <> 'sold' then
    new.sold_at = null;
  end if;
  return new;
end;
$$;

create trigger sync_product_sold_at before update on public.products
  for each row execute function public.sync_product_sold_at();
