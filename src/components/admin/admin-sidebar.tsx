"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Package, ShoppingBag, LogOut, ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";
import { SITE_NAME } from "@/lib/constants";
import { signOut } from "@/app/admin/login/actions";

const NAV_ITEMS = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/products", label: "Products", icon: Package },
  { href: "/admin/orders", label: "Orders", icon: ShoppingBag },
] as const;

export function AdminSidebar({ email }: { email: string | null }) {
  const pathname = usePathname();

  return (
    <aside className="flex h-full w-full flex-col border-r border-neutral-200 bg-white p-4 lg:w-64">
      <Link href="/admin" className="px-2 py-2 font-serif text-lg text-neutral-900">
        {SITE_NAME} <span className="text-sm font-sans text-neutral-400">Admin</span>
      </Link>

      <nav className="mt-4 flex flex-1 flex-col gap-1">
        {NAV_ITEMS.map((item) => {
          const active = item.href === "/admin" ? pathname === "/admin" : pathname.startsWith(item.href);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-sm px-2.5 py-2.5 text-sm font-medium transition-colors",
                active
                  ? "bg-neutral-900 text-white"
                  : "text-neutral-700 hover:bg-neutral-100",
              )}
            >
              <Icon className="h-4 w-4" />
              {item.label}
            </Link>
          );
        })}

        <Link
          href="/shop"
          target="_blank"
          className="mt-2 flex items-center gap-3 rounded-sm px-2.5 py-2.5 text-sm text-neutral-500 transition-colors hover:bg-neutral-100 hover:text-neutral-900"
        >
          <ExternalLink className="h-4 w-4" />
          View storefront
        </Link>
      </nav>

      <div className="mt-4 border-t border-neutral-200 pt-4">
        {email && <p className="truncate px-2.5 text-xs text-neutral-400">{email}</p>}
        <form action={signOut}>
          <button
            type="submit"
            className="mt-1 flex w-full items-center gap-3 rounded-sm px-2.5 py-2.5 text-sm text-neutral-700 transition-colors hover:bg-neutral-100"
          >
            <LogOut className="h-4 w-4" />
            Sign out
          </button>
        </form>
      </div>
    </aside>
  );
}
