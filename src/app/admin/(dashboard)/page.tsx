import Link from "next/link";
import type { Metadata } from "next";
import { StatCard } from "@/components/admin/stat-card";
import { Button } from "@/components/ui/button";
import { OrderStatusBadge } from "@/components/admin/order-status-badge";
import { getDashboardStats } from "@/lib/data/products";
import { getAdminOrders, getOrderCounts, getCompletedSalesTotal } from "@/lib/data/orders";
import { formatDateTime, formatPrice } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Dashboard",
  robots: { index: false, follow: false },
};

export default async function AdminDashboardPage() {
  const [productStats, orderCounts, salesTotal, orders] = await Promise.all([
    getDashboardStats(),
    getOrderCounts(),
    getCompletedSalesTotal(),
    getAdminOrders(),
  ]);

  const recentOrders = orders.slice(0, 5);

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="font-serif text-2xl text-neutral-900">Dashboard</h1>
        <Button asChild>
          <Link href="/admin/products/new">Add product</Link>
        </Button>
      </div>

      <div>
        <h2 className="mb-3 text-xs font-medium uppercase tracking-wide text-neutral-500">
          Products
        </h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          <StatCard label="Total" value={productStats.total} />
          <StatCard label="Available" value={productStats.available} />
          <StatCard label="Reserved" value={productStats.reserved} />
          <StatCard label="Sold" value={productStats.sold} />
          <StatCard label="Hidden" value={productStats.hidden} />
        </div>
      </div>

      <div>
        <h2 className="mb-3 text-xs font-medium uppercase tracking-wide text-neutral-500">
          Orders
        </h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          <StatCard label="Total orders" value={orderCounts.total} />
          <StatCard label="Pending" value={orderCounts.pending} />
          <StatCard label="Confirmed" value={orderCounts.confirmed} />
          <StatCard label="Completed" value={orderCounts.completed} />
          <StatCard label="Total sales" value={formatPrice(salesTotal)} />
        </div>
      </div>

      <div>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-xs font-medium uppercase tracking-wide text-neutral-500">
            Recent orders
          </h2>
          <Link href="/admin/orders" className="text-sm text-neutral-700 hover:text-neutral-900">
            View all →
          </Link>
        </div>

        {recentOrders.length === 0 ? (
          <div className="border border-neutral-200 bg-white p-6 text-sm text-neutral-500">
            No orders yet.
          </div>
        ) : (
          <div className="divide-y divide-neutral-100 border border-neutral-200 bg-white">
            {recentOrders.map((order) => (
              <div key={order.id} className="flex items-center justify-between gap-4 p-4">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-neutral-900">
                    {order.customer_name} — {order.order_items[0]?.product?.name ?? "Unknown item"}
                  </p>
                  <p className="text-xs text-neutral-500">{formatDateTime(order.created_at)}</p>
                </div>
                <OrderStatusBadge status={order.status} className="shrink-0" />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
