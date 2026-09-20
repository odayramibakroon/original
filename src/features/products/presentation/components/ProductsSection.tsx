import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import type { ProductViewModel } from "../../domain/Product";
import { ProductGrid } from "./ProductGrid";

export function ProductsSection({ products, content }: {
  products: ProductViewModel[];
  content: { label: string; title: string; description: string; showAll: string };
}) {
  return <section className="section products-section" id="products">
    <div className="container">
      <div className="section-head">
        <div><div className="section-label">{content.label}</div><h2 className="section-title">{content.title}</h2></div>
        <p className="section-description">{content.description}</p>
      </div>
      <ProductGrid products={products.slice(0, 8)} home />
      <div className="products-action"><Link className="btn btn-orange" href="/products">{content.showAll}<ArrowLeft size={16} /></Link></div>
    </div>
  </section>;
}
