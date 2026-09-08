"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useTranslations } from "next-intl";
import { Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MobileNav } from "@/components/layout/mobile-nav";
import { LanguageSwitcher } from "@/components/layout/language-switcher";
import { SITE_NAME } from "@/lib/constants";
import type { Category } from "@/types";

export function Header({ categories }: { categories: Category[] }) {
  const router = useRouter();
  const t = useTranslations("nav");
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState("");

  function handleSearchSubmit(event: React.FormEvent) {
    event.preventDefault();
    const params = new URLSearchParams();
    if (query.trim()) params.set("search", query.trim());
    router.push(`/shop${params.size ? `?${params}` : ""}`);
    setSearchOpen(false);
  }

  return (
    <header className="sticky top-0 z-40 border-b border-neutral-200 bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/80">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-2 lg:hidden">
          <MobileNav categories={categories} />
        </div>

        <Link
          href="/"
          className="font-serif text-xl tracking-tight text-neutral-900 lg:text-2xl"
        >
          {SITE_NAME}
        </Link>

        <nav className="hidden items-center gap-8 lg:flex">
          <Link
            href="/shop"
            className="text-sm font-medium text-neutral-700 transition-colors hover:text-neutral-900"
          >
            {t("shop")}
          </Link>
          <Link
            href="/shop?sort=newest"
            className="text-sm font-medium text-neutral-700 transition-colors hover:text-neutral-900"
          >
            {t("newArrivals")}
          </Link>
          {categories.slice(0, 5).map((category) => (
            <Link
              key={category.id}
              href={`/shop?category=${category.slug}`}
              className="text-sm font-medium text-neutral-700 transition-colors hover:text-neutral-900"
            >
              {category.name}
            </Link>
          ))}
          <Link
            href="/about"
            className="text-sm font-medium text-neutral-700 transition-colors hover:text-neutral-900"
          >
            {t("about")}
          </Link>
        </nav>

        <div className="flex items-center gap-1">
          <LanguageSwitcher />
          <Button
            variant="ghost"
            size="icon"
            aria-label={searchOpen ? t("closeSearch") : t("search")}
            onClick={() => setSearchOpen((open) => !open)}
          >
            {searchOpen ? <X className="h-5 w-5" /> : <Search className="h-5 w-5" />}
          </Button>
        </div>
      </div>

      {searchOpen && (
        <div className="border-t border-neutral-200 bg-background px-4 py-3 sm:px-6 lg:px-8">
          <form
            onSubmit={handleSearchSubmit}
            className="mx-auto flex max-w-7xl items-center gap-2"
          >
            <Input
              autoFocus
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder={t("searchPlaceholder")}
              aria-label={t("search")}
            />
            <Button type="submit" size="default">
              {t("searchSubmit")}
            </Button>
          </form>
        </div>
      )}
    </header>
  );
}
