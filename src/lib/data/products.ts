import "server-only";
import { createClient } from "@/lib/supabase/server";
import { PRODUCT_WITH_RELATIONS_SELECT, sortProductImages } from "@/lib/supabase/queries";
import type { Product, ProductCondition, ProductFilters } from "@/types";

const PRODUCT_SELECT = PRODUCT_WITH_RELATIONS_SELECT;
const sortImages = sortProductImages<Product>;

/**
 * Fetches products for the public storefront (/shop), applying search,
 * filters and sort. Only ever returns AVAILABLE products — HIDDEN, SOLD and
 * RESERVED items never enter the grid, per the "only AVAILABLE products are
 * listed" requirement. This is enforced here AND by RLS, so even a bug in
 * this query cannot leak a hidden product.
 */
export async function getStorefrontProducts(filters: ProductFilters = {}) {
  const supabase = await createClient();

  let query = supabase
    .from("products")
    .select(PRODUCT_SELECT)
    .eq("status", "available");

  if (filters.search) {
    query = query.textSearch("search_vector", filters.search, {
      type: "websearch",
      config: "simple",
    });
  }

  if (filters.categorySlug) {
    const { data: category } = await supabase
      .from("categories")
      .select("id")
      .eq("slug", filters.categorySlug)
      .maybeSingle();
    if (category) query = query.eq("category_id", category.id);
  }

  if (filters.sizes?.length) query = query.in("size", filters.sizes);
  if (filters.conditions?.length)
    query = query.in("condition", filters.conditions as ProductCondition[]);
  if (filters.brands?.length) query = query.in("brand", filters.brands);
  if (filters.colors?.length) query = query.in("color", filters.colors);
  if (filters.minPrice !== undefined) query = query.gte("price", filters.minPrice);
  if (filters.maxPrice !== undefined) query = query.lte("price", filters.maxPrice);

  switch (filters.sort) {
    case "price_asc":
      query = query.order("price", { ascending: true });
      break;
    case "price_desc":
      query = query.order("price", { ascending: false });
      break;
    default:
      query = query.order("created_at", { ascending: false });
  }

  const { data, error } = await query;
  if (error) throw error;
  return (data as Product[]).map(sortImages);
}

/**
 * Fetches a single product for the detail page regardless of status (except
 * HIDDEN, which RLS blocks for non-admins) so a SOLD item still renders with
 * a "this item has been sold" state instead of a broken page.
 */
export async function getProductById(id: string): Promise<Product | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("products")
    .select(PRODUCT_SELECT)
    .eq("id", id)
    .maybeSingle();

  if (error) throw error;
  if (!data) return null;
  return sortImages(data as Product);
}

export async function getRelatedProducts(product: Product, limit = 4) {
  const supabase = await createClient();
  let query = supabase
    .from("products")
    .select(PRODUCT_SELECT)
    .eq("status", "available")
    .neq("id", product.id)
    .limit(limit);

  if (product.category_id) {
    query = query.eq("category_id", product.category_id);
  }

  const { data, error } = await query;
  if (error) throw error;
  return (data as Product[]).map(sortImages);
}

/** Distinct filter facets (brands/colors) derived from currently available products. */
export async function getAvailableFacets() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("products")
    .select("brand, color")
    .eq("status", "available");

  if (error) throw error;

  const brands = new Set<string>();
  const colors = new Set<string>();
  for (const row of data) {
    if (row.brand) brands.add(row.brand);
    if (row.color) colors.add(row.color);
  }

  return {
    brands: [...brands].sort(),
    colors: [...colors].sort(),
  };
}

// ---------------------------------------------------------------------------
// Admin queries — RLS allows admins to read every status, including HIDDEN.
// ---------------------------------------------------------------------------

export async function getAdminProducts() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("products")
    .select(PRODUCT_SELECT)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return (data as Product[]).map(sortImages);
}

export async function getAdminProductById(id: string): Promise<Product | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("products")
    .select(PRODUCT_SELECT)
    .eq("id", id)
    .maybeSingle();

  if (error) throw error;
  if (!data) return null;
  return sortImages(data as Product);
}

export async function getDashboardStats() {
  const supabase = await createClient();
  const { data, error } = await supabase.from("products").select("status");
  if (error) throw error;

  const stats = { total: data.length, available: 0, reserved: 0, sold: 0, hidden: 0 };
  for (const row of data) {
    stats[row.status as keyof typeof stats]++;
  }
  return stats;
}
