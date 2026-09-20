import { authorizeAdminPage } from "@/features/admin/application/authorize-page";
import { AdminUnavailable } from "@/features/admin/presentation/AdminUnavailable";
import { AdminProducts } from "@/features/products/presentation/components/AdminProducts";
import { FirestoreProductRepository } from "@/features/products/infrastructure/firestore-product-repository";
import { logger } from "@/core/logger";

export default async function Products() {
  await authorizeAdminPage("/admin/products");
  let products;
  try { products = await new FirestoreProductRepository().list(); }
  catch { logger.error("Could not load admin products."); return <AdminUnavailable />; }
  return <AdminProducts products={products} />;
}
