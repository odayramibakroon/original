import type { Locale } from "@/core/i18n/localized-text";
import { getPublicProducts } from "@/features/products/application/public-products";
import { toProductViewModel } from "@/features/products/application/get-products";
import { getPublicShell } from "@/features/site-settings/application/get-public-shell";

export type HomeViewModel = Awaited<ReturnType<typeof getHomeViewModel>>;

export async function getHomeViewModel(locale: Locale) {
  const [shell, products] = await Promise.all([getPublicShell(locale), getPublicProducts()]);
  return {
    locale, content: { ...shell.site, navigation: shell.navigation }, settings: shell.settings,
    products: products.slice(0, 8).map((product) => toProductViewModel(product, locale)),
  };
}
