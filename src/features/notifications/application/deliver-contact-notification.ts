import "server-only";
import { FieldValue, Timestamp } from "firebase-admin/firestore";
import { getAdminDb } from "@/core/firebase/admin";
import { getActiveSubscriptions, sendPush } from "../infrastructure/web-push";
import { logger } from "@/core/logger";

export async function deliverContactNotification(id: string) {
  const db = getAdminDb();
  const job = db.doc(`notificationOutbox/${id}`);
  const claimed = await db.runTransaction(async (transaction) => {
    const snapshot = await transaction.get(job);
    const data = snapshot.data();
    if (!data || data.status !== "pending" || data.nextAttemptAt.toMillis() > Date.now()) return false;
    if (data.createdAt && Date.now() - data.createdAt.toMillis() > 24 * 60 * 60 * 1000) {
      transaction.update(job, { status: "expired", nextAttemptAt: FieldValue.delete() });
      return false;
    }
    transaction.update(job, {
      nextAttemptAt: Timestamp.fromMillis(Date.now() + 5 * 60 * 1000),
      attempts: FieldValue.increment(1),
    });
    return true;
  });
  if (!claimed) return;
  try {
    const subscriptions = await getActiveSubscriptions();
    if (!subscriptions.length) {
      await job.update({ lastResult: "no-subscribers" });
      return;
    }
    const completed = (await job.get()).data()?.deliveredTo ?? [];
    let failed = false;
    for (let offset = 0; offset < subscriptions.length; offset += 10) {
      await Promise.all(subscriptions.slice(offset, offset + 10).map(async ({ id: deviceId, subscription }) => {
        if (completed.includes(deviceId)) return;
        try {
          await sendPush(subscription, id);
          await job.update({ deliveredTo: FieldValue.arrayUnion(deviceId) });
        } catch (error) {
          const statusCode = (error as { statusCode?: number }).statusCode;
          if (statusCode === 404 || statusCode === 410) {
            await db.doc(`adminPushSubscriptions/${deviceId}`).delete();
          } else {
            failed = true;
            logger.error("Push delivery failed; retained for retry.", { statusCode, messageId: id });
          }
        }
      }));
    }
    await job.update({
      status: failed ? "pending" : "sent",
      ...(!failed ? { nextAttemptAt: FieldValue.delete() } : {}),
      lastResult: failed ? "retry" : "delivered",
      updatedAt: FieldValue.serverTimestamp(),
    });
  } catch (error) {
    logger.error("Notification remains pending.", { messageId: id, error: error instanceof Error ? error.name : "unknown" });
  }
}

export async function retryPendingNotifications() {
  const jobs = await getAdminDb().collection("notificationOutbox")
    .where("nextAttemptAt", "<=", Timestamp.now()).orderBy("nextAttemptAt").limit(25).get();
  for (let offset = 0; offset < jobs.size; offset += 5) {
    await Promise.all(jobs.docs.slice(offset, offset + 5).map(async (job) => {
      if (job.data().status !== "pending") {
        await job.ref.update({ nextAttemptAt: FieldValue.delete() });
      } else {
        await deliverContactNotification(job.id);
      }
    }));
  }
  return jobs.size;
}
