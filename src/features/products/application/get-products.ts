import { pickLocalized, type Locale } from "@/core/i18n/localized-text";
import type {
  Product,
  ProductRepository,
  ProductViewModel,
} from "@/features/products/domain/Product";

export function toProductViewModel(
  product: Product,
  locale: Locale,
): ProductViewModel {
  return {
    id: product.id,
    slug: product.slug,
    name: pickLocalized(product.name, locale),
    category: pickLocalized(product.category, locale),
    shortDescription: pickLocalized(product.shortDescription, locale),
    description: pickLocalized(product.description, locale),
    pieces: product.pieces,
    categoryKey: product.category.en,
    weight: pickLocalized(product.weight, locale),
    pack: pickLocalized(product.pack, locale),
    type: pickLocalized(product.type, locale),
    features: product.features.map((feature) => pickLocalized(feature, locale)),
    ingredients: pickLocalized(product.ingredients, locale),
    images: product.images,
    mainImage: product.mainImage,
  };
}

export async function getPublishedProducts(
  repository: ProductRepository,
  locale: Locale,
) {
  const products = await repository.listPublished();

  return products.map((product) => toProductViewModel(product, locale));
}
