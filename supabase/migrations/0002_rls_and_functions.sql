-- ============================================================================
-- 0002_rls_and_functions.sql
-- Row Level Security policies and the transactional order-creation function.
--
-- Golden rule enforced here: the database is the source of truth for product
-- availability, not the frontend. `create_order()` locks the product row,
-- re-checks its status inside the transaction, and only then inserts the
-- order — so two simultaneous "buy" clicks on the same item can never both
-- succeed (see order_items_product_unique in 0001 as a second safety net).
-- ============================================================================

alter table public.profiles enable row level security;
alter table public.sellers enable row level security;
alter table public.categories enable row level security;
alter table public.products enable row level security;
alter table public.product_images enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;

-- ----------------------------------------------------------------------------
-- Helper: is the current session an admin?
-- SECURITY DEFINER + a fixed search_path so it can read `profiles` even
-- though RLS on `profiles` would otherwise block a plain user from reading
-- someone else's row.
-- ----------------------------------------------------------------------------

create function public.is_admin()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  );
$$;

-- ----------------------------------------------------------------------------
-- profiles
-- ----------------------------------------------------------------------------

create policy "profiles are self-readable" on public.profiles
  for select using (auth.uid() = id or public.is_admin());

create policy "profiles are self-updatable" on public.profiles
  for update using (auth.uid() = id);

-- ----------------------------------------------------------------------------
-- sellers — public storefront info (store name, bio) is not sensitive.
-- ----------------------------------------------------------------------------

create policy "sellers are publicly readable" on public.sellers
  for select using (true);

create policy "admins manage sellers" on public.sellers
  for all using (public.is_admin()) with check (public.is_admin());

-- ----------------------------------------------------------------------------
-- categories
-- ----------------------------------------------------------------------------

create policy "categories are publicly readable" on public.categories
  for select using (true);

create policy "admins manage categories" on public.categories
  for all using (public.is_admin()) with check (public.is_admin());

-- ----------------------------------------------------------------------------
-- products
-- Public can read anything except HIDDEN products (SOLD/RESERVED stay
-- readable by direct link so a product detail page can explain the item is
-- no longer available). Only admins can read/write HIDDEN or mutate at all.
-- ----------------------------------------------------------------------------

create policy "public reads non-hidden products" on public.products
  for select using (status <> 'hidden' or public.is_admin());

create policy "admins manage products" on public.products
  for all using (public.is_admin()) with check (public.is_admin());

-- ----------------------------------------------------------------------------
-- product_images — inherit visibility from the parent product.
-- ----------------------------------------------------------------------------

create policy "public reads images of visible products" on public.product_images
  for select using (
    exists (
      select 1 from public.products p
      where p.id = product_images.product_id
        and (p.status <> 'hidden' or public.is_admin())
    )
  );

create policy "admins manage product images" on public.product_images
  for all using (public.is_admin()) with check (public.is_admin());

-- ----------------------------------------------------------------------------
-- orders / order_items
-- Customers never read orders back (no accounts in V1); they can only
-- create one, and only through the create_order() function below, which
-- runs as SECURITY DEFINER. Direct table INSERT is intentionally left
-- closed to anon/authenticated so the atomic function is the only path.
-- ----------------------------------------------------------------------------

create policy "admins read orders" on public.orders
  for select using (public.is_admin());

create policy "admins update orders" on public.orders
  for update using (public.is_admin());

create policy "admins delete orders" on public.orders
  for delete using (public.is_admin());

create policy "admins read order items" on public.order_items
  for select using (public.is_admin());

-- ----------------------------------------------------------------------------
-- create_order: the single, atomic entry point for placing an order.
--
-- 1. Locks the target product row (FOR UPDATE) so concurrent callers queue
--    up rather than racing.
-- 2. Re-checks status = 'available' *after* acquiring the lock.
-- 3. Inserts the order + order_item and flips the product to 'reserved'
--    in the same transaction.
--
-- Runs as SECURITY DEFINER so anonymous customers (who cannot write to
-- `orders`/`order_items`/`products` directly) can still place an order
-- through this single, carefully-scoped path.
-- ----------------------------------------------------------------------------

create function public.create_order(
  p_product_id uuid,
  p_customer_name text,
  p_contact_method public.contact_method,
  p_contact_value text,
  p_message text
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_order_id uuid;
  v_status public.product_status;
  v_price numeric(10, 2);
begin
  if length(trim(p_customer_name)) = 0 then
    raise exception 'customer_name is required' using errcode = '23514';
  end if;
  if length(trim(p_contact_value)) = 0 then
    raise exception 'contact_value is required' using errcode = '23514';
  end if;

  -- Lock the product row so a concurrent create_order() call for the same
  -- product blocks here until this transaction commits or rolls back.
  select status, price into v_status, v_price
  from public.products
  where id = p_product_id
  for update;

  if not found then
    raise exception 'Product not found' using errcode = 'P0002';
  end if;

  if v_status <> 'available' then
    raise exception 'This item is no longer available' using errcode = 'P0001';
  end if;

  insert into public.orders (customer_name, contact_method, contact_value, message)
  values (trim(p_customer_name), p_contact_method, trim(p_contact_value), p_message)
  returning id into v_order_id;

  insert into public.order_items (order_id, product_id, price)
  values (v_order_id, p_product_id, v_price);

  update public.products
  set status = 'reserved'
  where id = p_product_id;

  return v_order_id;
end;
$$;

grant execute on function public.create_order(uuid, text, public.contact_method, text, text)
  to anon, authenticated;
