"use client";
import { useState, useTransition } from "react";
import { Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";
import type { AdminResult } from "@/core/auth/admin-action";
import { Dialog } from "./Dialog";

export function DeleteButton({ action, onDeleted, label }: { action: () => Promise<AdminResult>; onDeleted?: () => void; label?: string }) {
  const t = useTranslations("cms");
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [pending, startTransition] = useTransition();
  return <>
    <button type="button" className="admin-icon danger" title={label ?? t("delete")} aria-label={label ?? t("delete")} onClick={() => { setMessage(""); setOpen(true); }}><Trash2 size={17} /></button>
    <Dialog open={open} title={t("confirmDelete")} onClose={() => { if (!pending) setOpen(false); }}>
      {message && <p role="alert">{message}</p>}
      <div className="admin-actions">
        <button type="button" className="admin-button danger" disabled={pending} onClick={() => startTransition(async () => {
          try { const result = await action(); if (result.ok) { setOpen(false); onDeleted?.(); } else setMessage(result.message); }
          catch { setMessage(t("error")); }
        })}><Trash2 size={16} />{t("delete")}</button>
        <button type="button" className="admin-button" disabled={pending} onClick={() => setOpen(false)}>{t("cancel")}</button>
      </div>
    </Dialog>
  </>;
}
