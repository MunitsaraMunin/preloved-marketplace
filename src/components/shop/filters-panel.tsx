"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useState } from "react";
import { useTranslations } from "next-intl";
import { Checkbox } from "@/components/ui/checkbox";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { SIZES, CONDITION_VALUES } from "@/lib/constants";
import { formatPrice } from "@/lib/utils";

const MAX_PRICE = 10000;

export function FiltersPanel({
  brands,
  colors,
  onApplied,
}: {
  brands: string[];
  colors: string[];
  onApplied?: () => void;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const t = useTranslations("filters");
  const tConditions = useTranslations("conditions");

  const selectedSizes = searchParams.get("size")?.split(",").filter(Boolean) ?? [];
  const selectedConditions =
    searchParams.get("condition")?.split(",").filter(Boolean) ?? [];
  const selectedBrands = searchParams.get("brand")?.split(",").filter(Boolean) ?? [];
  const selectedColors = searchParams.get("color")?.split(",").filter(Boolean) ?? [];
  const minPrice = Number(searchParams.get("minPrice") ?? 0);
  const maxPrice = Number(searchParams.get("maxPrice") ?? MAX_PRICE);

  const [priceRange, setPriceRange] = useState<[number, number]>([minPrice, maxPrice]);

  const updateParam = useCallback(
    (key: string, values: string[]) => {
      const params = new URLSearchParams(searchParams.toString());
      if (values.length) {
        params.set(key, values.join(","));
      } else {
        params.delete(key);
      }
      router.push(`${pathname}?${params.toString()}`);
      onApplied?.();
    },
    [pathname, router, searchParams, onApplied],
  );

  function toggle(key: string, current: string[], value: string) {
    const next = current.includes(value)
      ? current.filter((v) => v !== value)
      : [...current, value];
    updateParam(key, next);
  }

  function commitPriceRange(range: [number, number]) {
    const params = new URLSearchParams(searchParams.toString());
    if (range[0] > 0) params.set("minPrice", String(range[0]));
    else params.delete("minPrice");
    if (range[1] < MAX_PRICE) params.set("maxPrice", String(range[1]));
    else params.delete("maxPrice");
    router.push(`${pathname}?${params.toString()}`);
    onApplied?.();
  }

  function clearAll() {
    router.push(pathname);
    setPriceRange([0, MAX_PRICE]);
    onApplied?.();
  }

  const hasActiveFilters =
    selectedSizes.length > 0 ||
    selectedConditions.length > 0 ||
    selectedBrands.length > 0 ||
    selectedColors.length > 0 ||
    minPrice > 0 ||
    maxPrice < MAX_PRICE;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xs font-medium uppercase tracking-wide text-neutral-500">
          {t("title")}
        </h2>
        {hasActiveFilters && (
          <Button variant="link" size="sm" className="h-auto p-0 text-xs" onClick={clearAll}>
            {t("clearAll")}
          </Button>
        )}
      </div>

      <div>
        <h3 className="mb-3 text-sm font-medium text-neutral-900">{t("price")}</h3>
        <Slider
          min={0}
          max={MAX_PRICE}
          step={100}
          value={priceRange}
          onValueChange={(value) => setPriceRange(value as [number, number])}
          onValueCommit={(value) => commitPriceRange(value as [number, number])}
        />
        <div className="mt-2 flex justify-between text-xs text-neutral-500">
          <span>{formatPrice(priceRange[0])}</span>
          <span>{formatPrice(priceRange[1])}</span>
        </div>
      </div>

      <Separator />

      <div>
        <h3 className="mb-3 text-sm font-medium text-neutral-900">{t("size")}</h3>
        <div className="flex flex-wrap gap-2">
          {SIZES.map((size) => {
            const active = selectedSizes.includes(size);
            return (
              <button
                key={size}
                type="button"
                onClick={() => toggle("size", selectedSizes, size)}
                aria-pressed={active}
                className={`rounded-sm border px-2.5 py-1 text-xs transition-colors ${
                  active
                    ? "border-accent-600 bg-accent-600 text-white"
                    : "border-neutral-300 text-neutral-700 hover:border-accent-600"
                }`}
              >
                {size}
              </button>
            );
          })}
        </div>
      </div>

      <Separator />

      <div>
        <h3 className="mb-3 text-sm font-medium text-neutral-900">{t("condition")}</h3>
        <div className="space-y-2.5">
          {CONDITION_VALUES.map((value) => (
            <label key={value} className="flex items-center gap-2.5">
              <Checkbox
                checked={selectedConditions.includes(value)}
                onCheckedChange={() => toggle("condition", selectedConditions, value)}
              />
              <span className="text-sm text-neutral-700">{tConditions(value)}</span>
            </label>
          ))}
        </div>
      </div>

      {brands.length > 0 && (
        <>
          <Separator />
          <div>
            <h3 className="mb-3 text-sm font-medium text-neutral-900">{t("brand")}</h3>
            <div className="max-h-40 space-y-2.5 overflow-y-auto pr-1">
              {brands.map((brand) => (
                <label key={brand} className="flex items-center gap-2.5">
                  <Checkbox
                    checked={selectedBrands.includes(brand)}
                    onCheckedChange={() => toggle("brand", selectedBrands, brand)}
                  />
                  <span className="text-sm text-neutral-700">{brand}</span>
                </label>
              ))}
            </div>
          </div>
        </>
      )}

      {colors.length > 0 && (
        <>
          <Separator />
          <div>
            <h3 className="mb-3 text-sm font-medium text-neutral-900">{t("color")}</h3>
            <div className="max-h-40 space-y-2.5 overflow-y-auto pr-1">
              {colors.map((color) => (
                <label key={color} className="flex items-center gap-2.5">
                  <Checkbox
                    checked={selectedColors.includes(color)}
                    onCheckedChange={() => toggle("color", selectedColors, color)}
                  />
                  <span className="text-sm text-neutral-700">{color}</span>
                </label>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
