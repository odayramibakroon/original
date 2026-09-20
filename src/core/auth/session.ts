import "server-only";
import { cookies } from "next/headers";
import { getAdminAuth, getAdminDb } from "@/core/firebase/admin";
import { AppError, ErrorCode } from "@/core/errors";
import { isActiveAdmin } from "./roles";

export const SESSION_COOKIE = "admin_session";
export const SESSION_MAX_AGE = 60 * 60 * 24 * 5;

export async function requireAdmin() {
  const session = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!session) throw new AppError(ErrorCode.UNAUTHORIZED, "Sign in required.");
  let identity;
  try {
    identity = await getAdminAuth().verifySessionCookie(session, true);
  } catch (error) {
    throw new AppError(ErrorCode.UNAUTHORIZED, "Invalid session.", error);
  }
  const user = await getAdminDb().doc(`users/${identity.uid}`).get();
  if (!isActiveAdmin(user.data())) throw new AppError(ErrorCode.FORBIDDEN, "Admin role required.");
  return { uid: identity.uid, email: identity.email ?? "" };
}
