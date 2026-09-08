-- ============================================================================
-- 0003_storage_and_realtime.sql
-- Supabase Storage bucket for product photos, and Realtime publication.
--
-- Realtime + RLS: Supabase Realtime authorizes each change event against the
-- subscriber's RLS policies before delivering it. Because `products` already
-- has a "public reads non-hidden products" policy, an anonymous storefront
-- client will never receive a postgres_changes event for a HIDDEN product,
-- and will see a product "disappear" the moment it is hidden/sold/deleted —
-- with no extra filtering logic needed on the client.
-- ============================================================================

insert into storage.buckets (id, name, public)
values ('product-images', 'product-images', true)
on conflict (id) do nothing;

create policy "public reads product images bucket" on storage.objects
  for select using (bucket_id = 'product-images');

create policy "admins upload product images" on storage.objects
  for insert with check (bucket_id = 'product-images' and public.is_admin());

create policy "admins update product images bucket" on storage.objects
  for update using (bucket_id = 'product-images' and public.is_admin());

create policy "admins delete product images bucket" on storage.objects
  for delete using (bucket_id = 'product-images' and public.is_admin());

-- ----------------------------------------------------------------------------
-- Add tables to the realtime publication so clients can subscribe to
-- INSERT/UPDATE/DELETE via supabase-js `.channel().on('postgres_changes', ...)`.
-- ----------------------------------------------------------------------------

alter publication supabase_realtime add table public.products;
alter publication supabase_realtime add table public.product_images;
alter publication supabase_realtime add table public.orders;

-- Full row data (including the old row) on UPDATE/DELETE is required for the
-- storefront to know which product just became unavailable.
alter table public.products replica identity full;
alter table public.product_images replica identity full;
alter table public.orders replica identity full;
