import Link from "next/link";
import { Pencil } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { authorizeAdminPage } from "@/features/admin/application/authorize-page";

export default async function Content() {
  await authorizeAdminPage("/admin/content");
  const t = await getTranslations("cms");
  return <><h1>{t("content")}</h1><div className="content-sections">{["hero", "benefits", "products", "factory", "contact", "navigation", "footer", "layout"].map((section) => <Link key={section} href={`/admin/content/${section}`}><span>{t(section)}</span><Pencil size={16} /></Link>)}</div></>;
}
