import { notFound } from "next/navigation";
import { isSiteSection } from "@/features/site-settings/domain/site-schema";
import { SiteEditorPage } from "@/features/site-settings/presentation/SiteEditorPage";

export default async function ContentSection({ params }: { params: Promise<{ section: string }> }) {
  const { section } = await params;
  if (!isSiteSection(section)) notFound();
  return <SiteEditorPage section={section} path={`/admin/content/${section}`} />;
}
