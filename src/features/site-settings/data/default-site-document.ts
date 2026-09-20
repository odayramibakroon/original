import { homeContent } from "@/features/home/data/home-content";
import { defaultSiteSettings } from "./default-site-settings";
import { siteSectionSchemas, type SiteDocument } from "../domain/site-schema";

export function defaultSiteDocument(): SiteDocument {
  return {
    navigation: siteSectionSchemas.navigation.parse(homeContent.navigation),
    hero: siteSectionSchemas.hero.parse(homeContent.hero),
    benefits: siteSectionSchemas.benefits.parse(homeContent.benefits),
    products: siteSectionSchemas.products.parse(homeContent.products),
    factory: siteSectionSchemas.factory.parse(homeContent.factory),
    contact: siteSectionSchemas.contact.parse(homeContent.contact),
    footer: siteSectionSchemas.footer.parse(homeContent.footer),
    settings: siteSectionSchemas.settings.parse(defaultSiteSettings),
    branches: siteSectionSchemas.branches.parse({ items: defaultSiteSettings.branches }),
    socials: siteSectionSchemas.socials.parse({ items: defaultSiteSettings.socials }),
    layout: { sections: ["benefits", "products", "factory", "contact"] },
  };
}
