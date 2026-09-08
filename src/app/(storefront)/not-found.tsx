import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/shop/empty-state";

export default async function StorefrontNotFound() {
  const t = await getTranslations("notFound");

  return (
    <div className="mx-auto max-w-7xl px-4 py-24 sm:px-6 lg:px-8">
      <EmptyState title={t("title")} description={t("description")} />
      <div className="mt-6 flex justify-center">
        <Button asChild variant="outline">
          <Link href="/shop">{t("back")}</Link>
        </Button>
      </div>
    </div>
  );
}
