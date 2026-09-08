"use client";

import { useTranslations } from "next-intl";
import type { ProductMeasurements } from "@/types";

const MEASUREMENT_KEYS = [
  "shoulder",
  "chest",
  "waist",
  "hip",
  "length",
  "sleeve",
  "inseam",
  "rise",
  "legOpening",
  "width",
  "height",
  "depth",
  "strapDrop",
] as const;

export function MeasurementsList({ measurements }: { measurements: ProductMeasurements }) {
  const t = useTranslations("measurements");
  const tDetail = useTranslations("productDetail");

  const entries = Object.entries(measurements).filter(
    (entry): entry is [string, number] => typeof entry[1] === "number",
  );

  if (entries.length === 0) return null;

  return (
    <div>
      <h2 className="text-sm font-medium text-neutral-900">{tDetail("measurements")}</h2>
      <dl className="mt-3 grid grid-cols-2 gap-x-6 gap-y-2 sm:grid-cols-3">
        {entries.map(([key, value]) => (
          <div key={key} className="flex justify-between border-b border-neutral-100 py-1.5 text-sm">
            <dt className="text-neutral-500">
              {(MEASUREMENT_KEYS as readonly string[]).includes(key) ? t(key) : key}
            </dt>
            <dd className="font-medium text-neutral-900">{t("unitCm", { value })}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
