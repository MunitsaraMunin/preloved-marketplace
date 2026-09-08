-- ============================================================================
-- 0004_simplify_categories.sql
-- Consolidates the original 10-category taxonomy down to 5 broad, easy-to-
-- scan categories — Tops, Pants, Skirts, Dresses, Other — so first-time
-- shoppers aren't faced with a long, fussy category list before they've even
-- reached the product grid.
-- ============================================================================

-- 1. Repurpose the categories we keep as merge targets, and set the display
--    order for the final 5.
update public.categories set name = 'Tops', slug = 'tops', sort_order = 1
  where slug = 't-shirts';
update public.categories set sort_order = 2 where slug = 'pants';
update public.categories set sort_order = 3 where slug = 'skirts';
update public.categories set sort_order = 4 where slug = 'dresses';
update public.categories set name = 'Other', sort_order = 5 where slug = 'other';

-- 2. Reassign products out of the categories about to be removed, onto their
--    merge target, so existing product data doesn't lose its category.
update public.products set category_id = (select id from public.categories where slug = 'tops')
  where category_id in (select id from public.categories where slug in ('shirts', 'jackets'));

update public.products set category_id = (select id from public.categories where slug = 'pants')
  where category_id in (select id from public.categories where slug = 'jeans');

update public.products set category_id = (select id from public.categories where slug = 'other')
  where category_id in (select id from public.categories where slug in ('bags', 'accessories'));

-- 3. Drop the now-empty source categories.
delete from public.categories where slug in ('shirts', 'jackets', 'jeans', 'bags', 'accessories');
