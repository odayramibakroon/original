import { Header } from "@/features/home/presentation/components/Header";
import { Footer } from "@/features/home/presentation/components/Footer";
import type { getPublicShell } from "@/features/site-settings/application/get-public-shell";

export function PublicFrame({ shell, children }: { shell: Awaited<ReturnType<typeof getPublicShell>>; children: React.ReactNode }) {
  return <><Header navigation={shell.navigation} logoUrl={shell.settings.logoUrl} solid />
    <main className="catalog-main">{children}</main><Footer settings={shell.settings} footer={shell.site.footer} /></>;
}
