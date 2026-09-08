import type { Metadata } from "next";
import { ProductForm } from "@/components/admin/product-form";
import { getCategories } from "@/lib/data/categories";

export const metadata: Metadata = {
  title: "Add product",
  robots: { index: false, follow: false },
};

export default async function NewProductPage() {
  const categories = await getCategories();

  return (
    <div className="space-y-6">
      <h1 className="font-serif text-2xl text-neutral-900">Add product</h1>
      <ProductForm mode="create" categories={categories} />
    </div>
  );
}
