import { expect, it } from "vitest";
import { defaultSiteDocument } from "../data/default-site-document";
import { siteSectionSchemas, isSiteSection } from "./site-schema";

it("validates editable defaults and rejects unsafe links or duplicate section order", () => {
  const defaults = defaultSiteDocument();
  expect(defaults.contact.emailPlaceholder.en).toBe("Email address");
  expect(siteSectionSchemas.hero.safeParse({ ...defaults.hero, productsHref: "javascript:alert(1)" }).success).toBe(false);
  expect(siteSectionSchemas.hero.safeParse({ ...defaults.hero, overlayOpacity: 2 }).success).toBe(false);
  expect(siteSectionSchemas.layout.safeParse({ sections: ["products", "products", "factory", "contact"] }).success).toBe(false);
  expect(isSiteSection("__proto__")).toBe(false);
  expect(siteSectionSchemas.settings.safeParse({ ...defaults.settings, whatsAppPhone: "+---" }).success).toBe(false);
  expect(siteSectionSchemas.settings.safeParse({ ...defaults.settings, whatsAppPhone: "" }).success).toBe(true);
});
