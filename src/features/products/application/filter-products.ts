import type { ProductViewModel } from "../domain/Product";

const normalized = (text: string) => text.normalize("NFKD").replace(/[\u064b-\u065f\u0300-\u036f]/g, "").toLocaleLowerCase();

export function filterProducts(products: ProductViewModel[], query: string, category: string, sort: string, locale: string) {
  const search = normalized(query.trim());
  const filtered = products.filter((product) => (!category || product.categoryKey === category) &&
    (!search || normalized(`${product.name} ${product.description} ${product.category}`).includes(search)));
  if (sort === "name-asc" || sort === "name-desc") filtered.sort((a, b) => a.name.localeCompare(b.name, locale) * (sort === "name-desc" ? -1 : 1));
  return filtered;
}
