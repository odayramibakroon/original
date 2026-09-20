import Link from "next/link";
import { notFound } from "next/navigation";
import { getLocale, getTranslations } from "next-intl/server";
import type { Locale } from "@/core/i18n/localized-text";
import { getPublicProducts } from "@/features/products/application/public-products";
import { toProductViewModel } from "@/features/products/application/get-products";
import { getPublicShell } from "@/features/site-settings/application/get-public-shell";
import { PublicFrame } from "@/shared/components/PublicFrame";
import { ProductGallery } from "@/features/products/presentation/components/ProductGallery";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const product = (await getPublicProducts()).find((item) => item.slug === slug);
  if (!product) return {};
  const view = toProductViewModel(product, await getLocale() as Locale);
  return { title: view.name, description: view.shortDescription, openGraph: { title: view.name, description: view.shortDescription, images: [view.mainImage] } };
}

export default async function ProductDetails({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const locale = await getLocale() as Locale;
  const [products, shell, t] = await Promise.all([getPublicProducts(), getPublicShell(locale), getTranslations("catalog")]);
  const product = products.find((item) => item.slug === slug);
  if (!product) notFound();
  const view = toProductViewModel(product, locale);
  return <PublicFrame shell={shell}><div className="container">
    <nav className="product-breadcrumb"><Link href="/">{t("home")}</Link><span>/</span><Link href="/products">{t("back")}</Link><span>/</span><span>{view.name}</span></nav>
    <article className="product-detail">
      <ProductGallery images={view.images} mainImage={view.mainImage} name={view.name} />
      <div className="product-detail-copy"><p className="section-label">{view.category}</p><h1>{view.name}</h1><p>{view.description}</p>
        <dl className="product-specs"><div><dt>{t("pieces")}</dt><dd>{view.pieces}</dd></div>
          {(["weight", "pack", "type"] as const).map((key) => view[key] && <div key={key}><dt>{t(key)}</dt><dd>{view[key]}</dd></div>)}
        </dl>
        {view.features.length > 0 && <section><h2>{shell.site.products.modalFeaturesTitle}</h2><ul>{view.features.map((feature) => <li key={feature}>{feature}</li>)}</ul></section>}
        {view.ingredients && <section><h2>{shell.site.products.modalIngredientsTitle}</h2><p>{view.ingredients}</p></section>}
      </div>
    </article>
  </div></PublicFrame>;
}
