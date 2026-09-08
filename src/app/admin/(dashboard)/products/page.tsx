import Link from "next/link";
import type { Metadata } from "next";
import { Button } from "@/components/ui/button";
import { ProductsTable } from "@/components/admin/products-table";
import { getAdminProducts } from "@/lib/data/products";

export const metadata: Metadata = {
  title: "Products",
  robots: { index: false, follow: false },
};

export default async function AdminProductsPage() {
  const products = await getAdminProducts();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="font-serif text-2xl text-neutral-900">Products</h1>
        <Button asChild>
          <Link href="/admin/products/new">Add product</Link>
        </Button>
      </div>

      <ProductsTable initialProducts={products} />
    </div>
  );
}
