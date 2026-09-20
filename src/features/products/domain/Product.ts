import type { LocalizedText } from "@/core/i18n/localized-text";

export type Product = {
  id: string;
  slug: string;
  name: LocalizedText;
  category: LocalizedText;
  shortDescription: LocalizedText;
  description: LocalizedText;
  pieces: number;
  weight: LocalizedText;
  pack: LocalizedText;
  type: LocalizedText;
  features: LocalizedText[];
  ingredients: LocalizedText;
  images: string[];
  mainImage: string;
  isPublished: boolean;
  sortOrder: number;
};

export type ProductViewModel = {
  id: string;
  slug: string;
  name: string;
  category: string;
  shortDescription: string;
  description: string;
  pieces: number;
  categoryKey: string;
  weight: string;
  pack: string;
  type: string;
  features: string[];
  ingredients: string;
  images: string[];
  mainImage: string;
};

export interface ProductRepository {
  listPublished(): Promise<Product[]>;
}
