"use server";

import { cookies } from "next/headers";
import { getTranslations } from "next-intl/server";
import { redirect } from "next/navigation";
import { z } from "zod";
import { getAdminAuth, getAdminDb, isAdminConfigured } from "@/core/firebase/admin";
import { SESSION_COOKIE, SESSION_MAX_AGE } from "@/core/auth/session";
import { isActiveAdmin } from "@/core/auth/roles";
import { logger } from "@/core/logger";

export async function createAdminSession(idToken: unknown) {
  const t = await getTranslations("admin");
  if (!isAdminConfigured()) return { ok: false, message: t("setupRequired") };
  const token = z.string().min(20).max(10000).safeParse(idToken);
  if (!token.success) return { ok: false, message: t("loginError") };
  try {
    const auth = getAdminAuth();
    const identity = await auth.verifyIdToken(token.data, true);
    if (Date.now() / 1000 - identity.auth_time > 300) throw new Error("Recent sign in required.");
    const user = await getAdminDb().doc(`users/${identity.uid}`).get();
    if (!isActiveAdmin(user.data())) return { ok: false, message: t("forbidden") };
    const session = await auth.createSessionCookie(token.data, { expiresIn: SESSION_MAX_AGE * 1000 });
    (await cookies()).set(SESSION_COOKIE, session, {
      httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax",
      path: "/", maxAge: SESSION_MAX_AGE,
    });
    return { ok: true, message: "" };
  } catch (error) {
    logger.error("Admin sign in failed.", { error: error instanceof Error ? error.name : "unknown" });
    return { ok: false, message: t("loginError") };
  }
}

export async function signOutAdmin() {
  const store = await cookies();
  const session = store.get(SESSION_COOKIE)?.value;
  if (session) {
    try {
      const identity = await getAdminAuth().verifySessionCookie(session, true);
      // A sign-out also stops background notifications on all of this user's devices.
      const subscriptions = await getAdminDb().collection("adminPushSubscriptions").where("uid", "==", identity.uid).get();
      const writer = getAdminDb().bulkWriter();
      for (const document of subscriptions.docs) writer.delete(document.ref);
      await writer.close();
      await getAdminAuth().revokeRefreshTokens(identity.uid);
    } catch (error) {
      logger.error("Could not revoke all admin sessions.", { error: error instanceof Error ? error.name : "unknown" });
    }
  }
  store.delete(SESSION_COOKIE);
  redirect("/login");
}
