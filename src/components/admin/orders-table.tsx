import Link from "next/link";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { OrderStatusSelect } from "@/components/admin/order-status-select";
import { CONTACT_METHOD_LABELS } from "@/lib/constants";
import { formatDateTime, formatPrice } from "@/lib/utils";
import type { OrderWithItems } from "@/types";

export function OrdersTable({ orders }: { orders: OrderWithItems[] }) {
  if (orders.length === 0) {
    return (
      <div className="border border-neutral-200 bg-white p-10 text-center">
        <p className="font-serif text-lg text-neutral-900">No orders yet.</p>
        <p className="mt-1 text-sm text-neutral-500">
          Requests customers send from a product page will show up here.
        </p>
      </div>
    );
  }

  return (
    <div className="border border-neutral-200 bg-white">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="pl-4">Item</TableHead>
            <TableHead>Customer</TableHead>
            <TableHead>Contact</TableHead>
            <TableHead>Message</TableHead>
            <TableHead>Date</TableHead>
            <TableHead className="pr-4">Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {orders.map((order) => {
            const item = order.order_items[0];
            return (
              <TableRow key={order.id}>
                <TableCell className="pl-4">
                  {item?.product ? (
                    <Link
                      href={`/product/${item.product.id}`}
                      target="_blank"
                      className="text-sm font-medium text-neutral-900 hover:underline"
                    >
                      {item.product.name}
                    </Link>
                  ) : (
                    <span className="text-sm text-neutral-500">Item removed</span>
                  )}
                  {item && (
                    <p className="text-xs text-neutral-500">{formatPrice(item.price)}</p>
                  )}
                </TableCell>
                <TableCell className="whitespace-nowrap text-sm text-neutral-900">
                  {order.customer_name}
                </TableCell>
                <TableCell className="whitespace-nowrap text-sm text-neutral-600">
                  {CONTACT_METHOD_LABELS[order.contact_method]}: {order.contact_value}
                </TableCell>
                <TableCell className="max-w-56 truncate text-sm text-neutral-500">
                  {order.message || "—"}
                </TableCell>
                <TableCell className="whitespace-nowrap text-sm text-neutral-500">
                  {formatDateTime(order.created_at)}
                </TableCell>
                <TableCell className="pr-4">
                  <OrderStatusSelect orderId={order.id} status={order.status} />
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
