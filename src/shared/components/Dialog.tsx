"use client";
import { useEffect, useRef, useId } from "react";
import { X } from "lucide-react";
import { useTranslations } from "next-intl";

export function Dialog({ open, title, onClose, children }: { open: boolean; title: string; onClose: () => void; children: React.ReactNode }) {
  const reference = useRef<HTMLDialogElement>(null);
  const id = useId();
  const t = useTranslations("cms");
  useEffect(() => {
    const dialog = reference.current;
    if (open && !dialog?.open) dialog?.showModal();
    else if (!open && dialog?.open) dialog.close();
  }, [open]);
  return <dialog ref={reference} className="admin-dialog" aria-labelledby={id} onClose={onClose}
    onClick={(event) => { if (event.target === event.currentTarget) onClose(); }}>
    <div className="admin-dialog-body"><div className="admin-heading"><h2 id={id}>{title}</h2>
      <button className="admin-icon" type="button" title={t("close")} aria-label={t("close")} onClick={onClose}><X size={19} /></button></div>{children}</div>
  </dialog>;
}
