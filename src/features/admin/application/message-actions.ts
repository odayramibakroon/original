"use server";

import { z } from "zod";
import { getTranslations } from "next-intl/server";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/core/auth/session";
import { getAdminDb } from "@/core/firebase/admin";
import { FieldValue } from "firebase-admin/firestore";
import { messageIdSchema } from "../infrastructure/messages";
import { logger } from "@/core/logger";

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
