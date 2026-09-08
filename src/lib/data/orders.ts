import "server-only";
import { createClient } from "@/lib/supabase/server";
import type { OrderWithItems } from "@/types";

export async function getAdminOrders() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("orders")
    .select(
      `*, order_items(*, product:products(id, name, slug, price))`,
    )
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data as OrderWithItems[];
}

export async function getOrderCounts() {
  const supabase = await createClient();
  const { data, error } = await supabase.from("orders").select("status");
  if (error) throw error;

  const counts = { total: data.length, pending: 0, confirmed: 0, completed: 0, cancelled: 0 };
  for (const row of data) {
    counts[row.status as keyof typeof counts]++;
  }
  return counts;
}

/** Sum of line-item prices for completed orders — shown on the admin dashboard. */
export async function getCompletedSalesTotal() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("order_items")
    .select("price, order:orders!inner(status)")
    .eq("order.status", "completed");

  if (error) throw error;
  return data.reduce((sum, row) => sum + Number(row.price), 0);
}
