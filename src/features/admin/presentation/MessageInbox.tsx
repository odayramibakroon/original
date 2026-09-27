"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { useRef, useState, useTransition } from "react";
import { Search, Trash2, X, LoaderCircle, MailOpen } from "lucide-react";
import type { AdminMessage } from "../infrastructure/messages";
import { messageListHref, type MessageQuery } from "../domain/message-query";
import { deleteMessages, markMessagesRead } from "../application/message-actions";
import { Dialog } from "@/shared/components/Dialog";
import { DeleteButton } from "@/shared/components/DeleteButton";
import { IpBlockButton } from "@/features/site-settings/presentation/OperationalSettings";
import { useLiveFilters } from "@/shared/hooks/useLiveFilters";

export function MessageInbox({ messages, next, before, filter, blockedIps }: {
  messages: AdminMessage[]; next: string | null; before: number; filter: MessageQuery; blockedIps: string[];
}) {
  const t = useTranslations("admin");
  const c = useTranslations("cms");
  const locale = useLocale();
  const router = useRouter();
  const search = useLiveFilters({ q: filter.q, status: filter.status }, messageListHref);
  const [selected, setSelected] = useState<string[]>([]);
  const [mode, setMode] = useState<"selected" | "all" | null>(null);
  const [pending, startTransition] = useTransition();
  const [removed, setRemoved] = useState(0);
  const [message, setMessage] = useState("");
  const deleting = useRef(false);
  const chosen = selected.filter((id) => messages.some((item) => item.id === id));
  const checked = chosen.length === messages.length && messages.length > 0;
  function remove() {
    if (!mode || deleting.current) return;
    deleting.current = true;
    startTransition(async () => {
      let count = 0;
      setMessage(""); setRemoved(0);
      try {
        let hasMore = true;
        while (hasMore) {
          const result = await deleteMessages(mode === "all" ? { mode, before } : { mode, ids: chosen });
          if (!result.ok) { setMessage(result.message); return; }
          count += result.data.deleted; setRemoved(count); hasMore = result.data.hasMore;
        }
        setSelected([]); setMode(null); setMessage(t("deletedMessages", { count }));
      } catch { setMessage(c("error")); }
      finally { deleting.current = false; router.refresh(); }
    });
  }
  return <>
    <form className="admin-toolbar" role="search" aria-busy={search.pending} {...search.formProps}>
      <label className="admin-search">{search.pending ? <LoaderCircle size={17} className="spin" /> : <Search size={17} />}<input type="search" name="q" value={search.values.q} onChange={(event) => search.change({ q: event.target.value })} maxLength={120} aria-label={t("searchMessages")} placeholder={t("searchMessages")} /></label>
      <select name="status" aria-label={t("status")} value={search.values.status} onChange={(event) => search.change({ status: event.target.value as MessageQuery["status"] }, true)}>
        <option value="all">{t("allStatuses")}</option>{["new", "read", "replied"].map((status) => <option key={status} value={status}>{t(status)}</option>)}
      </select>
      <button type="button" className="admin-icon" disabled={!search.values.q && search.values.status === "all"} onClick={() => search.change({ q: "", status: "all" }, true)} aria-label={t("clearSearch")} title={t("clearSearch")}><X size={17} /></button>
    </form>
    <div className="admin-toolbar message-delete-tools">
      <span>{t("selectedMessages", { count: chosen.length })}</span>
      <button type="button" className="admin-button" disabled={!chosen.length || pending} onClick={() => startTransition(async () => {
        setMessage("");
        try {
          const result = await markMessagesRead(chosen);
          setMessage(result.ok ? t("markedRead", { count: result.data.updated }) : result.message);
          if (result.ok) { setSelected([]); router.refresh(); }
        } catch { setMessage(c("error")); }
      })}><MailOpen size={17} />{t("markSelectedRead")}</button>
      <button type="button" className="admin-button danger" disabled={!chosen.length || pending} onClick={() => { setMessage(""); setRemoved(0); setMode("selected"); }}><Trash2 size={17} />{t("deleteSelected")}</button>
      <button type="button" className="admin-button danger" disabled={pending} onClick={() => { setMessage(""); setRemoved(0); setMode("all"); }}><Trash2 size={17} />{t("deleteAll")}</button>
    </div>
    {message && !mode && <p role="status">{message}</p>}
    {!messages.length ? <p className="admin-empty">{t(filter.q || filter.status !== "all" ? "noMatches" : "empty")}</p> : <div className="admin-table-wrap"><table className="admin-table">
      <thead><tr><th><input type="checkbox" aria-label={t("selectPage")} checked={checked} disabled={pending} onChange={(event) => setSelected(event.target.checked ? messages.map((item) => item.id) : [])} /></th>
        {["name", "email", "phone", "ip", "message", "date", "status", "actions"].map((key) => <th key={key}>{t(key)}</th>)}</tr></thead>
      <tbody>{messages.map((item) => <tr key={item.id} className="message-row" tabIndex={0} aria-label={t("openMessageFrom", { name: item.name })}
        onClick={(event) => {
          if ((event.target as Element).closest("a,button,input,select,label,dialog") || window.getSelection()?.toString()) return;
          const url = `/admin/messages/${item.id}`;
          if (event.ctrlKey || event.metaKey) window.open(url, "_blank", "noopener,noreferrer");
          else router.push(url);
        }}
        onKeyDown={(event) => {
          if (event.target !== event.currentTarget || !["Enter", " "].includes(event.key)) return;
          event.preventDefault(); router.push(`/admin/messages/${item.id}`);
        }}>
        <td><input type="checkbox" aria-label={t("selectMessage", { name: item.name })} disabled={pending} checked={chosen.includes(item.id)} onChange={(event) => setSelected(event.target.checked ? [...chosen, item.id] : chosen.filter((id) => id !== item.id))} /></td>
        <td><Link href={`/admin/messages/${item.id}`}>{item.name}</Link></td>
        <td>{item.email ? <a href={`mailto:${item.email}`}><bdi>{item.email}</bdi></a> : "-"}</td>
        <td><a href={`tel:${item.phone}`}><bdi dir="ltr">{item.phone}</bdi></a></td>
        <td><bdi className="message-ip" dir="ltr">{item.ip || t("unknownIp")}</bdi></td>
        <td><span className="message-preview">{item.message}</span></td>
        <td>{item.createdAt && new Intl.DateTimeFormat(locale, { dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Riyadh" }).format(new Date(item.createdAt))}</td>
        <td><span className={`message-status ${item.status}`}>{t(item.status)}</span></td>
        <td><div className="admin-actions">{item.ip && <IpBlockButton ip={item.ip} blocked={blockedIps.includes(item.ip)} />}
          <DeleteButton action={() => deleteMessages({ mode: "selected", ids: [item.id] })} onDeleted={() => router.refresh()} /></div></td>
      </tr>)}</tbody>
    </table></div>}
    <nav className="admin-pagination">
      {filter.after && <Link className="admin-button" href={messageListHref(filter)}>{t("previous")}</Link>}
      {next && <Link className="admin-button" href={messageListHref(filter, next)}>{t("more")}</Link>}
    </nav>
    <Dialog open={mode !== null} title={t(mode === "all" ? "confirmDeleteAll" : "confirmDeleteSelected")} onClose={() => { if (!pending) setMode(null); }}>
      <p>{mode === "all" ? t("deleteAllWarning") : t("deleteSelectedWarning", { count: chosen.length })}</p>
      {(pending || removed > 0) && <p role="status">{t("deletedMessages", { count: removed })}</p>}
      {message && <p role="alert">{message}</p>}
      <div className="admin-actions"><button type="button" className="admin-button danger" disabled={pending} onClick={remove}>{pending ? <LoaderCircle className="spin" size={17} /> : <Trash2 size={17} />}{c("delete")}</button>
        <button type="button" className="admin-button" disabled={pending} onClick={() => setMode(null)}>{c("cancel")}</button></div>
    </Dialog>
  </>;
}
