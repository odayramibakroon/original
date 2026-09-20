import Link from "next/link";
import { RefreshMessages } from "@/features/admin/presentation/RefreshMessages";
import { getLocale, getTranslations } from "next-intl/server";
import { authorizeAdminPage } from "@/features/admin/application/authorize-page";
import { listContactMessages } from "@/features/admin/infrastructure/messages";
import { PushControls } from "@/features/notifications/presentation/PushControls";
import { logger } from "@/core/logger";

export default async function Messages({ searchParams }: { searchParams: Promise<{ after?: string }> }) {
  await authorizeAdminPage("/admin/messages");
  const t = await getTranslations("admin");
  const locale = await getLocale();
  const { after } = await searchParams;
  let result;
  try { result = await listContactMessages(after); }
  catch (error) { logger.error("Could not load inbox.", { error: error instanceof Error ? error.name : "unknown" }); }
  return <>
    <div className="admin-heading"><h1>{t("title")}</h1><RefreshMessages /></div>
    <PushControls />
    {!result ? <p role="alert">{t("unavailable")}</p> : result.messages.length === 0 ? <p className="admin-empty">{t("empty")}</p> : <>
      <div className="admin-table-wrap"><table className="admin-table">
        <thead><tr>{["name", "email", "phone", "message", "date", "status"].map((key) => <th key={key}>{t(key)}</th>)}</tr></thead>
        <tbody>{result.messages.map((message) => <tr key={message.id}>
          <td><Link href={`/admin/messages/${message.id}`}>{message.name}</Link></td>
          <td>{message.email ? <a href={`mailto:${message.email}`}><bdi>{message.email}</bdi></a> : "-"}</td>
          <td><a href={`tel:${message.phone}`}><bdi dir="ltr">{message.phone}</bdi></a></td>
          <td><span className="message-preview">{message.message}</span></td>
          <td>{message.createdAt && new Intl.DateTimeFormat(locale, { dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Riyadh" }).format(new Date(message.createdAt))}</td>
          <td><span className={`message-status ${message.status}`}>{t(message.status)}</span></td>
        </tr>)}</tbody>
      </table></div>
      <nav className="admin-pagination">
        {after && <Link className="admin-button" href="/admin/messages">{t("previous")}</Link>}
        {result.next && <Link className="admin-button" href={`/admin/messages?after=${result.next}`}>{t("more")}</Link>}
      </nav>
    </>}
  </>;
}
