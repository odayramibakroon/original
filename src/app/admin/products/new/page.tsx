import { getTranslations } from "next-intl/server";
import { authorizeAdminPage } from "@/features/admin/application/authorize-page";
import { ProductEditor } from "@/features/products/presentation/components/ProductEditor";
import { emptyProduct } from "@/features/products/domain/product-schema";

export default async function NewProduct() {
  await authorizeAdminPage("/admin/products/new");
  return <><h1>{(await getTranslations("cms"))("newProduct")}</h1><ProductEditor initial={emptyProduct} /></>;
}
