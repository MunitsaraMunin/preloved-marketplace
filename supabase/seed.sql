-- ============================================================================
-- seed.sql
-- Sample categories and demo products so the storefront isn't empty on
-- first run. Safe to re-run (uses on-conflict / deterministic slugs).
--
-- Run with:
--   supabase db execute -f supabase/seed.sql
-- or paste into the Supabase SQL editor.
--
-- NOTE: this seed does NOT create the admin user or the seller row — that
-- must happen after you sign up an admin via Supabase Auth. See the README
-- "Local development" section for the two-step process:
--   1. Sign up a user (Supabase Studio -> Authentication, or the app's own
--      admin login screen against a pre-created user).
--   2. Run the bootstrap block at the bottom of this file with that user's
--      email to promote them to admin and create the seller row.
-- ============================================================================

-- Kept intentionally broad — 5 categories, not 10 — so first-time shoppers
-- aren't faced with a long category list before reaching the product grid.
insert into public.categories (name, slug, sort_order) values
  ('Tops', 'tops', 1),
  ('Pants', 'pants', 2),
  ('Skirts', 'skirts', 3),
  ('Dresses', 'dresses', 4),
  ('Other', 'other', 5)
on conflict (slug) do nothing;

-- ----------------------------------------------------------------------------
-- Bootstrap: promote an existing auth user to admin and create their seller
-- profile. Replace the email below, then run this block once.
-- ----------------------------------------------------------------------------

do $$
declare
  v_profile_id uuid;
  v_seller_id uuid;
  v_admin_email text := 'airier.rebirth_0b@icloud.com'; -- <-- change me
begin
  select id into v_profile_id from auth.users where email = v_admin_email;

  if v_profile_id is null then
    raise notice 'No auth user found for %, skipping admin bootstrap. Sign up that user first.', v_admin_email;
    return;
  end if;

  update public.profiles set role = 'admin' where id = v_profile_id;

  insert into public.sellers (profile_id, store_name, slug, bio)
  values (v_profile_id, 'Preloved', 'preloved', 'Curated secondhand clothing, selected one piece at a time.')
  on conflict (slug) do nothing
  returning id into v_seller_id;

  if v_seller_id is null then
    select id into v_seller_id from public.sellers where slug = 'preloved';
  end if;

  -- --------------------------------------------------------------------------
  -- Demo products. Images use Unsplash "source" placeholders tagged as demo
  -- content per the project brief — swap for real product photography.
  -- --------------------------------------------------------------------------

  insert into public.products (
    seller_id, category_id, name, slug, description, brand, price, original_price,
    size, condition, color, material, measurements, sku, tags, status
  )
  select
    v_seller_id,
    (select id from public.categories where slug = 'tops'),
    'Vintage Nike Windbreaker',
    'vintage-nike-windbreaker',
    'A relaxed-fit 90s windbreaker in great shape. Full front zip, elastic cuffs, and the classic swoosh embroidered on the chest. Perfect layered over a tee for that thrown-together-but-not look.',
    'Nike',
    790.00,
    1500.00,
    'M',
    'good',
    'Navy / White',
    'Nylon shell',
    '{"shoulder": 46, "chest": 54, "length": 66, "sleeve": 58}'::jsonb,
    'PL-0001',
    array['vintage', 'nike', 'windbreaker', 'streetwear'],
    'available'
  where not exists (select 1 from public.products where slug = 'vintage-nike-windbreaker');

  insert into public.products (
    seller_id, category_id, name, slug, description, brand, price, original_price,
    size, condition, color, material, measurements, sku, tags, status
  )
  select
    v_seller_id,
    (select id from public.categories where slug = 'pants'),
    'Levi''s 501 Jeans',
    'levis-501-jeans',
    'Classic straight-leg 501s with a broken-in fade at the knees and thighs. Button fly, five-pocket styling, no rips or repairs.',
    'Levi''s',
    1290.00,
    null,
    '32',
    'excellent',
    'Mid Blue Wash',
    '100% cotton denim',
    '{"waist": 82, "rise": 28, "inseam": 76, "legOpening": 18}'::jsonb,
    'PL-0002',
    array['denim', 'levis', '501', 'classic'],
    'available'
  where not exists (select 1 from public.products where slug = 'levis-501-jeans');

  insert into public.products (
    seller_id, category_id, name, slug, description, brand, price, original_price,
    size, condition, color, material, measurements, sku, tags, status
  )
  select
    v_seller_id,
    (select id from public.categories where slug = 'tops'),
    'Oversized Graphic Tee',
    'oversized-graphic-tee',
    'Heavyweight cotton tee with a faded front graphic. Boxy oversized cut, dropped shoulders. One small mark near the hem, priced accordingly.',
    null,
    350.00,
    null,
    'L',
    'fair',
    'Washed Black',
    '100% cotton',
    '{"shoulder": 58, "chest": 60, "length": 72}'::jsonb,
    'PL-0003',
    array['graphic-tee', 'oversized', 'streetwear'],
    'available'
  where not exists (select 1 from public.products where slug = 'oversized-graphic-tee');

  insert into public.products (
    seller_id, category_id, name, slug, description, brand, price, original_price,
    size, condition, color, material, measurements, sku, tags, status
  )
  select
    v_seller_id,
    (select id from public.categories where slug = 'tops'),
    'Vintage Denim Jacket',
    'vintage-denim-jacket',
    'Classic vintage denim jacket with a relaxed oversized fit. Naturally faded whiskering at the seams, sturdy button closures, and a timeless silhouette that layers over anything.',
    null,
    1290.00,
    2200.00,
    'M',
    'good',
    'Light Wash Blue',
    '100% cotton denim',
    '{"shoulder": 48, "chest": 56, "length": 68, "sleeve": 60}'::jsonb,
    'PL-0004',
    array['denim', 'jacket', 'vintage'],
    'available'
  where not exists (select 1 from public.products where slug = 'vintage-denim-jacket');

  insert into public.products (
    seller_id, category_id, name, slug, description, brand, price, original_price,
    size, condition, color, material, measurements, sku, tags, status
  )
  select
    v_seller_id,
    (select id from public.categories where slug = 'skirts'),
    'Pleated Mini Skirt',
    'pleated-mini-skirt',
    'Y2K-style pleated mini skirt with a high waist and side zip closure. Crisp pleats hold their shape well.',
    null,
    450.00,
    null,
    'S',
    'like_new',
    'Black',
    'Polyester blend',
    '{"waist": 68, "hip": 90, "length": 38}'::jsonb,
    'PL-0005',
    array['y2k', 'mini-skirt', 'pleated'],
    'available'
  where not exists (select 1 from public.products where slug = 'pleated-mini-skirt');

  insert into public.products (
    seller_id, category_id, name, slug, description, brand, price, original_price,
    size, condition, color, material, measurements, sku, tags, status, sold_at
  )
  select
    v_seller_id,
    (select id from public.categories where slug = 'other'),
    'Y2K Shoulder Bag',
    'y2k-shoulder-bag',
    'Compact structured shoulder bag with silver-tone hardware. Interior is clean, exterior has light wear consistent with age.',
    null,
    690.00,
    null,
    'One Size',
    'good',
    'Silver',
    'Faux leather',
    '{"width": 24, "height": 16, "depth": 8, "strapDrop": 22}'::jsonb,
    'PL-0006',
    array['y2k', 'bag', 'accessory'],
    'sold',
    now() - interval '3 days'
  where not exists (select 1 from public.products where slug = 'y2k-shoulder-bag');

  -- --------------------------------------------------------------------------
  -- Placeholder demo images (picsum.photos, seeded by product slug so they're
  -- stable across reseeds). Obviously not real product photography — swap
  -- these for real uploads via /admin/products/[id]/edit.
  -- --------------------------------------------------------------------------

  insert into public.product_images (product_id, image_url, storage_path, sort_order, is_primary)
  select p.id, 'https://picsum.photos/seed/' || p.slug || '/1000/1250', 'demo/' || p.slug || '.jpg', 0, true
  from public.products p
  where p.seller_id = v_seller_id
    and not exists (select 1 from public.product_images pi where pi.product_id = p.id);

  raise notice 'Seed complete for seller %', v_seller_id;
end $$;
