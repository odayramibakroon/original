import "server-only";
import { createHash, randomUUID } from "node:crypto";
import { FieldValue, Timestamp } from "firebase-admin/firestore";
import { getAdminDb } from "@/core/firebase/admin";
import { AppError, ErrorCode, normalizeError } from "@/core/errors";
import { isActiveAdmin } from "./roles";

export const DEVICE_COOKIE = "admin_device";
export const sessionDigest = (cookie: string) => createHash("sha256").update(cookie).digest("hex");
export const isDeviceId = (value: string) => /^[a-f0-9-]{36}$/.test(value);
export type VerifiedSession = { uid: string; email: string; sessionId: string; version: number };

export class SessionRegistry {
  async create(uid: string, cookie: string, authTime: number, expiresAt: number, rotateOthers: boolean, previousId?: string) {
    try {
      const db = getAdminDb();
      const id = randomUUID();
      await db.runTransaction(async (transaction) => {
        const profileRef = db.doc(`users/${uid}`);
        const profile = (await transaction.get(profileRef)).data();
        if (!isActiveAdmin(profile)) throw new AppError(ErrorCode.FORBIDDEN, "Admin role required.");
        if (profile?.sessionsRevokedAt && authTime <= profile.sessionsRevokedAt) throw new AppError(ErrorCode.UNAUTHORIZED, "Recent sign in required.");
        const previous = previousId && isDeviceId(previousId) ? await transaction.get(db.doc(`adminSessions/${previousId}`)) : null;
        const version = Number(profile?.sessionVersion ?? 0) + (rotateOthers ? 1 : 0);
        if (rotateOthers) transaction.update(profileRef, { sessionVersion: version, sessionsRevokedAt: Math.floor(Date.now() / 1000) });
        transaction.create(db.doc(`adminSessions/${id}`), { uid, tokenHash: sessionDigest(cookie), authTime, version, expiresAt: Timestamp.fromMillis(expiresAt), createdAt: FieldValue.serverTimestamp() });
        if (previous?.data()?.uid === uid) transaction.delete(previous.ref);
      });
      return id;
    } catch (error) { throw normalizeError(error, ErrorCode.DATABASE_ERROR); }
  }

  async verify(uid: string, cookie: string, id: string) {
    if (!isDeviceId(id)) throw new AppError(ErrorCode.UNAUTHORIZED, "Invalid device session.");
    try {
      const db = getAdminDb();
      const [profileSnapshot, sessionSnapshot] = await Promise.all([db.doc(`users/${uid}`).get(), db.doc(`adminSessions/${id}`).get()]);
      const profile = profileSnapshot.data();
      const session = sessionSnapshot.data();
      if (!isActiveAdmin(profile)) throw new AppError(ErrorCode.FORBIDDEN, "Admin role required.");
      const version = Number(profile?.sessionVersion ?? 0);
      if (!session || session.uid !== uid || session.tokenHash !== sessionDigest(cookie) || session.version !== version || session.expiresAt.toMillis() <= Date.now()) {
        throw new AppError(ErrorCode.UNAUTHORIZED, "Device session has ended.");
      }
      return version;
    } catch (error) { throw normalizeError(error, ErrorCode.DATABASE_ERROR); }
  }

  async revokeOthers(admin: VerifiedSession) {
    try {
      const db = getAdminDb();
      await db.runTransaction(async (transaction) => {
        const profileRef = db.doc(`users/${admin.uid}`);
        const sessionRef = db.doc(`adminSessions/${admin.sessionId}`);
        const [profile, session] = await transaction.getAll(profileRef, sessionRef);
        const version = Number(profile.data()?.sessionVersion ?? 0);
        if (!isActiveAdmin(profile.data()) || session.data()?.uid !== admin.uid || session.data()?.version !== version || admin.version !== version) {
          throw new AppError(ErrorCode.UNAUTHORIZED, "Device session has ended.");
        }
        // Advancing the account version revokes every other session atomically.
        transaction.update(profileRef, { sessionVersion: version + 1, sessionsRevokedAt: Math.floor(Date.now() / 1000) });
        transaction.update(sessionRef, { version: version + 1 });
      });
    } catch (error) { throw normalizeError(error, ErrorCode.DATABASE_ERROR); }
  }

  async revokeCurrent(admin: VerifiedSession) {
    try { await getAdminDb().doc(`adminSessions/${admin.sessionId}`).delete(); }
    catch (error) { throw normalizeError(error, ErrorCode.DATABASE_ERROR); }
  }
}
