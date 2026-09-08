"use client";

import { useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { PRODUCT_WITH_RELATIONS_SELECT, sortProductImages } from "@/lib/supabase/queries";
import type { Product } from "@/types";

/**
 * Keeps a storefront product grid in sync with Postgres in real time.
 *
 * Subscribes to `products` (and `product_images`, so edited photos show up
 * too) via Supabase Realtime. Because the anon client's Realtime
 * subscription is authorized against the same RLS policies as a normal
 * query, a HIDDEN product's change events never reach this client at all —
 * so "only AVAILABLE products are shown" holds even under realtime updates,
 * not just on first load.
 *
 * `onlyAvailable` mirrors the initial server-side filter: pass `true` for
 * the public /shop grid (items that become RESERVED/SOLD/HIDDEN vanish, and
 * items that become AVAILABLE again reappear) and `false` for the admin
 * product table (every status stays visible, badges just update in place).
 */
export function useRealtimeProducts(
  initialProducts: Product[],
  { onlyAvailable }: { onlyAvailable: boolean },
) {
  const [products, setProducts] = useState(initialProducts);
  const idsKey = initialProducts.map((p) => p.id).join(",");
  const [trackedIdsKey, setTrackedIdsKey] = useState(idsKey);
  const supabaseRef = useRef(createClient());

  // Reset local state when the server hands us a new initial list (e.g. after a
  // navigation), without the cascading extra render a useEffect would cause here —
  // see https://react.dev/learn/you-might-not-need-an-effect#adjusting-state-based-on-props
  if (idsKey !== trackedIdsKey) {
    setTrackedIdsKey(idsKey);
    setProducts(initialProducts);
  }

  useEffect(() => {
    const supabase = supabaseRef.current;

    async function refetchProduct(id: string) {
      const { data, error } = await supabase
        .from("products")
        .select(PRODUCT_WITH_RELATIONS_SELECT)
        .eq("id", id)
        .maybeSingle();

      if (error || !data) return;
      const product = sortProductImages(data as Product);

      setProducts((current) => {
        const exists = current.some((p) => p.id === product.id);
        if (onlyAvailable && product.status !== "available") {
          return current.filter((p) => p.id !== product.id);
        }
        if (exists) {
          return current.map((p) => (p.id === product.id ? product : p));
        }
        return onlyAvailable ? [product, ...current] : current;
      });
    }

    const channel = supabase
      .channel("products-list-changes")
      .on(
        "postgres_changes",
        { event: "DELETE", schema: "public", table: "products" },
        (payload) => {
          const id = payload.old.id as string;
          setProducts((current) => current.filter((p) => p.id !== id));
        },
      )
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "products" },
        (payload) => refetchProduct(payload.new.id as string),
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "products" },
        (payload) => refetchProduct(payload.new.id as string),
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "product_images" },
        (payload) => {
          const productId = (payload.new as { product_id?: string } | null)
            ?.product_id ?? (payload.old as { product_id?: string } | null)?.product_id;
          if (productId) refetchProduct(productId);
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [onlyAvailable]);

  return products;
}
