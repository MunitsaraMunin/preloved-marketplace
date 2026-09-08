"use client";

import Link from "next/link";
import { useState } from "react";
import { useTranslations } from "next-intl";
import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { SITE_NAME } from "@/lib/constants";
import type { Category } from "@/types";

export function MobileNav({ categories }: { categories: Category[] }) {
  const [open, setOpen] = useState(false);
  const t = useTranslations("nav");

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" aria-label={t("openMenu")}>
          <Menu className="h-5 w-5" />
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="flex flex-col">
        <SheetHeader>
          <SheetTitle>{SITE_NAME}</SheetTitle>
          <SheetDescription>{t("siteNavigation")}</SheetDescription>
        </SheetHeader>
        <nav className="mt-4 flex flex-col gap-1">
          <Link
            href="/shop"
            onClick={() => setOpen(false)}
            className="rounded-sm px-2 py-3 text-base text-neutral-900 transition-colors hover:bg-neutral-100"
          >
            {t("shop")}
          </Link>
          <Link
            href="/shop?sort=newest"
            onClick={() => setOpen(false)}
            className="rounded-sm px-2 py-3 text-base text-neutral-900 transition-colors hover:bg-neutral-100"
          >
            {t("newArrivals")}
          </Link>
          <p className="mt-3 px-2 text-xs font-medium uppercase tracking-wide text-neutral-400">
            {t("categories")}
          </p>
          {categories.map((category) => (
            <Link
              key={category.id}
              href={`/shop?category=${category.slug}`}
              onClick={() => setOpen(false)}
              className="rounded-sm px-2 py-2.5 text-base text-neutral-900 transition-colors hover:bg-neutral-100"
            >
              {category.name}
            </Link>
          ))}
          <div className="my-3 h-px bg-neutral-200" />
          <Link
            href="/about"
            onClick={() => setOpen(false)}
            className="rounded-sm px-2 py-3 text-base text-neutral-900 transition-colors hover:bg-neutral-100"
          >
            {t("about")}
          </Link>
        </nav>
      </SheetContent>
    </Sheet>
  );
}
