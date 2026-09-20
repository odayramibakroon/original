"use client";
import { useFieldArray, useFormContext, useWatch } from "react-hook-form";
import { useTranslations } from "next-intl";
import { ArrowUp, ArrowDown, Plus, Trash2 } from "lucide-react";
import { MediaPicker } from "@/features/media/presentation/MediaPicker";

const longFields = new Set(["description", "shortDescription", "text", "cardText", "footerDescription", "seoDescription", "ingredients", "success", "error"]);
const imageFields = new Set(["mainImage", "desktopImage", "mobileImage", "imageUrl", "logoUrl"]);

export function CmsField({ path, label, kind = "text", direction }: { path: string; label: string; kind?: "text" | "number" | "checkbox" | "textarea" | "image" | "locale"; direction?: "rtl" | "ltr" }) {
  const { register, getFieldState, setValue, formState: { isReady } } = useFormContext<Record<string, unknown>>();
  const t = useTranslations("cms");
  const error = getFieldState(path).error;
  const id = `field-${path}`;
  const props = { id, disabled: !isReady, "aria-invalid": Boolean(error), "aria-describedby": error ? `${id}-error` : undefined };
  return <div className={`cms-field ${kind === "checkbox" ? "cms-check" : ""}`}>
    <label htmlFor={id}>{label}</label>
    {kind === "textarea" ? <textarea {...props} {...register(path)} dir={direction} rows={3} />
      : kind === "locale" ? <select {...props} {...register(path)}><option value="ar">{t("arabic")}</option><option value="en">{t("english")}</option></select>
      : <input {...props} type={kind === "number" ? "number" : kind === "checkbox" ? "checkbox" : "text"}
        step={path.endsWith("overlayOpacity") ? "0.01" : kind === "number" ? "1" : undefined}
        {...register(path, kind === "number" ? { valueAsNumber: true } : {})} dir={direction} />}
    {kind === "image" && <MediaPicker onSelect={(url) => setValue(path, url, { shouldDirty: true, shouldValidate: true })} />}
    {error && <small id={`${id}-error`} className="admin-field-error">{t("invalid")}</small>}
  </div>;
}

export function BilingualField({ path, field }: { path: string; field: string }) {
  const t = useTranslations("cms");
  return <fieldset className="cms-bilingual"><legend>{t(`fields.${field}`)}</legend><div className="cms-two-columns">
    <CmsField path={`${path}.ar`} label={`${t(`fields.${field}`)} - ${t("arabic")}`} kind={longFields.has(field) ? "textarea" : "text"} direction="rtl" />
    <CmsField path={`${path}.en`} label={`${t(`fields.${field}`)} - ${t("english")}`} kind={longFields.has(field) ? "textarea" : "text"} direction="ltr" />
  </div></fieldset>;
}

const templates: Record<string, Record<string, unknown>> = {
  "navigation.links": { label: { ar: "", en: "" }, href: "/" },
  "benefits.items": { icon: "", title: { ar: "", en: "" }, description: { ar: "", en: "" }, isActive: true },
  "factory.stats": { value: "", label: { ar: "", en: "" } },
  "branches.items": { name: { ar: "", en: "" }, address: { ar: "", en: "" }, phone: "", url: "#", isActive: true, sortOrder: 0 },
  "socials.items": { label: "Instagram", url: "", isActive: true },
};

function ObjectArray({ path, scope }: { path: string; scope: string }) {
  const { control, setValue } = useFormContext<Record<string, unknown>>();
  // The selected section schema supplies these dynamic object-array paths.
  const array = useFieldArray({ control, name: path as never });
  const t = useTranslations("cms");
  const current = useWatch({ control, name: path });
  const values = Array.isArray(current) ? current : [];
  const fieldName = path.split(".").at(-1)!;
  function move(from: number, to: number) {
    array.move(from, to);
    if (scope === "branches") values.forEach((_, index) => setValue(`${path}.${index}.sortOrder` as string, index, { shouldDirty: true }));
  }
  function append() {
    const template = structuredClone(templates[`${scope}.${path}`]);
    if (scope === "branches") template.sortOrder = Math.max(-1, ...values.map((item) => Number(item.sortOrder) || 0)) + 1;
    array.append(template as never);
  }
  return <section className="cms-array">
    <div className="admin-heading"><h2>{t(`fields.${fieldName}`)}</h2><button type="button" className="admin-button" onClick={append}><Plus size={16} />{t("add")}</button></div>
    {array.fields.map((row, index) => <div className="cms-array-row" key={row.id}>
      <div className="admin-actions cms-row-actions"><span>{index + 1}</span>
        <button type="button" className="admin-icon" title={t("up")} aria-label={t("up")} disabled={index === 0} onClick={() => move(index, index - 1)}><ArrowUp size={16} /></button>
        <button type="button" className="admin-icon" title={t("down")} aria-label={t("down")} disabled={index === array.fields.length - 1} onClick={() => move(index, index + 1)}><ArrowDown size={16} /></button>
        <button type="button" className="admin-icon danger" title={t("delete")} aria-label={t("delete")} onClick={() => array.remove(index)}><Trash2 size={16} /></button>
      </div>
      <EditableFields value={values[index] as Record<string, unknown> ?? templates[`${scope}.${path}`]} scope={scope} path={`${path}.${index}`} />
    </div>)}
  </section>;
}

function SectionOrder({ path }: { path: string }) {
  const { control, setValue } = useFormContext<Record<string, unknown>>();
  const value = useWatch({ control, name: path }) as string[];
  const t = useTranslations("cms");
  function move(from: number, to: number) { const next = [...value]; [next[from], next[to]] = [next[to], next[from]]; setValue(path, next, { shouldDirty: true }); }
  return <div>{value.map((section, index) => <div className="cms-order-row" key={section}><span>{t(section)}</span><div className="admin-actions">
    <button type="button" className="admin-icon" title={t("up")} aria-label={t("up")} disabled={!index} onClick={() => move(index, index - 1)}><ArrowUp size={17} /></button>
    <button type="button" className="admin-icon" title={t("down")} aria-label={t("down")} disabled={index === value.length - 1} onClick={() => move(index, index + 1)}><ArrowDown size={17} /></button>
  </div></div>)}</div>;
}

export function EditableFields({ value, scope, path = "" }: { value: Record<string, unknown>; scope: string; path?: string }) {
  const t = useTranslations("cms");
  return <>{Object.entries(value).map(([key, data]) => {
    const name = path ? `${path}.${key}` : key;
    if (data && typeof data === "object" && !Array.isArray(data) && "ar" in data && "en" in data) return <BilingualField key={name} path={name} field={key} />;
    if (Array.isArray(data)) return key === "sections" ? <SectionOrder key={name} path={name} /> : <ObjectArray key={name} path={name} scope={scope} />;
    return <CmsField key={name} path={name} label={t(`fields.${key}`)}
      kind={typeof data === "boolean" ? "checkbox" : typeof data === "number" ? "number" : imageFields.has(key) ? "image" : key === "defaultLocale" ? "locale" : "text"}
      direction={imageFields.has(key) || ["url", "href", "email", "productsHref", "contactHref"].includes(key) ? "ltr" : undefined} />;
  })}</>;
}
