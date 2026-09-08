import type { Metadata } from "next";
import { OrdersTable } from "@/components/admin/orders-table";
import { getAdminOrders } from "@/lib/data/orders";

export const metadata: Metadata = {
  title: "Orders",
  robots: { index: false, follow: false },
};

export default async function AdminOrdersPage() {
  const orders = await getAdminOrders();

  return (
    <div className="space-y-6">
      <h1 className="font-serif text-2xl text-neutral-900">Orders</h1>
      <OrdersTable orders={orders} />
    </div>
  );
}
