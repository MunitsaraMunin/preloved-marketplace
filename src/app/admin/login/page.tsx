import type { Metadata } from "next";
import Link from "next/link";
import { LoginForm } from "@/components/admin/login-form";
import { SITE_NAME } from "@/lib/constants";

export const metadata: Metadata = {
  title: "Admin login",
  robots: { index: false, follow: false },
};

export default async function AdminLoginPage(props: PageProps<"/admin/login">) {
  const searchParams = await props.searchParams;
  const next = typeof searchParams.next === "string" ? searchParams.next : "/admin";

  return (
    <div className="flex min-h-screen items-center justify-center bg-neutral-50 px-4">
      <div className="w-full max-w-sm">
        <Link href="/" className="block text-center font-serif text-2xl text-neutral-900">
          {SITE_NAME}
        </Link>
        <p className="mt-1 text-center text-sm text-neutral-500">Admin sign in</p>

        <div className="mt-8 border border-neutral-200 bg-white p-6">
          <LoginForm next={next} />
        </div>
      </div>
    </div>
  );
}
