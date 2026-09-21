import "server-only";
import { cookies } from "next/headers";
import { getAdminAuth } from "@/core/firebase/admin";
import { AppError, ErrorCode } from "@/core/errors";
import { DEVICE_COOKIE, SessionRegistry } from "./session-registry";

export const SESSION_COOKIE = "admin_session";
export const SESSION_MAX_AGE = 60 * 60 * 24 * 5;

export async function requireAdmin() {
  const store = await cookies();
  const session = store.get(SESSION_COOKIE)?.value;
  const sessionId = store.get(DEVICE_COOKIE)?.value;
  if (!session || !sessionId) throw new AppError(ErrorCode.UNAUTHORIZED, "Sign in required.");
  let identity;
  try {
    identity = await getAdminAuth().verifySessionCookie(session, true);
  } catch (error) {
    throw new AppError(ErrorCode.UNAUTHORIZED, "Invalid session.", error);
  }
  const version = await new SessionRegistry().verify(identity.uid, session, sessionId);
  return { uid: identity.uid, email: identity.email ?? "", sessionId, version };
}
