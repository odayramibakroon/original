import Image from "next/image";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { getTranslations } from "next-intl/server";
import type { ProductViewModel } from "../../domain/Product";

export async function ProductGrid({ products, home = false }: { products: ProductViewModel[]; home?: boolean }) {
  const t = await getTranslations("catalog");
  return <div className={`product-grid ${home ? "home-products-grid" : ""}`}>
    {products.map((product) => <Link href={`/products/${product.slug}`} className="product-card" key={product.id}>
      <Image src={product.mainImage} alt={product.name} fill sizes="(max-width: 760px) 50vw, 25vw" />
      <span className="product-overlay">
        <span className="product-arrow" aria-hidden="true"><ArrowLeft size={18} /></span>
        <span className="product-category">{product.category}</span>
        <span className="product-name">{product.name}</span>
        <span className="product-small">{t("piecesValue", { count: product.pieces })}</span>
      </span>
    </Link>)}
  </div>;
}
