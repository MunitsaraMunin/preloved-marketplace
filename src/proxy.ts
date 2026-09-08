import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import type { Database } from "@/types/database";

const ADMIN_LOGIN_PATH = "/admin/login";

/**
 * Runs on every request (see `config.matcher` below).
 *
 * Two jobs:
 * 1. Refresh the Supabase session cookie so it never silently expires
 *    mid-visit (required whenever you read the session in Server
 *    Components, which can't write cookies themselves).
 * 2. Gate `/admin/*` behind an authenticated admin session, redirecting
 *    anonymous visitors to the login screen — this is the outer layer of
 *    defense; every Server Action also re-checks `is_admin()` itself (see
 *    src/lib/auth.ts) since proxy coverage alone is not sufficient (per the
 *    Next.js docs) for Server Function calls.
 */
export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          );
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const isAdminRoute = request.nextUrl.pathname.startsWith("/admin");
  const isLoginRoute = request.nextUrl.pathname === ADMIN_LOGIN_PATH;

  if (isAdminRoute && !isLoginRoute && !user) {
    const loginUrl = new URL(ADMIN_LOGIN_PATH, request.url);
    loginUrl.searchParams.set("next", request.nextUrl.pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (isLoginRoute && user) {
    return NextResponse.redirect(new URL("/admin", request.url));
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
