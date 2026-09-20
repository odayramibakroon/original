import "server-only";
import { FieldValue } from "firebase-admin/firestore";
import { getAdminDb } from "@/core/firebase/admin";
import { seedProducts } from "@/features/products/data/seed-products";
import { defaultSiteDocument } from "@/features/site-settings/data/default-site-document";

export async function importOriginalContent(actor: string) {
  const db = getAdminDb();
  return db.runTransaction(async (transaction) => {
    const marker = db.doc("system/contentImport");
    const site = db.doc("siteContent/main");
    const refs = seedProducts.map((product) => db.doc(`products/${product.id}`));
    const slugs = seedProducts.map((product) => db.doc(`productSlugs/${product.slug}`));
    const [existingMarker, existingSite, ...documents] = await transaction.getAll(marker, site, ...refs, ...slugs);
    if (existingMarker.exists) return { alreadyImported: true, createdSite: false, createdProducts: 0 };
    if (!existingSite.exists) transaction.create(site, { ...defaultSiteDocument(), updatedBy: actor, updatedAt: FieldValue.serverTimestamp() });
    let createdProducts = 0;
    seedProducts.forEach(({ id, ...product }, index) => {
      if (!documents[index].exists && !documents[index + refs.length].exists) {
        transaction.create(refs[index], { ...product, createdAt: FieldValue.serverTimestamp(), updatedAt: FieldValue.serverTimestamp(), updatedBy: actor });
        transaction.create(slugs[index], { productId: id });
        createdProducts++;
      }
    });
    transaction.create(marker, { createdAt: FieldValue.serverTimestamp(), createdBy: actor });
    return { alreadyImported: false, createdSite: !existingSite.exists, createdProducts };
  });
}
