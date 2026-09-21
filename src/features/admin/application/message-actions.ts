"use server";

import { z } from "zod";
import { getTranslations } from "next-intl/server";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/core/auth/session";
import { getAdminDb } from "@/core/firebase/admin";
import { FieldValue } from "firebase-admin/firestore";
import { messageIdSchema } from "../infrastructure/messages";
import { logger } from "@/core/logger";
import { adminAction } from "@/core/auth/admin-action";
import { deleteContactMessages, markContactMessagesRead } from "../infrastructure/messages";

export async function markMessagesRead(ids: unknown) {
  return adminAction(async (admin) => {
    const result = await markContactMessagesRead(ids, admin.uid);
    revalidatePath("/admin"); revalidatePath("/admin/messages", "layout");
    return result;
  });
}

export async function deleteMessages(input: unknown) {
  return adminAction(async () => {
    const result = await deleteContactMessages(input);
    revalidatePath("/admin"); revalidatePath("/admin/messages", "layout");
    return result;
  }, "deleted");
}

export async function updateMessageStatus(id: unknown, status: unknown) {
  const t = await getTranslations();
  try {
    const admin = await requireAdmin();
    const messageId = messageIdSchema.parse(id);
    const nextStatus = z.enum(["new", "read", "replied"]).parse(status);
    await getAdminDb().doc(`contactMessages/${messageId}`).update({
      status: nextStatus, updatedAt: FieldValue.serverTimestamp(), updatedBy: admin.uid,
    });
    revalidatePath("/admin/messages");
    revalidatePath(`/admin/messages/${messageId}`);
    return { ok: true, message: t("admin.saved") };
  } catch (error) {
    logger.error("Could not update message status.", { error: error instanceof Error ? error.name : "unknown" });
    return { ok: false, message: t("common.error") };
  }
}
