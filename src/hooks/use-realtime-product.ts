"use client";

import { useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { PRODUCT_WITH_RELATIONS_SELECT, sortProductImages } from "@/lib/supabase/queries";
import type { Product } from "@/types";

/**
 * Keeps a single product detail page (/product/[id]) in sync in real time.
 *
 * If the admin changes the product's status, price, description, or photos
 * while a customer is looking at it, the change appears immediately — most
 * importantly, if it becomes SOLD the "Buy" action must disable itself
 * without the customer needing to refresh (see src/components/product/
 * buy-panel.tsx, which reads `status` from this hook's return value).
 *
 * If the product is deleted outright, `product` becomes `null` and the page
 * shows a "no longer available" state instead of stale content.
 */
export function useRealtimeProduct(initialProduct: Product) {
  const [product, setProduct] = useState<Product | null>(initialProduct);
  const [trackedInitialProduct, setTrackedInitialProduct] = useState(initialProduct);
  const supabaseRef = useRef(createClient());

  // Reset local state when the server hands us a new initial product (e.g. after a
  // navigation), without the cascading extra render a useEffect would cause here —
  // see https://react.dev/learn/you-might-not-need-an-effect#adjusting-state-based-on-props
  if (initialProduct !== trackedInitialProduct) {
    setTrackedInitialProduct(initialProduct);
    setProduct(initialProduct);
  }

  useEffect(() => {
    const supabase = supabaseRef.current;
    const productId = initialProduct.id;

    async function refetch() {
      const { data } = await supabase
        .from("products")
        .select(PRODUCT_WITH_RELATIONS_SELECT)
        .eq("id", productId)
        .maybeSingle();

      setProduct(data ? sortProductImages(data as Product) : null);
    }

    const channel = supabase
      .channel(`product-detail-${productId}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "products",
          filter: `id=eq.${productId}`,
        },
        refetch,
      )
      .on(
        "postgres_changes",
        {
          event: "DELETE",
          schema: "public",
          table: "products",
          filter: `id=eq.${productId}`,
        },
        () => setProduct(null),
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "product_images",
          filter: `product_id=eq.${productId}`,
        },
        refetch,
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [initialProduct.id]);

  return product;
}
