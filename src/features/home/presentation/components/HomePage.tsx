import type { HomeViewModel } from "@/features/home/application/get-home-view-model";
import { BenefitsSection } from "@/features/home/presentation/components/BenefitsSection";
import { ContactSection } from "@/features/home/presentation/components/ContactSection";
import { FactorySection } from "@/features/home/presentation/components/FactorySection";
import { Footer } from "@/features/home/presentation/components/Footer";
import { Header } from "@/features/home/presentation/components/Header";
import { Hero } from "@/features/home/presentation/components/Hero";
import { RevealController } from "@/features/home/presentation/components/RevealController";
import { ProductsSection } from "@/features/products/presentation/components/ProductsSection";

type HomePageProps = {
  viewModel: HomeViewModel;
};

export function HomePage({ viewModel }: HomePageProps) {
  const { content, settings, products } = viewModel;

  return (
    <>
      <RevealController />
      <Header navigation={content.navigation} logoUrl={settings.logoUrl} solid={!content.hero.isVisible} />
      <main>
        {content.hero.isVisible && <Hero hero={content.hero} />}
        {content.layout.sections.map((section) => {
          if (!content[section].isVisible) return null;
          if (section === "benefits") return <BenefitsSection key={section} benefits={{ ...content.benefits, items: content.benefits.items.filter((item) => item.isActive) }} />;
          if (section === "products") return <ProductsSection key={section} products={products} content={content.products} />;
          if (section === "factory") return <FactorySection key={section} factory={content.factory} />;
          return <ContactSection key={section} contact={content.contact} />;
        })}
      </main>
      <Footer settings={settings} footer={content.footer} />
    </>
  );
}
