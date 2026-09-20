"use client";
import { useState, useTransition } from "react";
import { Download } from "lucide-react";
import { useTranslations } from "next-intl";
import { initializeOriginalContent } from "../application/initialize-content";

export function InitializeContent() {
  const t = useTranslations("cms");
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState("");
  return <div><button className="admin-button" disabled={pending} onClick={() => startTransition(async () => {
    try { setMessage((await initializeOriginalContent()).message); } catch { setMessage(t("error")); }
  })}><Download size={16} />{t("setup")}</button><p role="status">{message}</p></div>;
}
