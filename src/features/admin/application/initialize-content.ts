"use server";
import { updateTag, revalidatePath } from "next/cache";
import { adminAction } from "@/core/auth/admin-action";
import { AppError, ErrorCode } from "@/core/errors";
import { importOriginalContent } from "./import-original-content";

export async function initializeOriginalContent() {
  return adminAction(async (admin) => {
    const imported = await importOriginalContent(admin.uid);
    if (imported.alreadyImported) throw new AppError(ErrorCode.VALIDATION_ERROR, "setupDone");
    updateTag("site"); updateTag("products"); revalidatePath("/", "layout");
  }, "setupSuccess");
}
