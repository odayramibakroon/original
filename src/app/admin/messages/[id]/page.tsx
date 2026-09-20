import Link from "next/link";
import { Phone, MessageCircle } from "lucide-react";
import { getLocale, getTranslations } from "next-intl/server";
import { authorizeAdminPage } from "@/features/admin/application/authorize-page";
import { getContactMessage } from "@/features/admin/infrastructure/messages";
import { MessageStatus } from "@/features/admin/presentation/MessageStatus";
import { buildWhatsAppUrl } from "@/core/utils/whatsapp";
import { logger } from "@/core/logger";

export default async function Message({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await authorizeAdminPage(`/admin/messages/${id}`);
  const t = await getTranslations("admin");
  const locale = await getLocale();
  let message;
  try { message = await getContactMessage(id); }
  catch (error) {
    logger.error("Could not load message.", { error: error instanceof Error ? error.name : "unknown" });
    return <p role="alert">{t("unavailable")}</p>;
  }
  if (!message) return <p>{t("notFound")}</p>;
  return <>
    <Link href="/admin/messages">{t("back")}</Link>
    <dl className="message-details">
      <div><dt>{t("name")}</dt><dd>{message.name}</dd></div>
      <div><dt>{t("email")}</dt><dd>{message.email ? <a href={`mailto:${message.email}`}><bdi>{message.email}</bdi></a> : "-"}</dd></div>
      <div><dt>{t("phone")}</dt><dd><bdi dir="ltr">{message.phone}</bdi></dd></div>
      <div><dt>{t("date")}</dt><dd>{message.createdAt && new Intl.DateTimeFormat(locale, { dateStyle: "long", timeStyle: "short", timeZone: "Asia/Riyadh" }).format(new Date(message.createdAt))}</dd></div>
      <div><dt>{t("message")}</dt><dd className="message-body">{message.message}</dd></div>
    </dl>
    <div className="admin-actions">
      <a className="admin-button" href={`tel:${message.phone}`}><Phone size={16} />{t("call")}</a>
      <a className="admin-button" href={buildWhatsAppUrl(message.phone, "")} target="_blank" rel="noopener noreferrer"><MessageCircle size={16} />{t("whatsapp")}</a>
    </div>
    <hr className="my-6" />
    <MessageStatus id={id} initial={message.status} />
  </>;
}
