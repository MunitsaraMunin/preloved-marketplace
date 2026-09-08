import { createClient } from "@/lib/supabase/client";

const MAX_DIMENSION = 1600;
const JPEG_QUALITY = 0.82;

/**
 * Downscales and re-encodes a photo before it ever leaves the browser.
 * Phone camera photos routinely run 3-12MB; resizing to a sane display size
 * and re-encoding as JPEG usually gets that under ~500KB, which is the
 * difference between an upload that takes a few seconds and one that
 * crawls on a slow connection. Falls back to the original file if the
 * browser can't decode it (e.g. an unsupported format) or compression
 * doesn't actually shrink it.
 */
async function compressImage(file: File): Promise<File> {
  if (!file.type.startsWith("image/") || file.type === "image/svg+xml") return file;

  try {
    const bitmap = await createImageBitmap(file);
    const scale = Math.min(1, MAX_DIMENSION / Math.max(bitmap.width, bitmap.height));
    const width = Math.round(bitmap.width * scale);
    const height = Math.round(bitmap.height * scale);

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) return file;
    ctx.drawImage(bitmap, 0, 0, width, height);
    bitmap.close();

    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, "image/jpeg", JPEG_QUALITY),
    );
    if (!blob || blob.size >= file.size) return file;

    return new File([blob], file.name.replace(/\.\w+$/, ".jpg"), { type: "image/jpeg" });
  } catch {
    return file;
  }
}

/**
 * Uploads a single product photo straight from the browser to Supabase
 * Storage — never through a Next.js Server Action. Server Actions cap
 * request bodies at 1MB by default, and routing binary uploads through the
 * server just adds a slow, pointless extra hop (browser -> server ->
 * Supabase instead of browser -> Supabase directly). The admin's browser
 * session already satisfies the "admins upload product images" Storage RLS
 * policy, the same way it satisfies every other admin-only policy.
 */
export async function uploadProductImageFile(
  productId: string,
  file: File,
): Promise<{ url: string; path: string }> {
  const supabase = createClient();
  const compressed = await compressImage(file);
  const path = `${productId}/${crypto.randomUUID()}.jpg`;

  const { error } = await supabase.storage
    .from("product-images")
    .upload(path, compressed, { contentType: compressed.type, upsert: false });
  if (error) throw new Error(`Failed to upload "${file.name}": ${error.message}`);

  const { data } = supabase.storage.from("product-images").getPublicUrl(path);
  return { url: data.publicUrl, path };
}
