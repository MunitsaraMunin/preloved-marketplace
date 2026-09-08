import "server-only";
import { createClient } from "@/lib/supabase/server";

export class UnauthorizedError extends Error {
  constructor(message = "You must be signed in as an admin to do that.") {
    super(message);
    this.name = "UnauthorizedError";
  }
}

/**
 * Verifies the current request belongs to an authenticated admin.
 *
 * This is a defense-in-depth check for friendlier error messages — Postgres
 * RLS (see supabase/migrations/0002_rls_and_functions.sql, `is_admin()`) is
 * the actual source of truth and will reject unauthorized writes even if
 * this check were skipped, per the Next.js Server Actions security
 * guidance: proxy/middleware coverage is not enough on its own.
 */
export async function requireAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new UnauthorizedError();
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "admin") {
    throw new UnauthorizedError();
  }

  return { supabase, user };
}
