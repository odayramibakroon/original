import { getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";
import { authorizeAdminPage } from "@/features/admin/application/authorize-page";
import { ProductEditor } from "@/features/products/presentation/components/ProductEditor";
import { FirestoreProductRepository } from "@/features/products/infrastructure/firestore-product-repository";
import { documentIdSchema } from "@/core/validation/cms";
import { AdminUnavailable } from "@/features/admin/presentation/AdminUnavailable";
import { logger } from "@/core/logger";

export default async function EditProduct({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params; await authorizeAdminPage(`/admin/products/${id}/edit`);
  if (!documentIdSchema.safeParse(id).success) notFound();
  let product;
  try { product = await new FirestoreProductRepository().get(id); }
  catch { logger.error("Could not load product editor."); return <AdminUnavailable />; }
  if (!product) notFound();
  return <><h1>{(await getTranslations("cms"))("editProduct")}</h1><ProductEditor id={id} initial={product} /></>;
}
