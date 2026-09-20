"use client";
import Image from "next/image";
import Link from "next/link";
import { useOptimistic, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { Plus, Pencil, ExternalLink, Search } from "lucide-react";
import type { Product } from "../../domain/Product";
import { pickLocalized, type Locale } from "@/core/i18n/localized-text";
import { deleteProduct, setProductPublished } from "../../application/product-actions";
import { DeleteButton } from "@/shared/components/DeleteButton";

export function AdminProducts({ products }: { products: Product[] }) {
  const t = useTranslations("cms");
  const locale = useLocale() as Locale;
  const router = useRouter();
  const [query, setQuery] = useState(""); const [status, setStatus] = useState(""); const [sort, setSort] = useState("order"); const [page, setPage] = useState(1);
  const [pending, startTransition] = useTransition(); const [message, setMessage] = useState("");
  const [optimisticProducts, setOptimisticPublished] = useOptimistic(products,
    (current, update: { id: string; published: boolean }) => current.map((product) => product.id === update.id ? { ...product, isPublished: update.published } : product));
  const filtered = optimisticProducts.filter((product) => `${product.name.ar} ${product.name.en} ${product.category.ar} ${product.category.en}`.toLowerCase().includes(query.toLowerCase()) &&
    (!status || product.isPublished === (status === "published")));
  filtered.sort((a, b) => sort === "order" ? a.sortOrder - b.sortOrder : pickLocalized(a.name, locale).localeCompare(pickLocalized(b.name, locale), locale) * (sort === "nameDesc" ? -1 : 1));
  const pages = Math.max(1, Math.ceil(filtered.length / 20)); const current = Math.min(page, pages);
  return <>
    <div className="admin-heading"><h1>{t("products")}</h1><Link className="admin-button primary" href="/admin/products/new"><Plus size={17} />{t("newProduct")}</Link></div>
    <div className="admin-toolbar"><label className="admin-search"><Search size={17} /><input aria-label={t("search")} placeholder={t("search")} type="search" value={query} onChange={(event) => { setQuery(event.target.value); setPage(1); }} /></label>
      <select aria-label={t("publishing")} value={status} onChange={(event) => { setStatus(event.target.value); setPage(1); }}><option value="">{t("all")}</option><option value="published">{t("published")}</option><option value="draft">{t("draft")}</option></select>
      <select aria-label={t("sort")} value={sort} onChange={(event) => setSort(event.target.value)}>{["order", "nameAsc", "nameDesc"].map((item) => <option key={item} value={item}>{t(item)}</option>)}</select>
    </div>
    {message && <p role="status">{message}</p>}
    {!filtered.length ? <p className="admin-empty">{t("empty")}</p> : <div className="admin-table-wrap"><table className="admin-table"><thead><tr>{["fields.name", "fields.category", "fields.pieces", "fields.sortOrder", "published", "actions"].map((key) => <th key={key}>{t(key)}</th>)}</tr></thead>
      <tbody>{filtered.slice((current - 1) * 20, current * 20).map((product) => <tr key={product.id}>
        <td><Link className="admin-product-name" href={`/admin/products/${product.id}/edit`}><Image src={product.mainImage} alt="" width={44} height={44} /><span>{pickLocalized(product.name, locale)}</span></Link></td>
        <td>{pickLocalized(product.category, locale)}</td><td>{product.pieces}</td><td>{product.sortOrder}</td>
        <td><input type="checkbox" role="switch" checked={product.isPublished} disabled={pending} aria-label={`${t("fields.isPublished")} ${pickLocalized(product.name, locale)}`} onChange={(event) => {
          const published = event.target.checked;
          startTransition(async () => {
            setOptimisticPublished({ id: product.id, published }); setMessage("");
            try { const result = await setProductPublished(product.id, published); setMessage(result.message); if (result.ok) router.refresh(); }
            catch { setMessage(t("error")); }
          });
        }} /></td>
        <td><div className="admin-actions"><Link className="admin-icon" href={`/admin/products/${product.id}/edit`} title={t("edit")} aria-label={t("edit")}><Pencil size={16} /></Link>
          {product.isPublished && <Link className="admin-icon" href={`/products/${product.slug}`} target="_blank" title={t("view")} aria-label={t("view")}><ExternalLink size={16} /></Link>}
          <DeleteButton action={() => deleteProduct(product.id)} onDeleted={() => router.refresh()} />
        </div></td>
      </tr>)}</tbody>
    </table></div>}
    {pages > 1 && <div className="admin-pagination"><button className="admin-button" disabled={current === 1} onClick={() => setPage(current - 1)}>{t("previous")}</button><span>{t("page", { current, total: pages })}</span><button className="admin-button" disabled={current === pages} onClick={() => setPage(current + 1)}>{t("next")}</button></div>}
  </>;
}
