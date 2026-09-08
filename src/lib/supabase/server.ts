import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import type { Database } from "@/types/database";

/**
 * Supabase client for Server Components, Server Actions, and Route
 * Handlers. Always create a fresh instance per request — never module-level
 * cache this, per the @supabase/ssr docs.
 *
 * Reads the caller's session from cookies, so all queries run with that
 * user's RLS permissions (anonymous visitor or authenticated admin).
 */
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            );
          } catch {
            // Called from a Server Component that can't set cookies (e.g. a
            // page render, not a Server Action). The proxy.ts session
            // refresh handles keeping the session cookie fresh instead.
          }
        },
      },
    },
  );
}
