import { cookies } from "next/headers";
import { getRequestConfig } from "next-intl/server";
import { defaultLocale, isLocale, LOCALE_COOKIE } from "./config";

/**
 * No `[locale]` URL segment on purpose — the storefront is translated but
 * every route keeps a single URL (per product decision: this is a one-seller
 * MVP, not a multi-region storefront, so URL-per-locale SEO isn't worth the
 * app/ restructure it would take). The active language lives in a cookie
 * instead; see src/components/layout/language-switcher.tsx.
 */
export default getRequestConfig(async () => {
  const cookieStore = await cookies();
  const cookieLocale = cookieStore.get(LOCALE_COOKIE)?.value;
  const locale = isLocale(cookieLocale) ? cookieLocale : defaultLocale;

  return {
    locale,
    messages: (await import(`../messages/${locale}.json`)).default,
  };
});
