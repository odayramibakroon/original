import { initializeApp, getApps } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore, Timestamp } from "firebase-admin/firestore";
import { seedProducts } from "../src/features/products/data/seed-products";
import { defaultSiteDocument } from "../src/features/site-settings/data/default-site-document";
import { siteDatabase } from "../src/core/firebase/site-database";

process.env.FIREBASE_AUTH_EMULATOR_HOST = "127.0.0.1:9099";
process.env.FIRESTORE_EMULATOR_HOST = "127.0.0.1:8080";
const app = getApps().find((item) => item.name === "cms-tests") ?? initializeApp({ projectId: "demo-originalcompany" }, "cms-tests");
export const db = siteDatabase(getFirestore(app));
export const auth = getAuth(app);
export const password = "Test-only-password-123!";

export async function seedFixtures() {
  for (const [uid, role] of [["test-admin", "admin"], ["test-visitor", "visitor"]]) {
    const existing = await auth.getUser(uid).catch((error) => { if (error.code === "auth/user-not-found") return null; throw error; });
    if (!existing) await auth.createUser({ uid, email: `${uid}@example.test`, password });
    await db.doc(`users/${uid}`).set({ role, active: true });
  }
  const initialized = await db.doc("system/e2eFixture").get();
  if (initialized.exists) return;
  const batch = db.batch();
  batch.set(getFirestore(app).doc("products/legacy"), { name: "Legacy system product", price: 5, isActive: true });
  batch.set(getFirestore(app).doc("users/test-visitor"), { role: "admin", active: true });
  const site = defaultSiteDocument();
  site.factory.imageUrl = "/og.jpg";
  batch.set(db.doc("siteContent/main"), site);
  const products = [...seedProducts, ...Array.from({ length: 8 }, (_, index) => ({ ...seedProducts[0], id: `test-catalog-${index}`, slug: `test-catalog-${index}`,
    name: { ar: `منتج اختبار ${index}`, en: `Test Product ${index}` }, sortOrder: index + 5 }))];
  for (const { id, ...product } of products) {
    batch.set(db.doc(`products/${id}`), { ...product, mainImage: "/og.jpg", images: ["/og.jpg"], createdAt: Timestamp.now() });
    batch.set(db.doc(`productSlugs/${product.slug}`), { productId: id });
  }
  batch.set(db.doc("system/e2eFixture"), { createdAt: Timestamp.now() });
  await batch.commit();
}
