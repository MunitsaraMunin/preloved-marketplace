import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { SITE_DESCRIPTION, SITE_NAME } from "@/lib/constants";

export async function Footer() {
  const t = await getTranslations("footer");

  return (
    <footer className="border-t border-neutral-200">
      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-12 sm:px-6 md:grid-cols-3 lg:px-8">
        <div>
          <p className="font-serif text-xl text-neutral-900">{SITE_NAME}</p>
          <p className="mt-2 max-w-xs text-sm text-neutral-500">{SITE_DESCRIPTION}</p>
        </div>

        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-neutral-400">
            {t("shopHeading")}
          </p>
          <ul className="mt-3 space-y-2 text-sm text-neutral-600">
            <li>
              <Link href="/shop" className="transition-colors hover:text-neutral-900">
                {t("allPieces")}
              </Link>
            </li>
            <li>
              <Link
                href="/shop?sort=newest"
                className="transition-colors hover:text-neutral-900"
              >
                {t("newArrivals")}
              </Link>
            </li>
          </ul>
        </div>

        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-neutral-400">
            {t("infoHeading")}
          </p>
          <ul className="mt-3 space-y-2 text-sm text-neutral-600">
            <li>
              <Link href="/about" className="transition-colors hover:text-neutral-900">
                {t("about")}
              </Link>
            </li>
          </ul>
        </div>
      </div>
      <div className="border-t border-neutral-200 py-6 text-center text-xs text-neutral-400">
        © {new Date().getFullYear()} {SITE_NAME}. {t("copyright")}
      </div>
    </footer>
  );
}
