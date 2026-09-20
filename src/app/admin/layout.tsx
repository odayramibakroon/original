import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { LogOut } from "lucide-react";
import { LanguageSwitcher } from "@/shared/components/LanguageSwitcher";
import { signOutAdmin } from "@/features/admin/application/auth-actions";
import "@/features/admin/presentation/admin.css";
import { AdminSidebar } from "@/features/admin/presentation/AdminSidebar";

export const metadata = { robots: { index: false, follow: false } };

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const t = await getTranslations("admin");
  const cms = await getTranslations("cms");
  return <div className="admin-shell admin-workspace">
    <header className="admin-topbar">
      <Link href="/admin">{cms("dashboard")}</Link>
      <div className="admin-actions">
        <Link href="/">{t("home")}</Link>
        <LanguageSwitcher />
        <form action={signOutAdmin}><button className="admin-button"><LogOut size={16} />{t("signOut")}</button></form>
      </div>
    </header>
    <AdminSidebar />
    <main className="admin-content">{children}</main>
  </div>;
}
