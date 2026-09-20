import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { LanguageSwitcher } from "@/shared/components/LanguageSwitcher";
import { LoginForm } from "@/features/admin/presentation/LoginForm";
import { isAdminConfigured } from "@/core/firebase/admin";
import "@/features/admin/presentation/admin.css";

export const metadata = { robots: { index: false, follow: false } };

export default async function Login({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const { next } = await searchParams;
  const destination = next && /^\/admin(?:\/[A-Za-z0-9_-]+)*$/.test(next) ? next : "/admin";
  const t = await getTranslations("admin");
  return <main className="admin-shell">
    <div className="admin-topbar"><Link href="/">{t("home")}</Link><LanguageSwitcher /></div>
    <LoginForm next={destination} configured={isAdminConfigured()} />
  </main>;
}
