"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ImageDropzone } from "@/components/admin/image-dropzone";
import { ProductImagesManager } from "@/components/admin/product-images-manager";
import { productSchema, type ProductFormValues } from "@/lib/validations/product";
import { createProduct, updateProduct, attachProductImages } from "@/app/admin/products/actions";
import { uploadProductImageFile } from "@/lib/supabase/storage";
import { CONDITION_OPTIONS, SIZES } from "@/lib/constants";
import type { Category, Product } from "@/types";

const MEASUREMENT_FIELDS = [
  "shoulder",
  "chest",
  "waist",
  "hip",
  "length",
  "sleeve",
  "inseam",
] as const;

export function ProductForm({
  mode,
  product,
  categories,
}: {
  mode: "create" | "edit";
  product?: Product;
  categories: Category[];
}) {
  const router = useRouter();
  const [images, setImages] = useState<File[]>([]);
  const [imagesError, setImagesError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<ProductFormValues>({
    resolver: zodResolver(productSchema),
    defaultValues: product
      ? {
          name: product.name,
          description: product.description,
          price: product.price,
          originalPrice: product.original_price ?? undefined,
          categoryId: product.category?.id ?? "",
          size: product.size,
          condition: product.condition,
          brand: product.brand ?? "",
          color: product.color ?? "",
          material: product.material ?? "",
          sku: product.sku ?? "",
          tags: product.tags,
          measurements: product.measurements,
        }
      : { tags: [], measurements: {} },
  });

  const categoryId = watch("categoryId");
  const condition = watch("condition");
  const size = watch("size");

  async function onSubmit(values: ProductFormValues) {
    if (mode === "create" && images.length === 0) {
      setImagesError("Add at least one photo.");
      return;
    }
    setImagesError(null);

    const formData = new FormData();
    formData.set("name", values.name);
    formData.set("description", values.description);
    formData.set("price", String(values.price));
    if (values.originalPrice) formData.set("originalPrice", String(values.originalPrice));
    formData.set("categoryId", values.categoryId);
    formData.set("size", values.size);
    formData.set("condition", values.condition);
    if (values.brand) formData.set("brand", String(values.brand));
    if (values.color) formData.set("color", String(values.color));
    if (values.material) formData.set("material", String(values.material));
    if (values.sku) formData.set("sku", String(values.sku));
    formData.set("tags", (values.tags ?? []).join(","));
    for (const key of MEASUREMENT_FIELDS) {
      const value = values.measurements?.[key];
      if (value) formData.set(`measurements.${key}`, String(value));
    }

    try {
      if (mode === "create") {
        const { id } = await createProduct(formData);

        try {
          const uploaded = await Promise.all(
            images.map((file) => uploadProductImageFile(id, file)),
          );
          await attachProductImages(id, uploaded);
          toast.success("Product created");
        } catch (uploadError) {
          toast.error(
            uploadError instanceof Error
              ? `Product created, but photos failed to upload: ${uploadError.message}`
              : "Product created, but photos failed to upload.",
          );
        }

        router.push(`/admin/products/${id}/edit`);
      } else if (product) {
        await updateProduct(product.id, formData);
        toast.success("Product updated");
        router.push("/admin/products");
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Something went wrong");
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="grid gap-8 lg:grid-cols-[1fr_360px]">
      <div className="space-y-6">
        <section className="space-y-4 border border-neutral-200 bg-white p-5">
          <h2 className="text-sm font-medium text-neutral-900">Basic info</h2>

          <div className="space-y-1.5">
            <Label htmlFor="name">Product name</Label>
            <Input id="name" {...register("name")} placeholder="Vintage Oversized Shirt" />
            {errors.name && <p className="text-xs text-red-600">{errors.name.message}</p>}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              rows={5}
              {...register("description")}
              placeholder="Describe the fit, fabric, and any notable details or flaws…"
            />
            {errors.description && (
              <p className="text-xs text-red-600">{errors.description.message}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="price">Price (฿)</Label>
              <Input id="price" type="number" step="1" min="0" {...register("price")} />
              {errors.price && <p className="text-xs text-red-600">{errors.price.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="originalPrice">Original price (optional)</Label>
              <Input
                id="originalPrice"
                type="number"
                step="1"
                min="0"
                {...register("originalPrice")}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="categoryId">Category</Label>
              <Select value={categoryId} onValueChange={(value) => setValue("categoryId", value)}>
                <SelectTrigger id="categoryId">
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((category) => (
                    <SelectItem key={category.id} value={category.id}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.categoryId && (
                <p className="text-xs text-red-600">{errors.categoryId.message}</p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="size">Size</Label>
              <Select value={size} onValueChange={(value) => setValue("size", value)}>
                <SelectTrigger id="size">
                  <SelectValue placeholder="Select size" />
                </SelectTrigger>
                <SelectContent>
                  {SIZES.map((option) => (
                    <SelectItem key={option} value={option}>
                      {option}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.size && <p className="text-xs text-red-600">{errors.size.message}</p>}
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="condition">Condition</Label>
            <Select
              value={condition}
              onValueChange={(value) => setValue("condition", value as ProductFormValues["condition"])}
            >
              <SelectTrigger id="condition">
                <SelectValue placeholder="Select condition" />
              </SelectTrigger>
              <SelectContent>
                {CONDITION_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </section>

        <section className="space-y-4 border border-neutral-200 bg-white p-5">
          <h2 className="text-sm font-medium text-neutral-900">Details (optional)</h2>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="brand">Brand</Label>
              <Input id="brand" {...register("brand")} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="color">Color</Label>
              <Input id="color" {...register("color")} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="material">Material</Label>
              <Input id="material" {...register("material")} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="sku">SKU</Label>
              <Input id="sku" {...register("sku")} />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="tags">Tags (comma separated)</Label>
            <Input
              id="tags"
              defaultValue={product?.tags.join(", ") ?? ""}
              onChange={(event) =>
                setValue(
                  "tags",
                  event.target.value.split(",").map((tag) => tag.trim()).filter(Boolean),
                )
              }
              placeholder="vintage, denim, streetwear"
            />
          </div>
        </section>

        <section className="space-y-4 border border-neutral-200 bg-white p-5">
          <h2 className="text-sm font-medium text-neutral-900">Measurements — cm (optional)</h2>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
            {MEASUREMENT_FIELDS.map((field) => (
              <div key={field} className="space-y-1.5">
                <Label htmlFor={field} className="capitalize">
                  {field}
                </Label>
                <Input
                  id={field}
                  type="number"
                  step="0.5"
                  min="0"
                  {...register(`measurements.${field}`)}
                />
              </div>
            ))}
          </div>
        </section>
      </div>

      <div className="space-y-6">
        <section className="space-y-3 border border-neutral-200 bg-white p-5">
          <h2 className="text-sm font-medium text-neutral-900">Photos</h2>
          {mode === "create" ? (
            <>
              <ImageDropzone files={images} onChange={setImages} />
              {imagesError && <p className="text-xs text-red-600">{imagesError}</p>}
            </>
          ) : (
            product && <ProductImagesManager productId={product.id} images={product.images} />
          )}
        </section>

        <Button type="submit" size="lg" className="w-full" disabled={isSubmitting}>
          {isSubmitting
            ? "Saving…"
            : mode === "create"
              ? "Create product"
              : "Save changes"}
        </Button>
      </div>
    </form>
  );
}
