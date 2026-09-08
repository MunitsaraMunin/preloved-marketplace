import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { SITE_NAME } from "@/lib/constants";

export const metadata: Metadata = {
  title: "About",
  description: `The story behind ${SITE_NAME} — curated secondhand clothing, selected one piece at a time.`,
};

export default async function AboutPage() {
  const t = await getTranslations("about");

  return (
    <div className="mx-auto max-w-2xl px-4 py-16 sm:px-6 lg:px-8">
      <h1 className="font-serif text-4xl text-neutral-900">{t("title", { siteName: SITE_NAME })}</h1>
      <div className="mt-6 space-y-5 text-base leading-relaxed text-neutral-600">
        <p>{t("paragraph1", { siteName: SITE_NAME })}</p>
        <p>{t("paragraph2")}</p>
        <p>{t("paragraph3")}</p>
      </div>
    </div>
  );
}
