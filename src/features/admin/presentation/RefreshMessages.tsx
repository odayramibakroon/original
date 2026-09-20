"use client";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { useTranslations } from "next-intl";
import { RefreshCw } from "lucide-react";

export function RefreshMessages() {
  const router = useRouter();
  const t = useTranslations("admin");
  const [pending, startTransition] = useTransition();
  return <button className="admin-button" disabled={pending} onClick={() => startTransition(() => router.refresh())}>
    <RefreshCw size={16} />{t("refresh")}
  </button>;
}
