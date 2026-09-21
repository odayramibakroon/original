import "server-only";
import { createHash } from "node:crypto";
import { FieldValue, Timestamp } from "firebase-admin/firestore";
import { getAdminDb } from "@/core/firebase/admin";
import { AppError, ErrorCode, normalizeError } from "@/core/errors";
import type { ContactFormInput } from "@/core/validation/contact";
import { normalizeWhatsAppPhone } from "@/core/utils/whatsapp";
import { normalizeIp } from "@/core/network/ip";
import { contactDay, contactPolicySchema } from "../domain/contact-policy";
import { contactIpKey } from "./contact-policy-repository";

export class FirestoreContactRepository {
  async create(input: ContactFormInput, locale: string, address: string) {
    try {
      const ip = normalizeIp(address);
      if (!ip) throw new AppError(ErrorCode.NETWORK_ERROR, "Trusted client IP is unavailable.");
      const db = getAdminDb();
      const message = db.collection("contactMessages").doc();
      const normalizedPhone = normalizeWhatsAppPhone(input.phone);
      const bucket = createHash("sha256").update(normalizedPhone).digest("hex");
      const rate = db.doc(`contactRateLimits/${bucket}`);
      const ipKey = contactIpKey(ip);
      const dailyRate = db.doc(`contactIpLimits/${ipKey}`);
      await db.runTransaction(async (transaction) => {
        const [phoneSnapshot, ipSnapshot, blockSnapshot, policySnapshot] = await transaction.getAll(
          rate, dailyRate, db.doc(`blockedContactIps/${ipKey}`), db.doc("system/contactPolicy"),
        );
        if (blockSnapshot.exists) throw new AppError(ErrorCode.FORBIDDEN, "contactBlocked");
        const policy = contactPolicySchema.parse(policySnapshot.data() ?? {});
        const day = contactDay(Date.now());
        const dailyCount = ipSnapshot.data()?.day === day ? Number(ipSnapshot.data()?.count ?? 0) : 0;
        if (dailyCount >= policy.dailyMessagesPerIp) throw new AppError(ErrorCode.RATE_LIMITED, "dailyContactLimit");
        const previous = phoneSnapshot.data();
        const windowActive = previous?.expiresAt?.toMillis() > Date.now();
        const count = windowActive ? Number(previous?.count ?? 0) : 0;
        if (count >= 5) throw new AppError(ErrorCode.RATE_LIMITED, "Contact rate limit reached.");
        transaction.set(rate, {
          count: count + 1,
          expiresAt: windowActive ? previous!.expiresAt : Timestamp.fromMillis(Date.now() + 10 * 60 * 1000),
        });
        transaction.set(dailyRate, { day, count: dailyCount + 1, updatedAt: FieldValue.serverTimestamp() });
        transaction.create(message, {
          ...input, ip, locale, status: "new", createdAt: FieldValue.serverTimestamp(),
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
