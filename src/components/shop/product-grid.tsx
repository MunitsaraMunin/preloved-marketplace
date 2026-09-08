"use client";

import { useTranslations } from "next-intl";
import { useRealtimeProducts } from "@/hooks/use-realtime-products";
import { ProductCard } from "@/components/shop/product-card";
import { EmptyState } from "@/components/shop/empty-state";
import type { Product } from "@/types";

export function ProductGrid({
  initialProducts,
  hasActiveFilters,
}: {
  initialProducts: Product[];
  hasActiveFilters: boolean;
}) {
  const products = useRealtimeProducts(initialProducts, { onlyAvailable: true });
  const t = useTranslations("emptyState");

  if (products.length === 0) {
    return (
      <EmptyState
        title={hasActiveFilters ? t("noResultsTitle") : t("nothingTitle")}
        description={hasActiveFilters ? t("noResultsDescription") : t("nothingDescription")}
      />
    );
  }

  return (
    <div className="grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
      {products.map((product) => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  );
}
