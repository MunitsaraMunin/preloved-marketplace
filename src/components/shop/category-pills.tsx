"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import type { Category } from "@/types";

export function CategoryPills({ categories }: { categories: Category[] }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const activeSlug = searchParams.get("category");
  const t = useTranslations("filters");

  function selectCategory(slug: string | null) {
    const params = new URLSearchParams(searchParams.toString());
    if (slug) params.set("category", slug);
    else params.delete("category");
    router.push(`${pathname}?${params.toString()}`);
  }

  return (
    <div className="flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      <button
        type="button"
        onClick={() => selectCategory(null)}
        className={cn(
          "shrink-0 rounded-full border px-4 py-1.5 text-sm transition-colors",
          !activeSlug
            ? "border-accent-600 bg-accent-600 text-white"
            : "border-neutral-300 text-neutral-700 hover:border-accent-600 hover:text-accent-700",
        )}
      >
        {t("all")}
      </button>
      {categories.map((category) => (
        <button
          key={category.id}
          type="button"
          onClick={() => selectCategory(category.slug)}
          className={cn(
            "shrink-0 rounded-full border px-4 py-1.5 text-sm transition-colors",
            activeSlug === category.slug
              ? "border-accent-600 bg-accent-600 text-white"
              : "border-neutral-300 text-neutral-700 hover:border-accent-600 hover:text-accent-700",
          )}
        >
          {category.name}
        </button>
      ))}
    </div>
  );
}
