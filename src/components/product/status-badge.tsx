"use client";

import { Circle } from "lucide-react";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import { PRODUCT_STATUS_STYLES } from "@/lib/constants";
import type { ProductStatus } from "@/types";

/**
 * Status is always communicated with a text label alongside color (never
 * color alone), per the accessibility requirement that color can't be the
 * only signal.
 */
export function StatusBadge({
  status,
  className,
}: {
  status: ProductStatus;
  className?: string;
}) {
  const t = useTranslations("status");

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-sm border px-2.5 py-1 text-[11px] font-medium uppercase tracking-wide",
        PRODUCT_STATUS_STYLES[status],
        className,
      )}
    >
      <Circle className="h-1.5 w-1.5 fill-current" />
      {t(status)}
    </span>
  );
}
