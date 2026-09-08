/**
 * Shared query fragments used by both server-side data fetching
 * (src/lib/data) and client-side realtime refetches (src/hooks). Kept
 * dependency-free (no `server-only`) so it can be imported from Client
 * Components.
 */
export const PRODUCT_WITH_RELATIONS_SELECT = `
  *,
  images:product_images(*),
  category:categories(id, name, slug)
`;

export function sortProductImages<
  T extends { images: { is_primary: boolean; sort_order: number }[] },
>(product: T): T {
  return {
    ...product,
    images: [...product.images].sort((a, b) => {
      if (a.is_primary !== b.is_primary) return a.is_primary ? -1 : 1;
      return a.sort_order - b.sort_order;
    }),
  };
}
