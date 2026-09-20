import "server-only";
import { FieldValue } from "firebase-admin/firestore";
import { getAdminDb } from "@/core/firebase/admin";
import type { Product, ProductRepository } from "../domain/Product";
import { productSchema, type ProductInput } from "../domain/product-schema";
import { AppError, ErrorCode, normalizeError } from "@/core/errors";

export class FirestoreProductRepository implements ProductRepository {
  async setPublished(id: string, published: boolean, uid: string) {
    try {
      await getAdminDb().doc(`products/${id}`).update({ isPublished: published, updatedBy: uid, updatedAt: FieldValue.serverTimestamp() });
    } catch (error) { throw normalizeError(error, ErrorCode.DATABASE_ERROR); }
  }
  async listPublished(): Promise<Product[]> {
    return this.list(true);
  }
  async list(publishedOnly = false): Promise<Product[]> {
    try {
      const collection = getAdminDb().collection("products");
      const snapshot = await (publishedOnly ? collection.where("isPublished", "==", true) : collection).get();
      return snapshot.docs.map((doc) => ({ id: doc.id, ...productSchema.parse({ pieces: 24, ...doc.data() }) }))
        .sort((a, b) => a.sortOrder - b.sortOrder || a.id.localeCompare(b.id));
    } catch (error) { throw normalizeError(error, ErrorCode.DATABASE_ERROR); }
  }
  async get(id: string): Promise<Product | null> {
    try {
      const document = await getAdminDb().doc(`products/${id}`).get();
      return document.exists ? { id, ...productSchema.parse({ pieces: 24, ...document.data() }) } : null;
    } catch (error) { throw normalizeError(error, ErrorCode.DATABASE_ERROR); }
  }
  async save(id: string | null, input: ProductInput, uid: string) {
    try {
      const db = getAdminDb();
      const reference = id ? db.doc(`products/${id}`) : db.collection("products").doc();
      await db.runTransaction(async (transaction) => {
        const current = await transaction.get(reference);
        if (id && !current.exists) throw new AppError(ErrorCode.NOT_FOUND, "Product not found.");
        const slug = db.doc(`productSlugs/${input.slug}`);
        const reserved = await transaction.get(slug);
        if (reserved.exists && reserved.data()?.productId !== reference.id) {
          throw new AppError(ErrorCode.VALIDATION_ERROR, "slugExists");
        }
        if (current.exists && current.data()?.slug !== input.slug) transaction.delete(db.doc(`productSlugs/${current.data()!.slug}`));
        transaction.set(slug, { productId: reference.id });
        transaction.set(reference, { ...input,
          createdAt: current.data()?.createdAt ?? FieldValue.serverTimestamp(),
          updatedAt: FieldValue.serverTimestamp(), updatedBy: uid,
        });
      });
      return reference.id;
    } catch (error) { throw normalizeError(error, ErrorCode.DATABASE_ERROR); }
  }
  async delete(id: string) {
    try {
      const db = getAdminDb();
      await db.runTransaction(async (transaction) => {
        const reference = db.doc(`products/${id}`);
        const current = await transaction.get(reference);
        if (!current.exists) throw new AppError(ErrorCode.NOT_FOUND, "Product not found.");
        transaction.delete(db.doc(`productSlugs/${current.data()!.slug}`));
        transaction.delete(reference);
      });
    } catch (error) { throw normalizeError(error, ErrorCode.DATABASE_ERROR); }
  }
}
