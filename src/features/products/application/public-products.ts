import "server-only";
import { unstable_cache } from "next/cache";
import { isAdminConfigured } from "@/core/firebase/admin";
import { SITE_DOCUMENT_PATH } from "@/core/firebase/site-database";
import { seedProducts } from "../data/seed-products";
import { FirestoreProductRepository } from "../infrastructure/firestore-product-repository";

const readPublished = unstable_cache(() => new FirestoreProductRepository().listPublished(), [SITE_DOCUMENT_PATH, "published-products"], { tags: ["products"], revalidate: 60 });

export async function getPublicProducts() {
  if (!isAdminConfigured()) return seedProducts.filter((product) => product.isPublished).toSorted((a, b) => a.sortOrder - b.sortOrder);
  return readPublished();
}
