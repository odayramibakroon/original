"use server";

import { cookies } from "next/headers";
import { getTranslations } from "next-intl/server";
import { redirect } from "next/navigation";
import { z } from "zod";
import { getAdminAuth, getAdminDb, isAdminConfigured } from "@/core/firebase/admin";
import { requireAdmin, SESSION_COOKIE, SESSION_MAX_AGE } from "@/core/auth/session";
import { DEVICE_COOKIE, SessionRegistry } from "@/core/auth/session-registry";
import { isActiveAdmin } from "@/core/auth/roles";
import { logger } from "@/core/logger";

export async function createAdminSession(idToken: unknown, rotateOthers: unknown = false) {
  const t = await getTranslations("admin");
  if (!isAdminConfigured()) return { ok: false, message: t("setupRequired") };
  const token = z.string().min(20).max(10000).safeParse(idToken);
  if (!token.success || typeof rotateOthers !== "boolean") return { ok: false, message: t("loginError") };
  try {
    const auth = getAdminAuth();
    const identity = await auth.verifyIdToken(token.data, true);
    if (Date.now() / 1000 - identity.auth_time > 300) throw new Error("Recent sign in required.");
    const user = await getAdminDb().doc(`users/${identity.uid}`).get();
    if (!isActiveAdmin(user.data())) return { ok: false, message: t("forbidden") };
    const session = await auth.createSessionCookie(token.data, { expiresIn: SESSION_MAX_AGE * 1000 });
    const store = await cookies();
    const sessionId = await new SessionRegistry().create(identity.uid, session, identity.auth_time, Date.now() + SESSION_MAX_AGE * 1000, rotateOthers, store.get(DEVICE_COOKIE)?.value);
    const options = {
      httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax",
      path: "/", maxAge: SESSION_MAX_AGE,
    } as const;
    store.set(SESSION_COOKIE, session, options);
    store.set(DEVICE_COOKIE, sessionId, options);
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
      await new SessionRegistry().revokeCurrent(await requireAdmin());
    } catch (error) {
      logger.error("Could not revoke the current admin session.", { error: error instanceof Error ? error.name : "unknown" });
    }
  }
  store.delete(SESSION_COOKIE);
  store.delete(DEVICE_COOKIE);
  redirect("/login");
}
