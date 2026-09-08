/**
 * Hand-written mirror of the Supabase schema (supabase/migrations/*.sql).
 *
 * If you have the Supabase CLI linked to a project, you can regenerate this
 * file automatically instead of maintaining it by hand:
 *
 *   supabase gen types typescript --linked > src/types/database.ts
 *
 * Shape note: `@supabase/postgrest-js` (bundled via supabase-js) requires
 * each schema to structurally satisfy `GenericSchema` — `Tables`, `Views`
 * and `Functions` all present, and every table carrying a `Relationships`
 * array — or every query on this client resolves to `never` instead of
 * being typed. `Views` is empty and every table's `Relationships` is `[]`
 * because none of the queries in this codebase rely on PostgREST's
 * relationship-based embedding for type inference (joins are selected as
 * strings in src/lib/supabase/queries.ts and cast to the app-level types in
 * src/types/index.ts instead).
 */

export type UserRole = "admin" | "customer";
export type ProductStatus = "available" | "reserved" | "sold" | "hidden";
export type ProductCondition =
  | "new_with_tags"
  | "like_new"
  | "excellent"
  | "good"
  | "fair";
export type OrderStatus = "pending" | "confirmed" | "completed" | "cancelled";
export type ContactMethod = "phone" | "line" | "instagram" | "email" | "other";

export interface ProductMeasurements {
  shoulder?: number;
  chest?: number;
  waist?: number;
  hip?: number;
  length?: number;
  sleeve?: number;
  inseam?: number;
  rise?: number;
  legOpening?: number;
  width?: number;
  height?: number;
  depth?: number;
  strapDrop?: number;
  [key: string]: number | undefined;
}

export interface Database {
  __InternalSupabase: {
    PostgrestVersion: "13";
  };
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          full_name: string | null;
          role: UserRole;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          full_name?: string | null;
          role?: UserRole;
        };
        Update: {
          full_name?: string | null;
          role?: UserRole;
        };
        Relationships: [];
      };
      sellers: {
        Row: {
          id: string;
          profile_id: string;
          store_name: string;
          slug: string;
          bio: string | null;
          avatar_url: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          profile_id: string;
          store_name: string;
          slug: string;
          bio?: string | null;
          avatar_url?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["sellers"]["Insert"]>;
        Relationships: [
          {
            foreignKeyName: "sellers_profile_id_fkey";
            columns: ["profile_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      categories: {
        Row: {
          id: string;
          name: string;
          slug: string;
          sort_order: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          slug: string;
          sort_order?: number;
        };
        Update: Partial<Database["public"]["Tables"]["categories"]["Insert"]>;
        Relationships: [];
      };
      products: {
        Row: {
          id: string;
          seller_id: string;
          category_id: string | null;
          name: string;
          slug: string;
          description: string;
          brand: string | null;
          price: number;
          original_price: number | null;
          size: string;
          condition: ProductCondition;
          color: string | null;
          material: string | null;
          measurements: ProductMeasurements;
          sku: string | null;
          tags: string[];
          status: ProductStatus;
          quantity: number;
          created_at: string;
          updated_at: string;
          sold_at: string | null;
        };
        Insert: {
          id?: string;
          seller_id: string;
          category_id?: string | null;
          name: string;
          slug: string;
          description?: string;
          brand?: string | null;
          price: number;
          original_price?: number | null;
          size: string;
          condition: ProductCondition;
          color?: string | null;
          material?: string | null;
          measurements?: ProductMeasurements;
          sku?: string | null;
          tags?: string[];
          status?: ProductStatus;
          quantity?: number;
        };
        Update: Partial<Database["public"]["Tables"]["products"]["Insert"]>;
        Relationships: [
          {
            foreignKeyName: "products_seller_id_fkey";
            columns: ["seller_id"];
            isOneToOne: false;
            referencedRelation: "sellers";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "products_category_id_fkey";
            columns: ["category_id"];
            isOneToOne: false;
            referencedRelation: "categories";
            referencedColumns: ["id"];
          },
        ];
      };
      product_images: {
        Row: {
          id: string;
          product_id: string;
          image_url: string;
          storage_path: string;
          sort_order: number;
          is_primary: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          product_id: string;
          image_url: string;
          storage_path: string;
          sort_order?: number;
          is_primary?: boolean;
        };
        Update: Partial<Database["public"]["Tables"]["product_images"]["Insert"]>;
        Relationships: [
          {
            foreignKeyName: "product_images_product_id_fkey";
            columns: ["product_id"];
            isOneToOne: false;
            referencedRelation: "products";
            referencedColumns: ["id"];
          },
        ];
      };
      orders: {
        Row: {
          id: string;
          customer_name: string;
          contact_method: ContactMethod;
          contact_value: string;
          message: string | null;
          status: OrderStatus;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          customer_name: string;
          contact_method: ContactMethod;
          contact_value: string;
          message?: string | null;
          status?: OrderStatus;
        };
        Update: Partial<Database["public"]["Tables"]["orders"]["Insert"]>;
        Relationships: [];
      };
      order_items: {
        Row: {
          id: string;
          order_id: string;
          product_id: string;
          price: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          order_id: string;
          product_id: string;
          price: number;
        };
        Update: Partial<Database["public"]["Tables"]["order_items"]["Insert"]>;
        Relationships: [
          {
            foreignKeyName: "order_items_order_id_fkey";
            columns: ["order_id"];
            isOneToOne: false;
            referencedRelation: "orders";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "order_items_product_id_fkey";
            columns: ["product_id"];
            isOneToOne: true;
            referencedRelation: "products";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: Record<string, never>;
    Functions: {
      create_order: {
        Args: {
          p_product_id: string;
          p_customer_name: string;
          p_contact_method: ContactMethod;
          p_contact_value: string;
          p_message: string | null;
        };
        Returns: string;
      };
      is_admin: {
        Args: Record<string, never>;
        Returns: boolean;
      };
    };
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}
