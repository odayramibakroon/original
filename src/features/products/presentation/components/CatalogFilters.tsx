"use client";

import { LoaderCircle, Search, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { useLiveFilters } from "@/shared/hooks/useLiveFilters";

type Filters = { q: string; category: string; sort: string };
const empty: Filters = { q: "", category: "", sort: "" };

function catalogHref(values: Filters) {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(values)) if (value) params.set(key, value);
  return `/products${params.size ? `?${params}` : ""}`;
}

export function CatalogFilters({ initial, categories }: { initial: Filters; categories: [string, string][] }) {
  const t = useTranslations("catalog");
  const { values, change, pending, formProps } = useLiveFilters(initial, catalogHref);
  return <form className="catalog-filters" role="search" aria-busy={pending} {...formProps}>
    <label className="catalog-search"><span className="sr-only">{t("search")}</span>
      {pending ? <LoaderCircle size={18} className="spin" aria-hidden="true" /> : <Search size={18} aria-hidden="true" />}
      <input type="search" name="q" value={values.q} onChange={(event) => change({ q: event.target.value })} placeholder={t("search")} maxLength={200} />
    </label>
    <label><span id="catalog-category-label">{t("category")}</span><select aria-labelledby="catalog-category-label" name="category" value={values.category} onChange={(event) => change({ category: event.target.value }, true)}>
      <option value="">{t("allCategories")}</option>{categories.map(([key, label]) => <option key={key} value={key}>{label}</option>)}
    </select></label>
    <label><span id="catalog-sort-label">{t("sort")}</span><select aria-labelledby="catalog-sort-label" name="sort" value={values.sort} onChange={(event) => change({ sort: event.target.value }, true)}>
      <option value="">{t("defaultSort")}</option><option value="name-asc">{t("nameAsc")}</option><option value="name-desc">{t("nameDesc")}</option>
    </select></label>
    <button type="button" className="catalog-clear" disabled={!values.q && !values.category && !values.sort} onClick={() => change(empty, true)} title={t("clear")} aria-label={t("clear")}><X size={18} /></button>
  </form>;
}
