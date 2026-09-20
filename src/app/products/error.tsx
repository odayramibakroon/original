"use client";
import { useTranslations } from "next-intl";
import { RefreshCw } from "lucide-react";
export default function ProductError({ reset }: { reset: () => void }) {
  const t = useTranslations("catalog");
  return <main className="catalog-main container"><p role="alert">{t("error")}</p><button className="btn" onClick={reset}><RefreshCw size={18} />{t("retry")}</button></main>;
}
