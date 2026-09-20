"use client";

import { Menu, X } from "lucide-react";
import { useState } from "react";
import { useHeaderScroll } from "@/features/home/presentation/hooks/useHeaderScroll";
import { LanguageSwitcher } from "@/shared/components/LanguageSwitcher";
import Link from "next/link";
import Image from "next/image";

type HeaderProps = {
  solid?: boolean;
  logoUrl?: string;
  navigation: {
    logoText: string;
    links: Array<{
      label: string;
      href: string;
    }>;
    productsCta: string;
    menuLabel: string;
    closeMenuLabel: string;
  };
};

export function Header({ navigation, solid = false, logoUrl }: HeaderProps) {
  const isScrolled = useHeaderScroll();
  const [isOpen, setIsOpen] = useState(false);

  function closeMenu() {
    setIsOpen(false);
  }

  return (
    <>
      <header className={`header ${isScrolled || solid ? "scrolled" : ""}`}>
        <nav className="nav">
          <Link href={solid ? "/" : "#home"} className="logo" onClick={closeMenu}>
            {logoUrl ? <Image src={logoUrl} alt="" width={34} height={34} className="brand-image" /> :
            <span className="logo-mark" aria-hidden="true">
              ح
            </span>}
            <span>{navigation.logoText}</span>
          </Link>

          <div className="nav-links">
            {navigation.links.map((link, index) => (
              <Link href={solid && link.href.startsWith("#") ? `/${link.href}` : link.href} key={`${index}-${link.href}`}>
                {link.label}
              </Link>
            ))}
          </div>

          <LanguageSwitcher />
          <Link href="/products" className="header-btn">
            {navigation.productsCta}
          </Link>

          <button
            type="button"
            className="menu-btn"
            aria-label={isOpen ? navigation.closeMenuLabel : navigation.menuLabel}
            aria-expanded={isOpen}
            onClick={() => setIsOpen((current) => !current)}
          >
            {isOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </nav>
      </header>

      <div className={`mobile-menu ${isOpen ? "open" : ""}`}>
        {navigation.links.map((link, index) => (
          <Link href={solid && link.href.startsWith("#") ? `/${link.href}` : link.href} key={`${index}-${link.href}`} onClick={closeMenu}>
            {link.label}
          </Link>
        ))}
      </div>
    </>
  );
}
