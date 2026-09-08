"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import type { OrderStatus } from "@/types";

export async function updateOrderStatus(orderId: string, status: OrderStatus): Promise<void> {
  const { supabase } = await requireAdmin();

  const { error } = await supabase.from("orders").update({ status }).eq("id", orderId);
  if (error) throw new Error(error.message);

  revalidatePath("/admin/orders");
  revalidatePath("/admin");
}
