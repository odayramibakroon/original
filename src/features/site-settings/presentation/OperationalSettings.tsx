"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Save, ShieldBan, ShieldCheck, Plus } from "lucide-react";
import { useTranslations } from "next-intl";
import type { AdminResult } from "@/core/auth/admin-action";
import type { BlockedContactIp, ContactPolicy } from "@/features/contact/domain/contact-policy";
import { MAX_IMAGE_BYTES } from "@/features/media/domain/MediaAsset";
import { saveContactPolicy, saveMediaLimit, setContactIpBlocked } from "../application/operational-actions";
import { Dialog } from "@/shared/components/Dialog";

function NumberSetting({ id, label, initial, max, action }: {
  id: string; label: string; initial: number; max: number; action: (value: number) => Promise<AdminResult>;
}) {
  const t = useTranslations("cms");
  const [result, setResult] = useState("");
  const [pending, startTransition] = useTransition();
  const form = useForm({ defaultValues: { value: initial }, resolver: zodResolver(z.object({ value: z.number().int().min(1).max(max) })) });
  return <form className="operational-number" noValidate onSubmit={form.handleSubmit(({ value }) => startTransition(async () => {
    setResult("");
    try { const response = await action(value); setResult(response.message); if (response.ok) form.reset({ value }); }
    catch { setResult(t("error")); }
  }))}>
    <label htmlFor={id}>{label}<input id={id} type="number" min={1} max={max} step={1} disabled={pending || !form.formState.isReady}
      aria-invalid={Boolean(form.formState.errors.value)} aria-describedby={form.formState.errors.value ? `${id}-error` : undefined}
      {...form.register("value", { valueAsNumber: true })} /></label>
    <button className="admin-button primary" disabled={pending}><Save size={17} />{t(pending ? "saving" : "save")}</button>
    {form.formState.errors.value && <p id={`${id}-error`} role="alert">{t("numberRange", { min: 1, max })}</p>}
    <p role="status">{result}</p>
  </form>;
}

export function IpBlockButton({ ip, blocked = false, onChanged }: { ip: string; blocked?: boolean; onChanged?: () => void }) {
  const t = useTranslations("cms");
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [pending, startTransition] = useTransition();
  const Icon = blocked ? ShieldCheck : ShieldBan;
  return <>
    <button type="button" className="admin-icon" title={t(blocked ? "unblockIp" : "blockIp")} aria-label={t(blocked ? "unblockIp" : "blockIp")} onClick={() => { setMessage(""); setOpen(true); }}><Icon size={17} /></button>
    <Dialog open={open} title={t(blocked ? "confirmUnblockIp" : "confirmBlockIp")} onClose={() => { if (!pending) setOpen(false); }}>
      <p><bdi dir="ltr">{ip}</bdi></p>
      {message && <p role="alert">{message}</p>}
      <div className="admin-actions"><button type="button" className="admin-button danger" disabled={pending} onClick={() => startTransition(async () => {
        try { const result = await setContactIpBlocked({ ip, blocked: !blocked }); if (result.ok) { setOpen(false); onChanged?.(); router.refresh(); } else setMessage(result.message); }
        catch { setMessage(t("error")); }
      })}><Icon size={17} />{t(blocked ? "unblockIp" : "blockIp")}</button>
        <button type="button" className="admin-button" disabled={pending} onClick={() => setOpen(false)}>{t("cancel")}</button></div>
    </Dialog>
  </>;
}

export function OperationalSettings({ policy, blocked, maxBytes }: { policy: ContactPolicy; blocked: BlockedContactIp[]; maxBytes: number | null }) {
  const t = useTranslations("cms");
  const router = useRouter();
  const [message, setMessage] = useState("");
  const [pending, startTransition] = useTransition();
  const form = useForm({ defaultValues: { ip: "" }, resolver: zodResolver(z.object({ ip: z.string().trim().pipe(z.union([z.ipv4(), z.ipv6()])) })) });
  return <>
    <section className="admin-section operational-section" aria-labelledby="contact-policy-title">
      <h2 id="contact-policy-title">{t("contactProtection")}</h2>
      <NumberSetting id="daily-messages" label={t("dailyMessagesPerIp")} initial={policy.dailyMessagesPerIp} max={1000}
        action={(value) => saveContactPolicy({ dailyMessagesPerIp: value })} />
      <h3>{t("blockedIps")}</h3>
      <form className="operational-number" noValidate onSubmit={form.handleSubmit(({ ip }) => startTransition(async () => {
        setMessage("");
        try { const result = await setContactIpBlocked({ ip, blocked: true }); setMessage(result.message); if (result.ok) { form.reset(); router.refresh(); } }
        catch { setMessage(t("error")); }
      }))}>
        <label htmlFor="blocked-ip">{t("ipAddress")}<input id="blocked-ip" dir="ltr" autoComplete="off" {...form.register("ip")} aria-invalid={Boolean(form.formState.errors.ip)} aria-describedby={form.formState.errors.ip ? "ip-error" : undefined} /></label>
        <button className="admin-button" disabled={pending}><Plus size={17} />{t("blockIp")}</button>
        {form.formState.errors.ip && <p id="ip-error" role="alert">{t("invalidIp")}</p>}
        <p role="status">{message}</p>
      </form>
      {!blocked.length ? <p className="admin-empty">{t("noBlockedIps")}</p> : <ul className="blocked-ip-list">{blocked.map((item) => <li key={item.ip}><bdi dir="ltr">{item.ip}</bdi><IpBlockButton ip={item.ip} blocked /></li>)}</ul>}
    </section>
    <section className="admin-section operational-section" aria-labelledby="media-policy-title">
      <h2 id="media-policy-title">{t("mediaSettings")}</h2>
      {maxBytes === null ? <p role="alert">{t("mediaSettingsUnavailable")}</p> : <NumberSetting id="max-image-kb" label={t("maxImageKb")}
        initial={Math.floor(maxBytes / 1024)} max={MAX_IMAGE_BYTES / 1024} action={(value) => saveMediaLimit({ maxImageKb: value })} />}
    </section>
  </>;
}
