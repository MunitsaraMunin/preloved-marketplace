import Link from "next/link";
import { getTranslations } from "next-intl/server";

export default async function NotFound() {
  const t = await getTranslations("notFound");

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-3 text-center">
      <p className="font-serif text-2xl text-neutral-900">{t("title")}</p>
      <Link href="/" className="text-sm text-neutral-600 underline underline-offset-4">
        {t("back")}
      </Link>
    </div>
  );
}
