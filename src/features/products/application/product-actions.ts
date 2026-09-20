"use server";
import { revalidatePath, updateTag } from "next/cache";
import { z } from "zod";
import { adminAction } from "@/core/auth/admin-action";
import { documentIdSchema } from "@/core/validation/cms";
import { productSchema } from "../domain/product-schema";
import { FirestoreProductRepository } from "../infrastructure/firestore-product-repository";

function invalidate() { updateTag("products"); revalidatePath("/", "layout"); }

export async function saveProduct(id: unknown, input: unknown) {
  return adminAction(async (admin) => {
    const productId = documentIdSchema.nullable().parse(id);
    const result = await new FirestoreProductRepository().save(productId, productSchema.parse(input), admin.uid);
    invalidate(); return { id: result };
  });
}

export async function deleteProduct(id: unknown) {
  return adminAction(async () => {
    await new FirestoreProductRepository().delete(documentIdSchema.parse(id)); invalidate();
  }, "deleted");
}

export async function setProductPublished(id: unknown, published: unknown) {
  return adminAction(async (admin) => {
    await new FirestoreProductRepository().setPublished(documentIdSchema.parse(id), z.boolean().parse(published), admin.uid);
    invalidate();
  });
}
