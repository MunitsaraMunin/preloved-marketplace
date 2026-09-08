"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { productSchema } from "@/lib/validations/product";
import { slugify } from "@/lib/utils";
import type { ProductStatus } from "@/types";

function revalidateProductPaths(id?: string) {
  revalidatePath("/shop");
  revalidatePath("/");
  revalidatePath("/admin");
  revalidatePath("/admin/products");
  if (id) revalidatePath(`/product/${id}`);
}

function parseProductFields(formData: FormData) {
  const tagsRaw = String(formData.get("tags") ?? "");
  const measurementKeys = [
    "shoulder",
    "chest",
    "waist",
    "hip",
    "length",
    "sleeve",
    "inseam",
  ] as const;

  const measurements: Record<string, string> = {};
  for (const key of measurementKeys) {
    const value = formData.get(`measurements.${key}`);
    if (value) measurements[key] = String(value);
  }

  return productSchema.parse({
    name: formData.get("name"),
    description: formData.get("description"),
    price: formData.get("price"),
    originalPrice: formData.get("originalPrice"),
    categoryId: formData.get("categoryId"),
    size: formData.get("size"),
    condition: formData.get("condition"),
    brand: formData.get("brand"),
    color: formData.get("color"),
    material: formData.get("material"),
    sku: formData.get("sku"),
    tags: tagsRaw
      .split(",")
      .map((tag) => tag.trim())
      .filter(Boolean),
    measurements,
  });
}

async function generateUniqueSlug(
  supabase: Awaited<ReturnType<typeof requireAdmin>>["supabase"],
  name: string,
) {
  const base = slugify(name) || "item";
  let candidate = base;
  let suffix = 2;

  while (true) {
    const { data } = await supabase
      .from("products")
      .select("id")
      .eq("slug", candidate)
      .maybeSingle();
    if (!data) return candidate;
    candidate = `${base}-${suffix}`;
    suffix += 1;
  }
}

export async function createProduct(formData: FormData): Promise<{ id: string }> {
  const { supabase, user } = await requireAdmin();

  const { data: seller, error: sellerError } = await supabase
    .from("sellers")
    .select("id")
    .eq("profile_id", user.id)
    .single();
  if (sellerError || !seller) {
    throw new Error(
      "No seller profile found for this account. Run the seed bootstrap script first.",
    );
  }

  const fields = parseProductFields(formData);
  const slug = await generateUniqueSlug(supabase, fields.name);

  const { data: product, error } = await supabase
    .from("products")
    .insert({
      seller_id: seller.id,
      category_id: fields.categoryId,
      name: fields.name,
      slug,
      description: fields.description,
      brand: fields.brand ?? null,
      price: fields.price,
      original_price: fields.originalPrice ?? null,
      size: fields.size,
      condition: fields.condition,
      color: fields.color ?? null,
      material: fields.material ?? null,
      measurements: fields.measurements,
      sku: fields.sku ?? null,
      tags: fields.tags,
    })
    .select("id")
    .single();

  if (error || !product) throw new Error(error?.message ?? "Failed to create product.");

  revalidateProductPaths(product.id);
  return { id: product.id };
}

export async function updateProduct(id: string, formData: FormData): Promise<void> {
  const { supabase } = await requireAdmin();
  const fields = parseProductFields(formData);

  const { error } = await supabase
    .from("products")
    .update({
      category_id: fields.categoryId,
      name: fields.name,
      description: fields.description,
      brand: fields.brand ?? null,
      price: fields.price,
      original_price: fields.originalPrice ?? null,
      size: fields.size,
      condition: fields.condition,
      color: fields.color ?? null,
      material: fields.material ?? null,
      measurements: fields.measurements,
      sku: fields.sku ?? null,
      tags: fields.tags,
    })
    .eq("id", id);

  if (error) throw new Error(error.message);
  revalidateProductPaths(id);
}

export async function changeProductStatus(id: string, status: ProductStatus): Promise<void> {
  const { supabase } = await requireAdmin();
  const { error } = await supabase.from("products").update({ status }).eq("id", id);
  if (error) throw new Error(error.message);
  revalidateProductPaths(id);
}

export async function deleteProduct(id: string): Promise<void> {
  const { supabase } = await requireAdmin();

  const { data: images } = await supabase
    .from("product_images")
    .select("storage_path")
    .eq("product_id", id);

  const { error } = await supabase.from("products").delete().eq("id", id);
  if (error) throw new Error(error.message);

  if (images && images.length > 0) {
    // Storage cleanup runs after the DB row is gone, with the service-role
    // client — see src/lib/supabase/admin.ts for why this is the one place
    // that bypasses RLS instead of the request-scoped client.
    const adminClient = createAdminClient();
    await adminClient.storage
      .from("product-images")
      .remove(images.map((image) => image.storage_path));
  }

  revalidateProductPaths(id);
}

/**
 * Records photos that were already uploaded to Supabase Storage directly
 * from the browser (see src/lib/supabase/storage.ts) — this action only
 * ever handles small URL/path strings, never image bytes, so it stays fast
 * and well under the Server Action body size limit no matter how many or
 * how large the photos were.
 */
export async function attachProductImages(
  productId: string,
  images: { url: string; path: string }[],
): Promise<void> {
  if (images.length === 0) return;
  const { supabase } = await requireAdmin();

  const { count } = await supabase
    .from("product_images")
    .select("id", { count: "exact", head: true })
    .eq("product_id", productId);

  const startingSortOrder = count ?? 0;
  const rows = images.map((image, index) => ({
    product_id: productId,
    image_url: image.url,
    storage_path: image.path,
    sort_order: startingSortOrder + index,
    is_primary: startingSortOrder === 0 && index === 0,
  }));

  const { error } = await supabase.from("product_images").insert(rows);
  if (error) throw new Error(error.message);

  revalidateProductPaths(productId);
}

export async function deleteProductImage(productId: string, imageId: string): Promise<void> {
  const { supabase } = await requireAdmin();

  const { data: image } = await supabase
    .from("product_images")
    .select("storage_path, is_primary")
    .eq("id", imageId)
    .single();

  const { error } = await supabase.from("product_images").delete().eq("id", imageId);
  if (error) throw new Error(error.message);

  if (image) {
    const adminClient = createAdminClient();
    await adminClient.storage.from("product-images").remove([image.storage_path]);

    if (image.is_primary) {
      const { data: next } = await supabase
        .from("product_images")
        .select("id")
        .eq("product_id", productId)
        .order("sort_order", { ascending: true })
        .limit(1)
        .maybeSingle();
      if (next) {
        await supabase.from("product_images").update({ is_primary: true }).eq("id", next.id);
      }
    }
  }

  revalidateProductPaths(productId);
}

export async function setPrimaryImage(productId: string, imageId: string): Promise<void> {
  const { supabase } = await requireAdmin();

  await supabase
    .from("product_images")
    .update({ is_primary: false })
    .eq("product_id", productId);

  const { error } = await supabase
    .from("product_images")
    .update({ is_primary: true })
    .eq("id", imageId);
  if (error) throw new Error(error.message);

  revalidateProductPaths(productId);
}
