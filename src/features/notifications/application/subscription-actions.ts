"use server";

import { FieldValue } from "firebase-admin/firestore";
import { getLocale, getTranslations } from "next-intl/server";
import { requireAdmin } from "@/core/auth/session";
import { getAdminDb } from "@/core/firebase/admin";
import { subscriptionSchema, type AdminSubscription } from "../domain/subscription";
import { pushConfigured, sendPush, subscriptionId } from "../infrastructure/web-push";
import { logger } from "@/core/logger";

export async function updatePushSubscription(input: unknown, enabled: boolean) {
  const t = await getTranslations("push");
  try {
    const admin = await requireAdmin();
    const subscription = subscriptionSchema.parse(input);
    const reference = getAdminDb().doc(`adminPushSubscriptions/${subscriptionId(subscription.endpoint)}`);
    if (enabled) {
      if (!pushConfigured()) return { ok: false, message: t("unconfigured") };
      await reference.set({ ...subscription, uid: admin.uid, locale: await getLocale(), updatedAt: FieldValue.serverTimestamp() });
    } else {
      const existing = await reference.get();
      if (existing.exists && existing.data()?.uid !== admin.uid) throw new Error("Subscription belongs to another user.");
      await reference.delete();
    }
    return { ok: true, message: t(enabled ? "enabled" : "disabled") };
  } catch (error) {
    logger.error("Could not update push subscription.", { error: error instanceof Error ? error.name : "unknown" });
    return { ok: false, message: t("error") };
  }
}

export async function testPushSubscription(endpoint: string) {
  const t = await getTranslations("push");
  try {
    const admin = await requireAdmin();
    if (typeof endpoint !== "string" || endpoint.length > 2048) throw new Error("Invalid subscription.");
    const document = await getAdminDb().doc(`adminPushSubscriptions/${subscriptionId(endpoint)}`).get();
    const subscription = document.data() as AdminSubscription | undefined;
    if (!subscription || subscription.uid !== admin.uid) throw new Error("Subscription not found.");
    await sendPush(subscription);
    return { ok: true, message: t("testSent") };
  } catch (error) {
    logger.error("Test notification failed.", { error: error instanceof Error ? error.name : "unknown" });
    return { ok: false, message: t("error") };
  }
}
