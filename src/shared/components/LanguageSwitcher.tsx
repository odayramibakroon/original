"use client";

import { Languages } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useTransition } from "react";
import { setLocale } from "@/core/i18n/actions";

export function LanguageSwitcher() {
  const locale = useLocale();
  const t = useTranslations("language");
  const [pending, startTransition] = useTransition();
  return (
    <label className="language-switcher">
      <Languages size={17} aria-hidden="true" />
      <span className="sr-only">{t("label")}</span>
      <select value={locale} disabled={pending} onChange={(event) => {
        const next = event.target.value;
        startTransition(() => setLocale(next));
      }}>
        <option value="ar" lang="ar">العربية</option>
        <option value="en" lang="en">English</option>
      </select>
    </label>
  );
}
