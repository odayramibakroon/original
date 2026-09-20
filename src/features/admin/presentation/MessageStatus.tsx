"use client";

import { useState, useTransition } from "react";
import { Save } from "lucide-react";
import { useTranslations } from "next-intl";
import { updateMessageStatus } from "../application/message-actions";

export function MessageStatus({ id, initial }: { id: string; initial: string }) {
  const t = useTranslations("admin");
  const common = useTranslations("common");
  const [status, setStatus] = useState(initial);
  const [result, setResult] = useState("");
  const [pending, startTransition] = useTransition();
  return <form onSubmit={(event) => {
    event.preventDefault();
    startTransition(async () => {
      try { setResult((await updateMessageStatus(id, status)).message); }
      catch { setResult(common("error")); }
    });
  }}>
    <div className="admin-actions">
      <label htmlFor="message-status">{t("status")}</label>
      <select id="message-status" value={status} onChange={(event) => setStatus(event.target.value)}>
        {["new", "read", "replied"].map((value) => <option key={value} value={value}>{t(value)}</option>)}
      </select>
      <button className="admin-button" disabled={pending}><Save size={16} />{t("save")}</button>
    </div>
    <p role="status">{result}</p>
  </form>;
}
