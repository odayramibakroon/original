"use client";
import Link from "next/link";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { KeyRound, LogOut, Eye, EyeOff } from "lucide-react";
import { passwordSchema, type PasswordInput } from "../domain/password-schema";
import { changePassword } from "../application/change-password";
import { signOutOtherDevices } from "../application/account-actions";
import { syncCurrentPush } from "@/features/notifications/application/sync-current-push";
import { Dialog } from "@/shared/components/Dialog";

export function AccountSettings({ uid, email }: { uid: string; email: string }) {
  const t = useTranslations("account");
  const common = useTranslations("cms");
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState("");
  const [devicesMessage, setDevicesMessage] = useState("");
  const [needsSignIn, setNeedsSignIn] = useState(false);
  const [open, setOpen] = useState(false);
  const [visible, setVisible] = useState<Partial<Record<keyof PasswordInput, boolean>>>({});
  const form = useForm<PasswordInput>({ resolver: zodResolver(passwordSchema), defaultValues: { currentPassword: "", newPassword: "", confirmPassword: "" } });
  return <>
    <h1>{t("title")}</h1>
    <section className="admin-section account-section" aria-labelledby="password-heading">
      <h2 id="password-heading">{t("changePassword")}</h2>
      <form className="account-form" noValidate onSubmit={form.handleSubmit((values) => startTransition(async () => {
        setMessage(""); setNeedsSignIn(false);
        try {
          const result = await changePassword(values, { uid, email });
          setMessage(t(result.key)); setNeedsSignIn(result.changed && !result.ok);
          if (result.changed) form.reset();
          if (result.ok) router.refresh();
        } catch { setMessage(t("error")); }
      }))}>
        <label>{t("email")}<input type="email" name="username" autoComplete="username" value={email} readOnly dir="ltr" /></label>
        {(["currentPassword", "newPassword", "confirmPassword"] as const).map((key) => <div key={key}>
          <label htmlFor={`account-${key}`}>{t(key)}</label>
          <div className="account-password"><input id={`account-${key}`} type={visible[key] ? "text" : "password"} dir="ltr" autoComplete={key === "currentPassword" ? "current-password" : "new-password"}
            maxLength={key === "currentPassword" ? undefined : 128} disabled={pending || needsSignIn} aria-invalid={Boolean(form.formState.errors[key])} aria-describedby={form.formState.errors[key] ? `${key}-error` : undefined} {...form.register(key)} />
            <button type="button" className="admin-icon" aria-label={t(visible[key] ? "hidePassword" : "showPassword")} title={t(visible[key] ? "hidePassword" : "showPassword")} aria-pressed={Boolean(visible[key])} onClick={() => setVisible({ ...visible, [key]: !visible[key] })}>{visible[key] ? <EyeOff size={18} /> : <Eye size={18} />}</button>
          </div>
          {form.formState.errors[key] && <p id={`${key}-error`} className="admin-field-error" role="alert">{t(form.formState.errors[key]!.message!)}</p>}
        </div>)}
        <div className="admin-actions"><button className="admin-button primary" disabled={pending || needsSignIn}><KeyRound size={17} />{t(pending ? "saving" : "changePassword")}</button>
          {needsSignIn && <Link className="admin-button" href="/login">{t("signIn")}</Link>}</div>
        <p role="status">{message}</p>
      </form>
    </section>
    <section className="admin-section operational-section account-section" aria-labelledby="devices-heading">
      <h2 id="devices-heading">{t("devices")}</h2>
      <button type="button" className="admin-button danger" disabled={pending || needsSignIn} onClick={() => { setDevicesMessage(""); setOpen(true); }}><LogOut size={17} />{t("signOutOthers")}</button>
      {!open && <p role="status">{devicesMessage}</p>}
    </section>
    <Dialog open={open} title={t("confirmOthers")} onClose={() => { if (!pending) setOpen(false); }}>
      <p>{t("othersWarning")}</p>
      {devicesMessage && <p role="alert">{devicesMessage}</p>}
      <div className="admin-actions"><button className="admin-button danger" disabled={pending} onClick={() => startTransition(async () => {
        try {
          if (!await syncCurrentPush()) { setDevicesMessage(t("pushSyncError")); return; }
          const result = await signOutOtherDevices();
          setDevicesMessage(result.message);
          if (result.ok) { setOpen(false); router.refresh(); }
        } catch { setDevicesMessage(t("error")); }
      })}><LogOut size={17} />{t("signOutOthers")}</button>
        <button className="admin-button" disabled={pending} onClick={() => setOpen(false)}>{common("cancel")}</button></div>
    </Dialog>
  </>;
}
