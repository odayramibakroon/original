"use client";
import { inMemoryPersistence, setPersistence, signInWithEmailAndPassword, signOut, updatePassword } from "firebase/auth";
import { getFirebaseAuth } from "@/core/firebase/client";
import { createAdminSession } from "@/features/admin/application/auth-actions";
import { syncCurrentPush } from "@/features/notifications/presentation/sync-current-push";
import { passwordSchema, type PasswordInput } from "../domain/password-schema";
import { logger } from "@/core/logger";

export async function changePassword(input: PasswordInput, account: { uid: string; email: string }) {
  const values = passwordSchema.parse(input);
  const auth = getFirebaseAuth();
  let changed = false;
  try {
    await setPersistence(auth, inMemoryPersistence);
    const current = await signInWithEmailAndPassword(auth, account.email, values.currentPassword);
    if (current.user.uid !== account.uid) throw new Error("Account mismatch.");
    await updatePassword(current.user, values.newPassword);
    changed = true;
    const refreshed = await signInWithEmailAndPassword(auth, account.email, values.newPassword);
    const result = await createAdminSession(await refreshed.user.getIdToken(true), true);
    if (!result.ok) return { ok: false, changed, key: "passwordChangedSignIn" };
    const push = await syncCurrentPush().catch(() => false);
    return { ok: true, changed, key: push ? "passwordChanged" : "passwordChangedPush" };
  } catch (error) {
    if (changed) return { ok: false, changed, key: "passwordChangedSignIn" };
    const code = (error as { code?: string }).code;
    const key = ["auth/invalid-credential", "auth/wrong-password", "auth/invalid-login-credentials"].includes(code ?? "") ? "currentInvalid"
      : code === "auth/weak-password" || code === "auth/password-does-not-meet-requirements" ? "weakPassword"
        : code === "auth/too-many-requests" ? "tooManyAttempts" : "error";
    return { ok: false, changed, key };
  } finally { await signOut(auth).catch(() => logger.warn("Could not clear temporary client authentication.")); }
}
