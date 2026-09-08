import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ProductForm } from "@/components/admin/product-form";
import { getAdminProductById } from "@/lib/data/products";
import { getCategories } from "@/lib/data/categories";

export const metadata: Metadata = {
  title: "Edit product",
  robots: { index: false, follow: false },
};

export default async function EditProductPage(props: PageProps<"/admin/products/[id]/edit">) {
  const { id } = await props.params;
  const [product, categories] = await Promise.all([
    getAdminProductById(id),
    getCategories(),
  ]);

  if (!product) notFound();

  return (
    <div className="space-y-6">
      <h1 className="font-serif text-2xl text-neutral-900">Edit &ldquo;{product.name}&rdquo;</h1>
      <ProductForm mode="edit" product={product} categories={categories} />
    </div>
  );
}
