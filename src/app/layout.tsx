import type { Metadata } from "next";
import { Cairo } from "next/font/google";
import { NextIntlClientProvider } from "next-intl";
import { getLocale, getTranslations } from "next-intl/server";
import "./globals.css";
import { getPublicSite } from "@/features/site-settings/application/public-site";
import { pickLocalized, type Locale } from "@/core/i18n/localized-text";

const cairo = Cairo({
  variable: "--font-cairo",
  subsets: ["arabic", "latin"],
  weight: ["400", "500", "600", "700", "800", "900"],
  display: "swap",
});

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("metadata");
  const locale = await getLocale();
  const site = await getPublicSite();
  const title = pickLocalized(site.settings.seoTitle, locale as Locale) || t("title");
  const description = pickLocalized(site.settings.seoDescription, locale as Locale) || t("description");
  return {
    metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"),
    title, description,
    openGraph: {
      title, description, images: [site.hero.desktopImage],
      locale: locale === "ar" ? "ar_SA" : "en_US", type: "website",
    },
  };
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const locale = await getLocale();
  return (
    <html
      lang={locale}
      dir={locale === "ar" ? "rtl" : "ltr"}
      data-scroll-behavior="smooth"
      className={`${cairo.variable} h-full antialiased`}
    >
      <body><NextIntlClientProvider key={locale}>{children}</NextIntlClientProvider></body>
    </html>
  );
}
