# Preloved — a real-time secondhand clothing marketplace

A production-quality MVP for a curated secondhand clothing storefront, built with Next.js
and Supabase. One seller manages inventory from an admin dashboard; the public storefront
reflects every change — sold, hidden, restocked, edited — **in real time**, with no page
refresh, powered by Supabase Realtime.

> **Status: Version 1** — single seller, manual product management, simple "contact to buy"
> orders. See [Roadmap](#roadmap) for where this is headed.

## Table of contents

- [Features](#features)
- [Tech stack](#tech-stack)
- [Architecture](#architecture)
- [Database structure](#database-structure)
- [Realtime architecture](#realtime-architecture)
- [Authentication & authorization](#authentication--authorization)
- [Project structure](#project-structure)
- [Local development](#local-development)
- [Supabase setup](#supabase-setup)
- [Environment variables](#environment-variables)
- [Deployment](#deployment)
- [Roadmap](#roadmap)

## Features

**Storefront**
- Home, shop grid, product detail, about pages — minimal, warm-neutral, fashion-first design
- Search (name, brand, description) and filters (category, size, price, condition, brand, color)
- Sort by newest / price
- 5 broad categories (Tops, Pants, Skirts, Dresses, Other) — kept deliberately short so
  first-time shoppers aren't faced with a long list before reaching the product grid
- **Live inventory** — a product that's marked sold, hidden, restocked or edited by the
  admin updates on every open storefront tab instantly, including a product detail page a
  customer is actively viewing
- Swipeable multi-photo gallery with a tap-to-expand lightbox — built mobile/tablet-first,
  since that's how most shoppers actually browse
- **English / Thai language switcher** — the entire storefront (not the admin dashboard) is
  translated via [next-intl](https://next-intl.dev); the active language is remembered in a
  cookie, no `/en` or `/th` URL prefix
- Lightweight "contact to buy" order flow — no payment integration in V1
- SEO: per-product metadata, Open Graph tags, JSON-LD product structured data, sitemap.xml, robots.txt
- Accessible: semantic HTML, keyboard-navigable filters/menus/dialogs, status is never
  color-only, focus states throughout

**Admin (`/admin`, authenticated)**
- Dashboard with product and order counts, total completed sales
- Product table with live status badges, quick status changes, and delete (with confirmation)
- Product create/edit forms with drag-and-drop multi-image upload to Supabase Storage,
  primary-photo selection, and per-photo delete
- Orders list with a status workflow (pending → confirmed → completed / cancelled)

## Tech stack

| Layer | Choice |
| --- | --- |
| Framework | [Next.js](https://nextjs.org) (App Router, Server Components, Server Actions) |
| Language | TypeScript (strict mode) |
| Styling | Tailwind CSS v4 + [shadcn/ui](https://ui.shadcn.com)-style primitives (Radix UI) |
| Database | Supabase Postgres |
| Realtime | Supabase Realtime (`postgres_changes`) |
| Auth | Supabase Auth |
| File storage | Supabase Storage |
| Forms & validation | react-hook-form + Zod |
| i18n | [next-intl](https://next-intl.dev) (English / Thai, cookie-based) |
| Deployment | Vercel |

## Architecture

Version 1 is intentionally simple — one seller, no payments — but the schema and auth model
are shaped so a multi-seller marketplace doesn't require a rewrite:

- Products belong to a `sellers` row, not a hardcoded admin ID. Adding seller signup in a
  future version means adding rows and routes, not migrating `products`.
- `profiles.role` already distinguishes `admin` from `customer`, ready for real customer
  accounts.
- Postgres is always the source of truth for availability — Row Level Security and a single
  atomic `create_order()` function enforce it, not the frontend. See
  [Realtime architecture](#realtime-architecture) and
  [Race condition handling](#preventing-double-orders) below.

## Database structure

```
profiles        — one row per auth.users row; role = admin | customer
sellers         — one row in V1 (the site owner); products reference sellers, not users
categories      — Tops, Pants, Skirts, Dresses, Other
products        — the catalog; status = available | reserved | sold | hidden
product_images  — one-to-many, ordered, one flagged is_primary
orders          — a customer's contact request (no accounts, no payment)
order_items     — links an order to the product it's for
```

Full DDL, indexes, constraints, triggers and RLS policies live in
[`supabase/migrations`](./supabase/migrations):

- [`0001_init_schema.sql`](./supabase/migrations/0001_init_schema.sql) — tables, enums,
  indexes (including a `tsvector` full-text search index on products), and triggers
  (`updated_at` maintenance, auto-creating a `profiles` row on signup, keeping `sold_at` in
  sync with `status`)
- [`0002_rls_and_functions.sql`](./supabase/migrations/0002_rls_and_functions.sql) — Row
  Level Security policies and `create_order()`, the one atomic entry point for placing an
  order
- [`0003_storage_and_realtime.sql`](./supabase/migrations/0003_storage_and_realtime.sql) —
  the `product-images` Storage bucket and its policies, plus adding tables to the
  `supabase_realtime` publication
- [`0004_simplify_categories.sql`](./supabase/migrations/0004_simplify_categories.sql) —
  consolidates the original 10-category taxonomy down to 5, reassigning any existing
  products onto their merged category rather than dropping them

### Preventing double orders

Each garment is one-of-a-kind (`quantity` is constrained to `0` or `1`). Two customers
clicking "buy" on the same item at the same moment must never both succeed. `create_order()`
handles this inside a single transaction:

```sql
select status, price into v_status, v_price
from public.products
where id = p_product_id
for update;                       -- locks the row; a concurrent call queues here

if v_status <> 'available' then
  raise exception 'This item is no longer available';
end if;

insert into public.orders (...);
insert into public.order_items (...);
update public.products set status = 'reserved' where id = p_product_id;
```

`order_items.product_id` also carries a `unique` constraint as a second line of defense.
The frontend never decides availability — it calls this function and shows whatever it
returns.

## Realtime architecture

The storefront subscribes to Postgres changes directly via Supabase Realtime — no polling.

1. **Client subscribes**: `src/hooks/use-realtime-products.ts` (grids) and
   `use-realtime-product.ts` (a single product page) open a
   `supabase.channel(...).on('postgres_changes', ...)` subscription to the `products` table
   (and `product_images`, so edited photos propagate too).
2. **Postgres emits a change**: an `UPDATE`, `INSERT` or `DELETE` on `products` — an admin
   marking an item sold, restocking it, editing its price, or deleting it.
3. **Realtime authorizes the event against RLS**: Supabase Realtime re-checks the
   subscriber's Row Level Security policies before delivering each event. Because `products`
   already has a *"public reads non-hidden products"* policy, an anonymous storefront client
   is structurally incapable of receiving an event for a HIDDEN product — hiding an item
   makes it disappear from every open tab without any client-side filtering logic.
4. **The hook refetches just that row** (with its images/category joined) and updates React
   state — removing it from the grid if it's no longer available, or updating it in place if
   it's still visible.
5. **Cleanup**: every hook returns a cleanup function that calls
   `supabase.removeChannel(channel)` on unmount, so navigating away never leaks a
   subscription.

The product detail page (`/product/[id]`) uses the same mechanism: if the item you're
looking at gets marked SOLD by the admin in another tab, your page updates within the same
second — the "Buy" button disables itself and a "This item has already been sold" message
appears, without a refresh. If the product is deleted outright, the page shows a graceful
"no longer available" state instead of breaking.

The admin product table subscribes the same way (`onlyAvailable: false`), so a sale showing
up in one browser tab is visible in another admin tab immediately too — useful when checking
your own changes took effect.

## Authentication & authorization

- **Customers**: no account needed. Browsing, searching and placing an order request are
  all anonymous.
- **Admin**: Supabase Auth email/password. `src/proxy.ts` (this Next.js version renamed
  `middleware.ts` → `proxy.ts`) refreshes the session cookie on every request and redirects
  unauthenticated visitors away from `/admin/*`.
- **Defense in depth**: proxy-level gating is the outer layer only. Every Server Action that
  mutates data calls `requireAdmin()` (`src/lib/auth.ts`), which independently re-checks the
  session and `profiles.role`. Underneath both of those, **Postgres Row Level Security is
  the real authority** — `supabase/migrations/0002_rls_and_functions.sql` — so even a bug in
  the application layer can't grant unauthorized writes.
- Service-role credentials (`SUPABASE_SERVICE_ROLE_KEY`) are used in exactly one place —
  removing files from Storage after a product is deleted — and are never imported into
  client-side code (`src/lib/supabase/admin.ts` is guarded with `import "server-only"`).

## Project structure

```
src/
  app/
    (storefront)/          # public routes — share header/footer via this route group
      page.tsx              # home
      shop/page.tsx          # listing, search, filters
      product/[id]/page.tsx  # product detail
      about/page.tsx
    admin/
      login/                 # standalone, outside the dashboard chrome
      (dashboard)/           # sidebar-wrapped admin routes — URL is still /admin/*
        page.tsx              # dashboard
        products/              # list, new, [id]/edit
        orders/
      products/actions.ts    # product Server Actions (create/update/delete/status/images)
      orders/actions.ts       # order status Server Actions
    sitemap.ts, robots.ts
  components/
    product/    # image gallery + lightbox, buy panel, order form, status badge, measurements
    shop/       # product grid/card, filters, sort, category pills
    admin/      # product form, image uploader, tables, sidebar
    layout/     # header, footer, mobile nav, language switcher
    ui/         # shadcn-style primitives (button, dialog, select, table, …)
  hooks/        # use-realtime-product(s)
  i18n/         # next-intl request config + locale list (English / Thai)
  messages/     # en.json / th.json — storefront translation strings
  lib/
    supabase/   # browser / server / admin clients + shared query fragments
    data/       # server-only read queries (storefront + admin)
    actions/    # public Server Actions (placing an order)
    validations/# Zod schemas
  types/        # hand-written Database type + app-level view types
supabase/
  migrations/   # numbered SQL migrations (see above)
  seed.sql      # demo categories + products, and an admin-bootstrap script
```

## Local development

```bash
pnpm install
cp .env.example .env.local   # fill in your Supabase project values, see below
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) for the storefront and
[http://localhost:3000/admin/login](http://localhost:3000/admin/login) for the admin.

Other scripts: `pnpm build`, `pnpm start`, `pnpm lint`.

## Supabase setup

1. Create a project at [supabase.com](https://supabase.com).
2. Run the migrations, in order, against your project — either paste each file in
   `supabase/migrations/` into the Supabase SQL editor, or with the CLI:
   ```bash
   supabase link --project-ref <your-project-ref>
   supabase db push
   ```
3. Seed demo data (optional but recommended for a non-empty storefront):
   ```bash
   supabase db execute -f supabase/seed.sql
   ```
   This creates categories and demo products, but **does not** create an admin user — do
   that next.
4. **Create your admin account**:
   - Sign up a user any way you like — e.g. Supabase Studio → Authentication → Add user, or
     temporarily allow sign-ups and register through Supabase Auth directly.
   - Open `supabase/seed.sql`, set `v_admin_email` at the bottom to that user's email, and
     re-run the bootstrap `do $$ ... $$` block. This promotes the account to
     `role = 'admin'` and creates its `sellers` row (required before you can create
     products).
   - Sign in at `/admin/login` with that account.
5. Create a Storage bucket named `product-images` — migration `0003` does this
   automatically (`insert into storage.buckets ...`), so this step is usually already done
   once you've run the migrations.

## Environment variables

See [`.env.example`](./.env.example) for the full list. Copy it to `.env.local` and fill in
your Supabase project's values (Project Settings → API).

| Variable | Where it's safe | Notes |
| --- | --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Browser | Public — protected by RLS, not secrecy |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Browser | Public — same reasoning |
| `SUPABASE_SERVICE_ROLE_KEY` | Server only | Never prefix with `NEXT_PUBLIC_`, never commit |
| `NEXT_PUBLIC_SITE_URL` | Browser | Used for canonical URLs, sitemap, Open Graph |

`.env.local` is gitignored; `.env.example` is intentionally the one dotfile that **is**
committed, so anyone cloning the repo knows exactly what to configure.

## Deployment

1. Push this repository to GitHub.
2. Import it into [Vercel](https://vercel.com/new).
3. Add the environment variables above in the Vercel project settings (Production and
   Preview).
4. Set `NEXT_PUBLIC_SITE_URL` to your production domain.
5. Deploy. Supabase Realtime works over WebSockets from the browser directly to Supabase —
   no special Vercel configuration is required.

## Roadmap

**Version 1 (this repo)** — single seller, manual product management, realtime inventory,
simple contact-to-buy orders, admin dashboard.

**Version 2** — customer accounts, favorites, a real shopping cart, payment integration,
shipping management.

**Version 3** — multiple sellers: seller registration, seller dashboards, per-seller
storefronts, marketplace fees. The schema in `sellers`/`products` is already shaped for
this.

**Version 4** — reviews, recommendations, notifications, advanced search, analytics.

## License

[MIT](./LICENSE)
