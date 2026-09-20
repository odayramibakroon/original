"use client";
import Image from "next/image";
import Link from "next/link";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { FormProvider, useFieldArray, useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { Save, Plus, X, Star } from "lucide-react";
import { productSchema, type ProductInput } from "../../domain/product-schema";
import { saveProduct } from "../../application/product-actions";
import { BilingualField, CmsField } from "@/features/admin/presentation/FormFields";
import { MediaPicker } from "@/features/media/presentation/MediaPicker";
import { imageUrlSchema } from "@/core/validation/cms";

export function ProductEditor({ initial, id = null }: { initial: ProductInput; id?: string | null }) {
  const t = useTranslations("cms");
  const router = useRouter();
  const [result, setResult] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [imageError, setImageError] = useState("");
  const [pending, startTransition] = useTransition();
  const form = useForm<ProductInput>({ resolver: zodResolver(productSchema), defaultValues: initial, mode: "onBlur" });
  const features = useFieldArray({ control: form.control, name: "features" });
  const images = useWatch({ control: form.control, name: "images" });
  const mainImage = useWatch({ control: form.control, name: "mainImage" });
  function addImage(url: string) {
    if (!imageUrlSchema.safeParse(url).success || images.length >= 12) { setImageError(t("invalid")); return; }
    if (!images.includes(url)) form.setValue("images", [...images, url], { shouldDirty: true, shouldValidate: true });
    if (!mainImage) form.setValue("mainImage", url, { shouldDirty: true, shouldValidate: true });
    setImageUrl(""); setImageError("");
  }
  function removeImage(url: string) {
    const next = images.filter((item) => item !== url);
    form.setValue("images", next, { shouldDirty: true, shouldValidate: true });
    if (mainImage === url) form.setValue("mainImage", next[0] ?? "", { shouldDirty: true, shouldValidate: true });
  }
  return <FormProvider {...form}><form className="cms-form" noValidate onSubmit={form.handleSubmit((values) => startTransition(async () => {
    setResult("");
    try {
      const response = await saveProduct(id, values); setResult(response.message);
      if (response.ok) { form.reset(values); if (!id) router.replace(`/admin/products/${response.data.id}/edit`); router.refresh(); }
      else for (const [field, message] of Object.entries(response.errors ?? {})) form.setError(field as keyof ProductInput, { message });
    } catch { setResult(t("error")); }
  }), () => setResult(t("invalid")))}>
    <CmsField path="slug" label={t("fields.slug")} direction="ltr" />
    {(["name", "category", "shortDescription", "description", "weight", "pack", "type", "ingredients"] as const).map((field) => <BilingualField key={field} path={field} field={field} />)}
    <div className="cms-two-columns"><CmsField path="pieces" label={t("fields.pieces")} kind="number" /><CmsField path="sortOrder" label={t("fields.sortOrder")} kind="number" /></div>
    <CmsField path="isPublished" label={t("fields.isPublished")} kind="checkbox" />
    <section className="cms-array"><div className="admin-heading"><h2>{t("fields.features")}</h2><button className="admin-button" type="button" onClick={() => features.append({ ar: "", en: "" })}><Plus size={16} />{t("add")}</button></div>
      {features.fields.map((field, index) => <div className="cms-array-row" key={field.id}><button type="button" className="admin-icon" aria-label={t("delete")} title={t("delete")} onClick={() => features.remove(index)}><X size={16} /></button><BilingualField path={`features.${index}`} field="features" /></div>)}
    </section>
    <section className="cms-array"><h2>{t("images")}</h2>
      <div className="admin-toolbar"><label className="cms-image-url"><span>{t("fields.imageUrl")}</span><input type="url" dir="ltr" value={imageUrl} onChange={(event) => setImageUrl(event.target.value)} /></label>
        <button type="button" className="admin-button" onClick={() => addImage(imageUrl)}><Plus size={16} />{t("add")}</button><MediaPicker onSelect={addImage} />
      </div>
      {(imageError || form.formState.errors.images || form.formState.errors.mainImage) && <p className="admin-field-error">{imageError || t("invalid")}</p>}
      <div className="product-editor-images">{images.map((url) => <div key={url}><div className="editor-image"><Image src={url} alt="" fill sizes="140px" /></div>
        <div className="admin-actions"><button type="button" className="admin-icon" aria-label={t("makeMain")} title={t("makeMain")} aria-pressed={mainImage === url} onClick={() => form.setValue("mainImage", url, { shouldDirty: true, shouldValidate: true })}><Star size={16} fill={mainImage === url ? "currentColor" : "none"} /></button>
          <button type="button" className="admin-icon" title={t("removeImage")} aria-label={t("removeImage")} onClick={() => removeImage(url)}><X size={16} /></button></div>
      </div>)}</div>
    </section>
    <div className="cms-form-footer"><button className="admin-button primary" disabled={pending}><Save size={17} />{t(pending ? "saving" : "save")}</button><Link className="admin-button" href="/admin/products">{t("back")}</Link><p role="status">{result}</p></div>
  </form></FormProvider>;
}
