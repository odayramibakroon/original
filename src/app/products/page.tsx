import Link from "next/link";
import { getLocale, getTranslations } from "next-intl/server";
import type { Locale } from "@/core/i18n/localized-text";
import { getPublicShell } from "@/features/site-settings/application/get-public-shell";
import { getPublicProducts } from "@/features/products/application/public-products";
import { toProductViewModel } from "@/features/products/application/get-products";
import { filterProducts } from "@/features/products/application/filter-products";
import { PublicFrame } from "@/shared/components/PublicFrame";
import { ProductGrid } from "@/features/products/presentation/components/ProductGrid";
import { CatalogFilters } from "@/features/products/presentation/components/CatalogFilters";

export async function generateMetadata() { return { title: (await getTranslations("catalog"))("title") }; }

export default async function Products({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const locale = await getLocale() as Locale;
  const t = await getTranslations("catalog");
  const [shell, products, parameters] = await Promise.all([getPublicShell(locale), getPublicProducts(), searchParams]);
  const value = (key: string) => typeof parameters[key] === "string" ? (parameters[key] as string).slice(0, 200) : "";
  const query = value("q"); const category = value("category"); const sort = value("sort");
  const localized = products.map((product) => toProductViewModel(product, locale));
  const filtered = filterProducts(localized, query, category, sort, locale);
  const categories = [...new Map(localized.map((product) => [product.categoryKey, product.category])).entries()];
  const pages = Math.max(1, Math.ceil(filtered.length / 16));
  const page = Math.max(1, Math.min(pages, Number.parseInt(value("page"), 10) || 1));
  const pageUrl = (number: number) => `/products?${new URLSearchParams({ q: query, category, sort, page: String(number) })}`;
  return <PublicFrame shell={shell}><div className="container">
    <h1 className="catalog-title">{t("title")}</h1>
    <CatalogFilters initial={{ q: query, category, sort }} categories={categories} />
    <p className="catalog-count" role="status">{t("results", { count: filtered.length })}</p>
    {filtered.length ? <ProductGrid products={filtered.slice((page - 1) * 16, page * 16)} /> : <p className="catalog-empty">{t("empty")}</p>}
    {pages > 1 && <nav className="catalog-pagination">
      {page > 1 && <Link className="btn" href={pageUrl(page - 1)}>{t("previous")}</Link>}
      <span>{t("page", { current: page, total: pages })}</span>
      {page < pages && <Link className="btn" href={pageUrl(page + 1)}>{t("next")}</Link>}
    </nav>}
  </div></PublicFrame>;
}
