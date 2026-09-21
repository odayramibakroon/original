import { RefreshMessages } from "@/features/admin/presentation/RefreshMessages";
import { getTranslations } from "next-intl/server";
import { authorizeAdminPage } from "@/features/admin/application/authorize-page";
import { listContactMessages } from "@/features/admin/infrastructure/messages";
import { PushControls } from "@/features/notifications/presentation/PushControls";
import { logger } from "@/core/logger";
import { MessageInbox } from "@/features/admin/presentation/MessageInbox";
import { messageQuerySchema } from "@/features/admin/domain/message-query";
import { ContactPolicyRepository } from "@/features/contact/infrastructure/contact-policy-repository";

export default async function Messages({ searchParams }: { searchParams: Promise<{ after?: string; q?: string; status?: string }> }) {
  await authorizeAdminPage("/admin/messages");
  const t = await getTranslations("admin");
  const parsed = messageQuerySchema.safeParse(await searchParams);
  const filter = parsed.success ? parsed.data : messageQuerySchema.parse({});
  let result;
  let blockedIps: string[] = [];
  try {
    result = await listContactMessages(filter);
    blockedIps = (await new ContactPolicyRepository().blocked()).map((item) => item.ip);
  }
  catch (error) { logger.error("Could not load inbox.", { error: error instanceof Error ? error.name : "unknown" }); }
  return <>
    <div className="admin-heading"><h1>{t("title")}</h1><RefreshMessages /></div>
    <PushControls />
    {!result ? <p role="alert">{t("unavailable")}</p> : <MessageInbox {...result} filter={filter} blockedIps={blockedIps} />}
  </>;
}
