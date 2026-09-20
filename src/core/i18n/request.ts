import { cookies, headers } from "next/headers";
import { getRequestConfig } from "next-intl/server";
import { resolveLocale } from "./resolve-locale";
import { getPublicSite } from "@/features/site-settings/application/public-site";
import { logger } from "@/core/logger";
import type { Locale } from "./localized-text";

export default getRequestConfig(async () => {
  const [store, requestHeaders] = await Promise.all([cookies(), headers()]);
  let fallback: Locale = "ar";
  try { fallback = (await getPublicSite()).settings.defaultLocale; }
  catch { logger.warn("Could not load fallback locale."); }
  const locale = resolveLocale(store.get("NEXT_LOCALE")?.value, requestHeaders.get("accept-language"), fallback);
  return {
    locale,
    timeZone: "Asia/Riyadh",
    messages: {
      ...(await import(`../../../messages/${locale}.json`)).default,
      cms: (await import(`../../../messages/cms.${locale}.json`)).default,
      catalog: (await import(`../../../messages/catalog.${locale}.json`)).default,
    },
  };
});
