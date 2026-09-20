import "server-only";
import webpush from "web-push";
import { createHash } from "node:crypto";
import { getAdminDb, getAdminAuth } from "@/core/firebase/admin";
import { isActiveAdmin } from "@/core/auth/roles";
import { requireEnv } from "@/core/config/env";
import { isAllowedPushEndpoint, type AdminSubscription } from "../domain/subscription";
import ar from "../../../../messages/ar.json";
import en from "../../../../messages/en.json";

export function subscriptionId(endpoint: string) {
  return createHash("sha256").update(endpoint).digest("hex");
}

export function pushConfigured() {
  return Boolean(process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY && process.env.VAPID_SUBJECT);
}

export async function sendPush(subscription: AdminSubscription, id?: string) {
  if (!isAllowedPushEndpoint(subscription.endpoint)) throw new Error("Invalid push endpoint.");
  const messages = subscription.locale === "en" ? en.push : ar.push;
  return webpush.sendNotification(subscription, JSON.stringify({
    title: id ? messages.title : messages.testTitle,
    body: id ? messages.body : messages.testBody,
    url: id ? `/admin/messages/${encodeURIComponent(id)}` : "/admin/messages",
    tag: id ? `contact-${id}` : "push-test",
    lang: subscription.locale,
    dir: subscription.locale === "ar" ? "rtl" : "ltr",
  }), {
    vapidDetails: {
      subject: requireEnv("VAPID_SUBJECT"),
      publicKey: requireEnv("NEXT_PUBLIC_VAPID_PUBLIC_KEY"),
      privateKey: requireEnv("VAPID_PRIVATE_KEY"),
    },
    TTL: 60 * 60 * 24,
    urgency: "high",
    timeout: 8000,
  });
}

export async function getActiveSubscriptions() {
  const db = getAdminDb();
  const snapshots = await db.collection("adminPushSubscriptions").get();
  const allowed = new Map<string, boolean>();
  const result: Array<{ id: string; subscription: AdminSubscription }> = [];
  for (const document of snapshots.docs) {
    const subscription = document.data() as AdminSubscription;
    if (!allowed.has(subscription.uid)) {
      const [profile, account] = await Promise.all([
        db.doc(`users/${subscription.uid}`).get(),
        getAdminAuth().getUser(subscription.uid).catch((error: { code?: string }) => {
          if (error.code === "auth/user-not-found") return null;
          throw error;
        }),
      ]);
      allowed.set(subscription.uid, isActiveAdmin(profile.data()) && Boolean(account && !account.disabled));
    }
    if (allowed.get(subscription.uid)) result.push({ id: document.id, subscription });
    else await document.ref.delete();
  }
  return result;
}
