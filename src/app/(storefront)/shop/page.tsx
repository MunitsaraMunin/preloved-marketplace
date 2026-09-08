import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { CategoryPills } from "@/components/shop/category-pills";
import { SortSelect } from "@/components/shop/sort-select";
import { FiltersPanel } from "@/components/shop/filters-panel";
import { FiltersMobileSheet } from "@/components/shop/filters-mobile-sheet";
import { ProductGrid } from "@/components/shop/product-grid";
import { getStorefrontProducts, getAvailableFacets } from "@/lib/data/products";
import { getCategories } from "@/lib/data/categories";
import type { ProductFilters, SortOption } from "@/types";

export const metadata: Metadata = {
  title: "Shop",
  description: "Browse the full collection of curated secondhand clothing.",
};

function parseList(value: string | string[] | undefined) {
  const raw = Array.isArray(value) ? value[0] : value;
  return raw ? raw.split(",").filter(Boolean) : undefined;
}

export default async function ShopPage(props: PageProps<"/shop">) {
  const searchParams = await props.searchParams;

  const filters: ProductFilters = {
    search: typeof searchParams.search === "string" ? searchParams.search : undefined,
    categorySlug:
      typeof searchParams.category === "string" ? searchParams.category : undefined,
    sizes: parseList(searchParams.size),
    conditions: parseList(searchParams.condition),
    brands: parseList(searchParams.brand),
    colors: parseList(searchParams.color),
    minPrice: searchParams.minPrice ? Number(searchParams.minPrice) : undefined,
    maxPrice: searchParams.maxPrice ? Number(searchParams.maxPrice) : undefined,
    sort: (typeof searchParams.sort === "string" ? searchParams.sort : "newest") as SortOption,
  };

  const [products, categories, facets, t] = await Promise.all([
    getStorefrontProducts(filters),
    getCategories(),
    getAvailableFacets(),
    getTranslations("shop"),
  ]);

  const hasActiveFilters = Boolean(
    filters.search ||
      filters.categorySlug ||
      filters.sizes?.length ||
      filters.conditions?.length ||
      filters.brands?.length ||
      filters.colors?.length ||
      filters.minPrice ||
      filters.maxPrice,
  );

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-6 flex flex-col gap-1">
        <h1 className="font-serif text-3xl text-neutral-900">
          {filters.search ? t("resultsFor", { query: filters.search }) : t("title")}
        </h1>
        <p className="text-sm text-neutral-500">
          {t("pieceCount", { count: products.length })}
        </p>
      </div>

      <div className="mb-6">
        <CategoryPills categories={categories} />
      </div>

      <div className="mb-6 flex items-center justify-between gap-3">
        <FiltersMobileSheet brands={facets.brands} colors={facets.colors} />
        <SortSelect />
      </div>

      <div className="grid gap-10 lg:grid-cols-[240px_1fr]">
        <aside className="hidden lg:block">
          <FiltersPanel brands={facets.brands} colors={facets.colors} />
        </aside>
        <ProductGrid initialProducts={products} hasActiveFilters={hasActiveFilters} />
      </div>
    </div>
  );
}
