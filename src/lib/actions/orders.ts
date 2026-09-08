"use server";

import { getTranslations } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";
import { orderSchema } from "@/lib/validations/order";

/**
 * The single write path for customers placing an order. Delegates to the
 * `create_order` Postgres function (supabase/migrations/0002_rls_and_functions.sql),
 * which locks the product row and re-checks availability inside the
 * transaction — so this action can never successfully reserve an item that
 * another customer just bought, even if two requests land at the same time.
 */
export async function createOrderAction(
  input: unknown,
): Promise<{ orderId: string } | { error: string }> {
  const t = await getTranslations("orderForm");

  const parsed = orderSchema.safeParse(input);
  if (!parsed.success) {
    return { error: t("errorInvalidDetails") };
  }

  const { productId, customerName, contactMethod, contactValue, message } = parsed.data;
  const supabase = await createClient();

  const { data, error } = await supabase.rpc("create_order", {
    p_product_id: productId,
    p_customer_name: customerName,
    p_contact_method: contactMethod,
    p_contact_value: contactValue,
    p_message: message || null,
  });

  if (error) {
    if (error.code === "P0001") {
      return { error: t("errorItemUnavailable") };
    }
    if (error.code === "P0002") {
      return { error: t("errorItemNotFound") };
    }
    return { error: t("genericError") };
  }

  return { orderId: data as string };
}
