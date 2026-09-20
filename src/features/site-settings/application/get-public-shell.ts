import { getPublicSite } from "./public-site";
import { localizeObject } from "@/core/i18n/localize-object";
import type { Locale } from "@/core/i18n/localized-text";

export async function getPublicShell(locale: Locale) {
  const site = localizeObject(await getPublicSite(), locale);
  return {
    site,
    navigation: { ...site.navigation, logoText: site.settings.factoryName },
    settings: { ...site.settings, branches: site.branches.items, socials: site.socials.items },
  };
}
