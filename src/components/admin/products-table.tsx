"use client";

import Image from "next/image";
import Link from "next/link";
import { useRealtimeProducts } from "@/hooks/use-realtime-products";
import { StatusBadge } from "@/components/product/status-badge";
import { ProductRowActions } from "@/components/admin/product-row-actions";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatDate, formatPrice } from "@/lib/utils";
import type { Product } from "@/types";

export function ProductsTable({ initialProducts }: { initialProducts: Product[] }) {
  const products = useRealtimeProducts(initialProducts, { onlyAvailable: false });

  if (products.length === 0) {
    return (
      <div className="border border-neutral-200 bg-white p-10 text-center">
        <p className="font-serif text-lg text-neutral-900">No products yet.</p>
        <p className="mt-1 text-sm text-neutral-500">
          <Link href="/admin/products/new" className="underline underline-offset-4">
            Add your first piece
          </Link>{" "}
          to get started.
        </p>
      </div>
    );
  }

  return (
    <div className="border border-neutral-200 bg-white">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="pl-4">Product</TableHead>
            <TableHead>Price</TableHead>
            <TableHead>Category</TableHead>
            <TableHead>Size</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Created</TableHead>
            <TableHead className="pr-4 text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {products.map((product) => (
            <TableRow key={product.id}>
              <TableCell className="pl-4">
                <Link href={`/admin/products/${product.id}/edit`} className="flex items-center gap-3">
                  <div className="relative h-12 w-10 shrink-0 overflow-hidden bg-neutral-100">
                    {product.images[0] && (
                      <Image
                        src={product.images[0].image_url}
                        alt=""
                        fill
                        sizes="40px"
                        className="object-cover"
                      />
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-neutral-900">{product.name}</p>
                    {product.brand && <p className="text-xs text-neutral-500">{product.brand}</p>}
                  </div>
                </Link>
              </TableCell>
              <TableCell className="whitespace-nowrap text-sm">{formatPrice(product.price)}</TableCell>
              <TableCell className="whitespace-nowrap text-sm text-neutral-600">
                {product.category?.name ?? "—"}
              </TableCell>
              <TableCell className="text-sm text-neutral-600">{product.size}</TableCell>
              <TableCell>
                <StatusBadge status={product.status} />
              </TableCell>
              <TableCell className="whitespace-nowrap text-sm text-neutral-500">
                {formatDate(product.created_at)}
              </TableCell>
              <TableCell className="pr-4 text-right">
                <ProductRowActions product={product} />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
