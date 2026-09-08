"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { SlidersHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { FiltersPanel } from "@/components/shop/filters-panel";

export function FiltersMobileSheet({
  brands,
  colors,
}: {
  brands: string[];
  colors: string[];
}) {
  const [open, setOpen] = useState(false);
  const t = useTranslations("shop");

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="outline" size="default" className="lg:hidden">
          <SlidersHorizontal className="h-4 w-4" />
          {t("filtersButton")}
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="overflow-y-auto">
        <SheetHeader>
          <SheetTitle>{t("filtersSheetTitle")}</SheetTitle>
          <SheetDescription>{t("filtersSheetDescription")}</SheetDescription>
        </SheetHeader>
        <div className="mt-4">
          <FiltersPanel brands={brands} colors={colors} onApplied={() => setOpen(false)} />
        </div>
      </SheetContent>
    </Sheet>
  );
}
