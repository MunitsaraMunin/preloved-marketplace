"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { productSchema } from "@/lib/validations/product";
import { slugify } from "@/lib/utils";
import type { ProductStatus } from "@/types";

const MAX_IMAGE_BYTES = 8 * 1024 * 1024;

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

async function uploadImages(
  supabase: Awaited<ReturnType<typeof requireAdmin>>["supabase"],
  productId: string,
  files: File[],
  startingSortOrder: number,
  firstIsPrimary: boolean,
) {
  let sortOrder = startingSortOrder;
  for (const file of files) {
    if (file.size === 0) continue;
    if (file.size > MAX_IMAGE_BYTES) {
      throw new Error(`"${file.name}" is larger than 8MB.`);
    }

    const extension = file.name.split(".").pop() ?? "jpg";
    const path = `${productId}/${crypto.randomUUID()}.${extension}`;

    const { error: uploadError } = await supabase.storage
      .from("product-images")
      .upload(path, file, { contentType: file.type, upsert: false });
    if (uploadError) throw new Error(`Failed to upload "${file.name}": ${uploadError.message}`);

    const { data: publicUrl } = supabase.storage.from("product-images").getPublicUrl(path);

    const { error: insertError } = await supabase.from("product_images").insert({
      product_id: productId,
      image_url: publicUrl.publicUrl,
      storage_path: path,
      sort_order: sortOrder,
      is_primary: firstIsPrimary && sortOrder === startingSortOrder,
    });
    if (insertError) throw new Error(insertError.message);

    sortOrder += 1;
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

  const files = formData.getAll("images").filter((entry): entry is File => entry instanceof File);
  await uploadImages(supabase, product.id, files, 0, true);

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

export async function uploadProductImages(productId: string, formData: FormData): Promise<void> {
  const { supabase } = await requireAdmin();

  const { count } = await supabase
    .from("product_images")
    .select("id", { count: "exact", head: true })
    .eq("product_id", productId);

  const files = formData.getAll("images").filter((entry): entry is File => entry instanceof File);
  await uploadImages(supabase, productId, files, count ?? 0, (count ?? 0) === 0);

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
