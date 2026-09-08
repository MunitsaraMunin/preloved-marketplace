import type {
  ContactMethod,
  OrderStatus,
  ProductCondition,
  ProductStatus,
} from "@/types";

export const SIZES = [
  "XS",
  "S",
  "M",
  "L",
  "XL",
  "XXL",
  "24",
  "26",
  "28",
  "30",
  "32",
  "34",
  "36",
  "One Size",
] as const;

export const CONDITION_LABELS: Record<ProductCondition, string> = {
  new_with_tags: "New with tags",
  like_new: "Like new",
  excellent: "Excellent",
  good: "Good",
  fair: "Fair",
};

export const CONDITION_OPTIONS = Object.entries(CONDITION_LABELS).map(
  ([value, label]) => ({ value: value as ProductCondition, label }),
);

export const CONDITION_VALUES = CONDITION_OPTIONS.map((option) => option.value);

export const PRODUCT_STATUS_LABELS: Record<ProductStatus, string> = {
  available: "Available",
  reserved: "Reserved",
  sold: "Sold",
  hidden: "Hidden",
};

export const PRODUCT_STATUS_STYLES: Record<ProductStatus, string> = {
  available: "bg-emerald-50 text-emerald-700 border-emerald-200",
  reserved: "bg-amber-50 text-amber-700 border-amber-200",
  sold: "bg-neutral-900 text-white border-neutral-900",
  hidden: "bg-neutral-100 text-neutral-500 border-neutral-200",
};

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  pending: "Pending",
  confirmed: "Confirmed",
  completed: "Completed",
  cancelled: "Cancelled",
};

export const ORDER_STATUS_STYLES: Record<OrderStatus, string> = {
  pending: "bg-amber-50 text-amber-700 border-amber-200",
  confirmed: "bg-sky-50 text-sky-700 border-sky-200",
  completed: "bg-emerald-50 text-emerald-700 border-emerald-200",
  cancelled: "bg-neutral-100 text-neutral-500 border-neutral-200",
};

export const ORDER_STATUS_OPTIONS = Object.entries(ORDER_STATUS_LABELS).map(
  ([value, label]) => ({ value: value as OrderStatus, label }),
);

export const CONTACT_METHOD_LABELS: Record<ContactMethod, string> = {
  phone: "Phone",
  line: "LINE",
  instagram: "Instagram",
  email: "Email",
  other: "Other",
};

export const CONTACT_METHOD_OPTIONS = Object.entries(
  CONTACT_METHOD_LABELS,
).map(([value, label]) => ({ value: value as ContactMethod, label }));

export const CONTACT_METHOD_VALUES = CONTACT_METHOD_OPTIONS.map((option) => option.value);

export const SORT_VALUES = ["newest", "price_asc", "price_desc"] as const;

export const SITE_NAME = "Preloved";
export const SITE_DESCRIPTION =
  "Curated secondhand clothing, selected one piece at a time.";
export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
