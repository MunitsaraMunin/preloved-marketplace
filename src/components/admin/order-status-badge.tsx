import { Circle } from "lucide-react";
import { cn } from "@/lib/utils";
import { ORDER_STATUS_LABELS, ORDER_STATUS_STYLES } from "@/lib/constants";
import type { OrderStatus } from "@/types";

export function OrderStatusBadge({
  status,
  className,
}: {
  status: OrderStatus;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-sm border px-2.5 py-1 text-[11px] font-medium uppercase tracking-wide",
        ORDER_STATUS_STYLES[status],
        className,
      )}
    >
      <Circle className="h-1.5 w-1.5 fill-current" />
      {ORDER_STATUS_LABELS[status]}
    </span>
  );
}
