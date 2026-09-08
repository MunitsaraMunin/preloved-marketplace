"use client";

import Image from "next/image";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { formatPrice } from "@/lib/utils";
import { StatusBadge } from "@/components/product/status-badge";
import type { Product } from "@/types";

export function ProductCard({ product }: { product: Product }) {
  const t = useTranslations();
  const primaryImage = product.images[0];
  const isDiscounted =
    product.original_price !== null && product.original_price > product.price;

  return (
    <Link
      href={`/product/${product.id}`}
      className="group block focus-visible:outline-none"
    >
      <div className="relative aspect-[4/5] overflow-hidden bg-neutral-100">
        {primaryImage ? (
          <Image
            src={primaryImage.image_url}
            alt={product.name}
            fill
            sizes="(min-width: 1024px) 25vw, (min-width: 640px) 33vw, 50vw"
            className="object-cover transition-transform duration-500 ease-out group-hover:scale-[1.03] group-focus-visible:scale-[1.03]"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-xs text-neutral-400">
            {t("product.noImage")}
          </div>
        )}

        {product.status !== "available" && (
          <div className="absolute inset-0 flex items-center justify-center bg-white/70">
            <StatusBadge status={product.status} className="bg-white" />
          </div>
        )}

        {isDiscounted && product.status === "available" && (
          <span className="absolute left-2 top-2 rounded-sm bg-accent-600 px-2 py-1 text-[10px] font-medium uppercase tracking-wide text-white">
            {t("product.sale")}
          </span>
        )}
      </div>

      <div className="mt-3 space-y-1">
        {product.brand && (
          <p className="text-[11px] font-medium uppercase tracking-wide text-neutral-400">
            {product.brand}
          </p>
        )}
        <h3 className="text-sm font-medium text-neutral-900 group-hover:underline">
          {product.name}
        </h3>
        <div className="flex items-center gap-2 text-sm">
          <span className="font-medium text-neutral-900">
            {formatPrice(product.price)}
          </span>
          {isDiscounted && (
            <span className="text-neutral-400 line-through">
              {formatPrice(product.original_price!)}
            </span>
          )}
        </div>
        <p className="text-xs text-neutral-500">
          {t("product.sizeCondition", {
            size: product.size,
            condition: t(`conditions.${product.condition}`),
          })}
        </p>
      </div>
    </Link>
  );
}
