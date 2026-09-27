"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { inMemoryPersistence, setPersistence, signInWithEmailAndPassword, signOut } from "firebase/auth";
import { LogIn } from "lucide-react";
import { getFirebaseAuth } from "@/core/firebase/client";
import { createAdminSession } from "../application/auth-actions";
import { syncCurrentPush } from "@/features/notifications/application/sync-current-push";
import { logger } from "@/core/logger";

export function LoginForm({ next, configured }: { next: string; configured: boolean }) {
  const t = useTranslations("admin");
  const router = useRouter();
  const [message, setMessage] = useState("");
  const [pending, startTransition] = useTransition();

  return <form className="admin-login-form" onSubmit={(event) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    setMessage("");
    startTransition(async () => {
      try {
        const auth = getFirebaseAuth();
        await setPersistence(auth, inMemoryPersistence);
        const credential = await signInWithEmailAndPassword(auth, String(data.get("email")), String(data.get("password")));
        const token = await credential.user.getIdToken();
        await signOut(auth);
        const result = await createAdminSession(token);
        if (!result.ok) { setMessage(result.message); return; }
        try { if (!await syncCurrentPush()) logger.warn("Device notifications need reconnecting."); }
        catch { logger.warn("Device notifications need reconnecting."); }
        router.replace(next);
        router.refresh();
      } catch {
        setMessage(t("loginError"));
      }
    });
  }}>
    <h1>{t("login")}</h1>
    <label>{t("email")}<input name="email" type="email" autoComplete="username" dir="ltr" required /></label>
    <label>{t("password")}<input name="password" type="password" autoComplete="current-password" required /></label>
    {!configured && <p role="status">{t("setupRequired")}</p>}
    {message && <p role="alert">{message}</p>}
    <button type="submit" className="admin-button primary" disabled={pending || !configured}>
      <LogIn size={17} />{t(pending ? "signingIn" : "signIn")}
    </button>
  </form>;
}
