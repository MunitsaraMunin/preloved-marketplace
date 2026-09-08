import Link from "next/link";
import Image from "next/image";
import { getTranslations } from "next-intl/server";
import { Button } from "@/components/ui/button";
import { ProductGrid } from "@/components/shop/product-grid";
import { getStorefrontProducts } from "@/lib/data/products";
import { getCategories } from "@/lib/data/categories";

export default async function HomePage() {
  const [products, categories, t, tHome] = await Promise.all([
    getStorefrontProducts({ sort: "newest" }),
    getCategories(),
    getTranslations("hero"),
    getTranslations("home"),
  ]);
  const featured = products.slice(0, 8);

  return (
    <div>
      <section className="relative overflow-hidden border-b border-neutral-200 bg-neutral-100">
        <div className="mx-auto grid max-w-7xl items-center gap-8 px-4 py-20 sm:px-6 lg:grid-cols-2 lg:py-32 lg:px-8">
          <div className="max-w-lg">
            <h1 className="font-serif text-4xl leading-[1.1] text-neutral-900 sm:text-5xl lg:text-6xl">
              {t("title")}
            </h1>
            <p className="mt-5 max-w-md text-base text-neutral-600">{t("subtitle")}</p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button asChild size="lg">
                <Link href="/shop">{t("cta")}</Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link href="/about">{t("secondaryCta")}</Link>
              </Button>
            </div>
          </div>
          <div className="relative hidden aspect-[4/5] overflow-hidden bg-neutral-200 lg:block">
            {featured[0]?.images[0] && (
              <Image
                src={featured[0].images[0].image_url}
                alt={featured[0].name}
                fill
                priority
                sizes="40vw"
                className="object-cover"
              />
            )}
          </div>
        </div>
      </section>

      {categories.length > 0 && (
        <section className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
          <h2 className="font-serif text-2xl text-neutral-900">{tHome("shopByCategory")}</h2>
          <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
            {categories.map((category) => (
              <Link
                key={category.id}
                href={`/shop?category=${category.slug}`}
                className="group flex items-center justify-between border border-neutral-200 px-4 py-4 text-sm font-medium text-neutral-800 transition-colors hover:border-accent-600 hover:bg-accent-600 hover:text-white"
              >
                {category.name}
                <span aria-hidden className="transition-transform group-hover:translate-x-0.5">
                  →
                </span>
              </Link>
            ))}
          </div>
        </section>
      )}

      <section className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
        <div className="mb-6 flex items-end justify-between">
          <h2 className="font-serif text-2xl text-neutral-900">{tHome("newArrivals")}</h2>
          <Link href="/shop" className="text-sm font-medium text-neutral-700 hover:text-neutral-900">
            {tHome("viewAll")} →
          </Link>
        </div>
        <ProductGrid initialProducts={featured} hasActiveFilters={false} />
      </section>

      <section className="border-t border-neutral-200 bg-neutral-100">
        <div className="mx-auto max-w-3xl px-4 py-16 text-center sm:px-6 lg:px-8">
          <h2 className="font-serif text-2xl text-neutral-900">{tHome("trustTitle")}</h2>
          <p className="mt-3 text-sm text-neutral-600">{tHome("trustBody")}</p>
        </div>
      </section>
    </div>
  );
}
