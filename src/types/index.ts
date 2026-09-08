import type { Database } from "./database";

export type {
  ProductStatus,
  ProductCondition,
  OrderStatus,
  ContactMethod,
  UserRole,
  ProductMeasurements,
} from "./database";

export type Category = Database["public"]["Tables"]["categories"]["Row"];
export type ProductRow = Database["public"]["Tables"]["products"]["Row"];
export type ProductImage = Database["public"]["Tables"]["product_images"]["Row"];
export type Order = Database["public"]["Tables"]["orders"]["Row"];
export type OrderItem = Database["public"]["Tables"]["order_items"]["Row"];
export type Seller = Database["public"]["Tables"]["sellers"]["Row"];

/** A product joined with its images and category — the shape most UI needs. */
export interface Product extends ProductRow {
  images: ProductImage[];
  category: Pick<Category, "id" | "name" | "slug"> | null;
}

/** An order joined with its line items and the product each one refers to. */
export interface OrderWithItems extends Order {
  order_items: (OrderItem & {
    product: Pick<ProductRow, "id" | "name" | "slug" | "price"> | null;
  })[];
}

export interface ProductFilters {
  search?: string;
  categorySlug?: string;
  sizes?: string[];
  brands?: string[];
  colors?: string[];
  conditions?: string[];
  minPrice?: number;
  maxPrice?: number;
  status?: ProductStatusFilter;
  sort?: SortOption;
}

export type ProductStatusFilter = "available" | "all";
export type SortOption = "newest" | "price_asc" | "price_desc";
