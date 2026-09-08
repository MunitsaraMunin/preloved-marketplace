"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { useRealtimeProduct } from "@/hooks/use-realtime-product";
import { ImageGallery } from "@/components/product/image-gallery";
import { MeasurementsList } from "@/components/product/measurements-list";
import { BuyPanel } from "@/components/product/buy-panel";
import { StatusBadge } from "@/components/product/status-badge";
import { ProductCard } from "@/components/shop/product-card";
import { EmptyState } from "@/components/shop/empty-state";
import { Button } from "@/components/ui/button";
import { formatPrice } from "@/lib/utils";
import type { Product } from "@/types";

export function ProductDetail({
  initialProduct,
  relatedProducts,
}: {
  initialProduct: Product;
  relatedProducts: Product[];
}) {
  const product = useRealtimeProduct(initialProduct);
  const t = useTranslations("productDetail");
  const tNav = useTranslations("nav");
  const tConditions = useTranslations("conditions");

  if (!product) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-24 sm:px-6 lg:px-8">
        <EmptyState title={t("unavailableTitle")} description={t("unavailableDescription")} />
        <div className="mt-6 flex justify-center">
          <Button asChild variant="outline">
            <Link href="/shop">{t("backToShop")}</Link>
          </Button>
        </div>
      </div>
    );
  }

  const isDiscounted =
    product.original_price !== null && product.original_price > product.price;

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <nav aria-label="Breadcrumb" className="mb-6 text-xs text-neutral-500">
        <Link href="/shop" className="hover:text-neutral-900">
          {tNav("shop")}
        </Link>
        {product.category && (
          <>
            {" / "}
            <Link
              href={`/shop?category=${product.category.slug}`}
              className="hover:text-neutral-900"
            >
              {product.category.name}
            </Link>
          </>
        )}
      </nav>

      <div className="grid gap-8 lg:grid-cols-2 lg:gap-16">
        <ImageGallery images={product.images} productName={product.name} />

        <div className="max-w-xl">
          {product.status !== "available" && (
            <StatusBadge status={product.status} className="mb-4" />
          )}

          {product.brand && (
            <p className="text-xs font-medium uppercase tracking-wide text-neutral-400">
              {product.brand}
            </p>
          )}
          <h1 className="mt-1 font-serif text-3xl text-neutral-900 sm:text-4xl">
            {product.name}
          </h1>

          <div className="mt-3 flex items-center gap-3">
            <span className="text-xl font-medium text-neutral-900">
              {formatPrice(product.price)}
            </span>
            {isDiscounted && (
              <span className="text-neutral-400 line-through">
                {formatPrice(product.original_price!)}
              </span>
            )}
          </div>

          <dl className="mt-6 grid grid-cols-2 gap-x-6 gap-y-2 border-y border-neutral-200 py-4 text-sm sm:grid-cols-3">
            <div>
              <dt className="text-neutral-500">{t("size")}</dt>
              <dd className="font-medium text-neutral-900">{product.size}</dd>
            </div>
            <div>
              <dt className="text-neutral-500">{t("condition")}</dt>
              <dd className="font-medium text-neutral-900">
                {tConditions(product.condition)}
              </dd>
            </div>
            {product.color && (
              <div>
                <dt className="text-neutral-500">{t("color")}</dt>
                <dd className="font-medium text-neutral-900">{product.color}</dd>
              </div>
            )}
            {product.material && (
              <div>
                <dt className="text-neutral-500">{t("material")}</dt>
                <dd className="font-medium text-neutral-900">{product.material}</dd>
              </div>
            )}
          </dl>

          <div className="mt-6">
            <BuyPanel product={product} />
          </div>

          {product.description && (
            <div className="mt-8">
              <h2 className="text-sm font-medium text-neutral-900">{t("description")}</h2>
              <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-neutral-600">
                {product.description}
              </p>
            </div>
          )}

          {Object.keys(product.measurements).length > 0 && (
            <div className="mt-8">
              <MeasurementsList measurements={product.measurements} />
            </div>
          )}
        </div>
      </div>

      {relatedProducts.length > 0 && (
        <div className="mt-20 border-t border-neutral-200 pt-12">
          <h2 className="font-serif text-2xl text-neutral-900">{t("youMayAlsoLike")}</h2>
          <div className="mt-6 grid grid-cols-2 gap-x-4 gap-y-8 lg:grid-cols-4">
            {relatedProducts.map((related) => (
              <ProductCard key={related.id} product={related} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
