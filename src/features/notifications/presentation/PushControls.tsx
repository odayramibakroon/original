"use client";

import { useEffect, useState, useTransition } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Bell, BellOff, Send } from "lucide-react";
import { testPushSubscription, updatePushSubscription } from "../application/subscription-actions";

function applicationKey(value: string) {
  const raw = atob(value.replace(/-/g, "+").replace(/_/g, "/") + "=".repeat((4 - value.length % 4) % 4));
  return Uint8Array.from(raw, (character) => character.charCodeAt(0));
}

export function PushControls() {
  const t = useTranslations("push");
  const locale = useLocale();
  const [subscription, setSubscription] = useState<PushSubscription | null>(null);
  const [status, setStatus] = useState("loading");
  const [message, setMessage] = useState("");
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    let active = true;
    async function initialize() {
      if (!("serviceWorker" in navigator) || !("PushManager" in window) || !("Notification" in window)) {
        if (active) setStatus("unsupported");
        return;
      }
      if (!process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY) {
        if (active) setStatus("unconfigured");
        return;
      }
      try {
        await navigator.serviceWorker.register("/sw.js", { scope: "/", updateViaCache: "none" });
        const registration = await navigator.serviceWorker.ready;
        const existing = await registration.pushManager.getSubscription();
        if (existing && Notification.permission === "granted") {
          const result = await updatePushSubscription(existing.toJSON(), true);
          if (!result.ok) throw new Error(result.message);
          if (active) setSubscription(existing);
        }
        if (active) setStatus(Notification.permission === "denied" ? "denied" : "ready");
      } catch {
        if (active) { setStatus("ready"); setMessage(t("error")); }
      }
    }
    void initialize();
    return () => { active = false; };
  }, [locale, t]);

  function toggle() {
    setMessage("");
    startTransition(async () => {
      try {
        if (subscription) {
          const result = await updatePushSubscription(subscription.toJSON(), false);
          if (!result.ok) { setMessage(result.message); return; }
          await subscription.unsubscribe();
          setSubscription(null);
          setMessage(result.message);
          return;
        }
        const permission = await Notification.requestPermission();
        if (permission !== "granted") { setStatus(permission === "denied" ? "denied" : "ready"); return; }
        const registration = await navigator.serviceWorker.ready;
        const device = await registration.pushManager.getSubscription() ?? await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: applicationKey(process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!),
        });
        const result = await updatePushSubscription(device.toJSON(), true);
        if (!result.ok) { await device.unsubscribe(); setMessage(result.message); return; }
        setSubscription(device);
        setMessage(result.message);
      } catch { setMessage(t("error")); }
    });
  }

  return <div className="push-controls">
    <div className="admin-actions">
      <button className="admin-button" disabled={pending || status !== "ready"} onClick={toggle}>
        {subscription ? <BellOff size={17} /> : <Bell size={17} />}
        {t(subscription ? "disable" : "enable")}
      </button>
      {subscription && <button className="admin-button" disabled={pending} onClick={() => startTransition(async () => {
        try { setMessage((await testPushSubscription(subscription.endpoint)).message); }
        catch { setMessage(t("error")); }
      })}><Send size={17} />{t("test")}</button>}
    </div>
    <p role="status">{message || (["unsupported", "unconfigured", "denied"].includes(status) ? t(status) : subscription ? t("enabled") : "")}</p>
  </div>;
}
