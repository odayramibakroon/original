"use client";
import { useState, useTransition } from "react";
import { FormProvider, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Save } from "lucide-react";
import { useTranslations } from "next-intl";
import { siteSectionSchemas, type SiteSection, type SiteDocument } from "../domain/site-schema";
import { saveSiteSection } from "../application/site-actions";
import { EditableFields } from "@/features/admin/presentation/FormFields";

export function SiteEditor({ section, initial }: { section: SiteSection; initial: SiteDocument[SiteSection] }) {
  const t = useTranslations("cms");
  const [result, setResult] = useState("");
  const [pending, startTransition] = useTransition();
  const schema = siteSectionSchemas[section] as z.ZodType<Record<string, unknown>, Record<string, unknown>>;
  const form = useForm<Record<string, unknown>>({ resolver: zodResolver(schema), defaultValues: initial, mode: "onBlur" });
  return <FormProvider {...form}><form className="cms-form" noValidate onSubmit={form.handleSubmit((values) => startTransition(async () => {
    setResult("");
    try {
      const response = await saveSiteSection(section, values); setResult(response.message);
      if (response.ok) form.reset(values);
      else for (const [key, message] of Object.entries(response.errors ?? {})) form.setError(key, { message });
    } catch { setResult(t("error")); }
  }), () => setResult(t("invalid")))}>
    <EditableFields scope={section} value={initial} />
    <div className="cms-form-footer"><button className="admin-button primary" disabled={pending}><Save size={17} />{t(pending ? "saving" : "save")}</button>
      <p role="status">{result}</p>
    </div>
  </form></FormProvider>;
}
