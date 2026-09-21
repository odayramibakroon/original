import "server-only";
import { createHash } from "node:crypto";
import { FieldValue } from "firebase-admin/firestore";
import { getAdminDb } from "@/core/firebase/admin";
import { normalizeIp } from "@/core/network/ip";
import { AppError, ErrorCode, normalizeError } from "@/core/errors";
import { contactPolicySchema, type BlockedContactIp, type ContactPolicy } from "../domain/contact-policy";

export function contactIpKey(ip: string) {
  const normalized = normalizeIp(ip);
  if (!normalized) throw new AppError(ErrorCode.VALIDATION_ERROR, "invalidIp");
  return createHash("sha256").update(normalized).digest("hex");
}

export class ContactPolicyRepository {
  async get() {
    try { return contactPolicySchema.parse((await getAdminDb().doc("system/contactPolicy").get()).data() ?? {}); }
    catch (error) { throw normalizeError(error, ErrorCode.DATABASE_ERROR); }
  }
  async save(policy: ContactPolicy, uid: string) {
    try { await getAdminDb().doc("system/contactPolicy").set({ ...contactPolicySchema.parse(policy), updatedAt: FieldValue.serverTimestamp(), updatedBy: uid }, { merge: true }); }
    catch (error) { throw normalizeError(error, ErrorCode.DATABASE_ERROR); }
  }
  async blocked(): Promise<BlockedContactIp[]> {
    try {
      const snapshot = await getAdminDb().collection("blockedContactIps").orderBy("createdAt", "desc").get();
      return snapshot.docs.map((doc) => ({ ip: doc.data().ip, createdAt: doc.data().createdAt?.toDate().toISOString() ?? "" }));
    } catch (error) { throw normalizeError(error, ErrorCode.DATABASE_ERROR); }
  }
  async setBlocked(value: string, blocked: boolean, uid: string) {
    const ip = normalizeIp(value);
    if (!ip) throw new AppError(ErrorCode.VALIDATION_ERROR, "invalidIp");
    try {
      const reference = getAdminDb().doc(`blockedContactIps/${contactIpKey(ip)}`);
      if (blocked) await reference.set({ ip, createdAt: FieldValue.serverTimestamp(), createdBy: uid });
      else await reference.delete();
    } catch (error) { throw normalizeError(error, ErrorCode.DATABASE_ERROR); }
  }
}
