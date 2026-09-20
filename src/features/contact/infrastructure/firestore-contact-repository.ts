import "server-only";
import { createHash } from "node:crypto";
import { FieldValue, Timestamp } from "firebase-admin/firestore";
import { getAdminDb } from "@/core/firebase/admin";
import { AppError, ErrorCode, normalizeError } from "@/core/errors";
import type { ContactFormInput } from "@/core/validation/contact";
import { normalizeWhatsAppPhone } from "@/core/utils/whatsapp";

export class FirestoreContactRepository {
  async create(input: ContactFormInput, locale: string) {
    try {
      const db = getAdminDb();
      const message = db.collection("contactMessages").doc();
      const normalizedPhone = normalizeWhatsAppPhone(input.phone);
      const bucket = createHash("sha256").update(normalizedPhone).digest("hex");
      const rate = db.doc(`contactRateLimits/${bucket}`);
      await db.runTransaction(async (transaction) => {
        const previous = (await transaction.get(rate)).data();
        const windowActive = previous?.expiresAt?.toMillis() > Date.now();
        const count = windowActive ? Number(previous?.count ?? 0) : 0;
        if (count >= 5) throw new AppError(ErrorCode.RATE_LIMITED, "Contact rate limit reached.");
        transaction.set(rate, {
          count: count + 1,
          expiresAt: windowActive ? previous!.expiresAt : Timestamp.fromMillis(Date.now() + 10 * 60 * 1000),
        });
        transaction.create(message, {
          ...input, locale, status: "new", createdAt: FieldValue.serverTimestamp(),
        });
        transaction.create(db.doc(`notificationOutbox/${message.id}`), {
          status: "pending", attempts: 0, deliveredTo: [],
          nextAttemptAt: Timestamp.now(), createdAt: FieldValue.serverTimestamp(),
        });
      });
      return message.id;
    } catch (error) {
      throw normalizeError(error, ErrorCode.DATABASE_ERROR);
    }
  }
}
