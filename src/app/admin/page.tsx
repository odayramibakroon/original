import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { authorizeAdminPage } from "@/features/admin/application/authorize-page";
import { getDashboard } from "@/features/admin/infrastructure/dashboard-repository";
import { InitializeContent } from "@/features/admin/presentation/InitializeContent";
import { AdminUnavailable } from "@/features/admin/presentation/AdminUnavailable";
import { logger } from "@/core/logger";

export default async function Dashboard() {
  await authorizeAdminPage("/admin");
  const t = await getTranslations("cms");
  let data;
  try { data = await getDashboard(); } catch { logger.error("Could not load dashboard."); return <AdminUnavailable />; }
  return <>
    <div className="admin-heading"><h1>{t("dashboard")}</h1>{!data.initialized && <InitializeContent />}</div>
    <div className="admin-metrics">
      {[["totalProducts", data.products, "/admin/products"], ["publishedProducts", data.published, "/admin/products"], ["totalMessages", data.messages, "/admin/messages"], ["unread", data.unread, "/admin/messages"]].map(([key, value, href]) => <Link className="admin-metric" href={String(href)} key={key}><span>{t(String(key))}</span><strong>{value}</strong></Link>)}
    </div>
    <section className="admin-section"><div className="admin-heading"><h2>{t("recentMessages")}</h2><Link href="/admin/messages">{t("view")}</Link></div>
      {data.recent.length ? <div className="admin-table-wrap"><table className="admin-table"><thead><tr><th>{t("fields.name")}</th><th>{t("email")}</th><th>{t("createdAt")}</th></tr></thead>
        <tbody>{data.recent.map((message) => <tr key={message.id}><td><Link href={`/admin/messages/${message.id}`}>{message.name}</Link></td><td><bdi>{message.email || "-"}</bdi></td><td>{message.createdAt.slice(0, 10)}</td></tr>)}</tbody></table></div> : <p className="admin-empty">{t("empty")}</p>}
    </section>
  </>;
}
