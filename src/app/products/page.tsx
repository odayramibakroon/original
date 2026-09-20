import Link from "next/link";
import { Search, SlidersHorizontal } from "lucide-react";
import { getLocale, getTranslations } from "next-intl/server";
import type { Locale } from "@/core/i18n/localized-text";
import { getPublicShell } from "@/features/site-settings/application/get-public-shell";
import { getPublicProducts } from "@/features/products/application/public-products";
import { toProductViewModel } from "@/features/products/application/get-products";
import { filterProducts } from "@/features/products/application/filter-products";
import { PublicFrame } from "@/shared/components/PublicFrame";
import { ProductGrid } from "@/features/products/presentation/components/ProductGrid";

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
    <form key={JSON.stringify([query, category, sort])} method="get" action="/products" className="catalog-filters">
      <label className="catalog-search"><span className="sr-only">{t("search")}</span><Search size={18} aria-hidden="true" />
        <input type="search" name="q" defaultValue={query} placeholder={t("search")} maxLength={200} />
      </label>
      <label><span id="catalog-category-label">{t("category")}</span><select aria-labelledby="catalog-category-label" name="category" defaultValue={category}><option value="">{t("allCategories")}</option>
        {categories.map(([key, label]) => <option key={key} value={key}>{label}</option>)}
      </select></label>
      <label><span id="catalog-sort-label">{t("sort")}</span><select aria-labelledby="catalog-sort-label" name="sort" defaultValue={sort}><option value="">{t("defaultSort")}</option><option value="name-asc">{t("nameAsc")}</option><option value="name-desc">{t("nameDesc")}</option></select></label>
      <button className="btn btn-orange" type="submit"><SlidersHorizontal size={17} />{t("searchButton")}</button>
      {(query || category || sort) && <Link href="/products">{t("clear")}</Link>}
    </form>
    <p className="catalog-count">{t("results", { count: filtered.length })}</p>
    {filtered.length ? <ProductGrid products={filtered.slice((page - 1) * 16, page * 16)} /> : <p className="catalog-empty">{t("empty")}</p>}
    {pages > 1 && <nav className="catalog-pagination">
      {page > 1 && <Link className="btn" href={pageUrl(page - 1)}>{t("previous")}</Link>}
      <span>{t("page", { current: page, total: pages })}</span>
      {page < pages && <Link className="btn" href={pageUrl(page + 1)}>{t("next")}</Link>}
    </nav>}
  </div></PublicFrame>;
}
