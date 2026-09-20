import { getTranslations } from "next-intl/server";
import { authorizeAdminPage } from "@/features/admin/application/authorize-page";
import { AdminUnavailable } from "@/features/admin/presentation/AdminUnavailable";
import { SiteRepository } from "../infrastructure/site-repository";
import type { SiteSection } from "../domain/site-schema";
import { SiteEditor } from "./SiteEditor";
import { logger } from "@/core/logger";

export async function SiteEditorPage({ section, path }: { section: SiteSection; path: string }) {
  await authorizeAdminPage(path);
  const t = await getTranslations("cms");
  let document;
  try { document = await new SiteRepository().get(); }
  catch { logger.error("Could not load site editor."); return <AdminUnavailable />; }
  return <><h1>{t(section)}</h1><SiteEditor section={section} initial={document[section]} /></>;
}
