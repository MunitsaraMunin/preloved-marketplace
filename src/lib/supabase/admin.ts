import "server-only";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";

/**
 * Service-role Supabase client. Bypasses Row Level Security entirely.
 *
 * `import "server-only"` makes bundling this into a Client Component a
 * build-time error, not just a code-review mistake.
 *
 * Use sparingly and only for operations that genuinely need to bypass RLS —
 * currently just removing files from Storage when an admin deletes a
 * product (src/app/admin/products/actions.ts). Every other mutation should
 * go through the request-scoped client in `./server` so Postgres RLS keeps
 * enforcing who can do what.
 */
export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRoleKey) {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY environment variables.",
    );
  }

  return createSupabaseClient<Database>(url, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
