"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { useTranslations } from "next-intl";
import { LayoutDashboard, Package, PanelsTopLeft, Image, Sparkles, Factory, MapPin, Share2, Mail, Images, Settings, UserRoundCog, Menu, X, AlignVerticalJustifyStart, PanelTop, PanelBottom } from "lucide-react";

const entries = [
  ["/admin", "dashboard", LayoutDashboard], ["/admin/products", "products", Package],
  ["/admin/content", "content", PanelsTopLeft], ["/admin/content/hero", "hero", Image],
  ["/admin/content/benefits", "benefits", Sparkles], ["/admin/content/factory", "factory", Factory],
  ["/admin/content/navigation", "navigation", PanelTop], ["/admin/content/footer", "footer", PanelBottom],
  ["/admin/content/layout", "layout", AlignVerticalJustifyStart], ["/admin/content/contact", "contact", Mail],
  ["/admin/branches", "branches", MapPin], ["/admin/socials", "socials", Share2],
  ["/admin/messages", "messages", Mail], ["/admin/media", "media", Images], ["/admin/settings", "settings", Settings],
  ["/admin/account", "account", UserRoundCog],
] as const;

export function AdminSidebar() {
  const t = useTranslations("cms");
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  return <>
    <button type="button" className="admin-menu-toggle admin-icon" aria-expanded={open} aria-controls="admin-sidebar" aria-label={t("menu")} title={t("menu")} onClick={() => setOpen(!open)}>{open ? <X size={20} /> : <Menu size={20} />}</button>
    {open && <button className="admin-sidebar-backdrop" type="button" aria-label={t("close")} onClick={() => setOpen(false)} />}
    <aside id="admin-sidebar" className={`admin-sidebar ${open ? "open" : ""}`}><nav>{entries.map(([href, label, Icon]) => {
      const active = href === "/admin" || href === "/admin/content" ? pathname === href : pathname.startsWith(href);
      return <Link href={href} key={href} aria-current={active ? "page" : undefined} onClick={() => setOpen(false)}><Icon size={17} /><span>{t(label)}</span></Link>;
    })}</nav></aside>
  </>;
}
