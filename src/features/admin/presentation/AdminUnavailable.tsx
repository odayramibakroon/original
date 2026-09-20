import { getTranslations } from "next-intl/server";
import { RefreshMessages } from "./RefreshMessages";
export async function AdminUnavailable() { const t = await getTranslations("cms"); return <div><p role="alert">{t("error")}</p><RefreshMessages /></div>; }
