"use server";
import { revalidatePath } from "next/cache";
import { adminAction } from "@/core/auth/admin-action";
import { documentIdSchema } from "@/core/validation/cms";
import { MediaRepository } from "../infrastructure/media-repository";

export async function listMedia() { return adminAction(() => new MediaRepository().list()); }
export async function deleteMedia(id: unknown) {
  return adminAction(async () => { await new MediaRepository().delete(documentIdSchema.parse(id)); revalidatePath("/admin/media"); }, "deleted");
}
