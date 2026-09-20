import { z } from "zod";
import { imageUrlSchema, linkSchema, localizedTextSchema as text, optionalLocalizedTextSchema as optionalText } from "@/core/validation/cms";

const short = z.string().trim().min(1).max(120);
const visible = { isVisible: z.boolean().default(true) };
const phone = z.string().trim().max(30).regex(/^[+\d\u0660-\u0669\u06f0-\u06f9\s().-]*$/)
  .refine((value) => !value || (value.match(/[\d\u0660-\u0669\u06f0-\u06f9]/g)?.length ?? 0) >= 7);

export const siteSectionSchemas = {
  navigation: z.object({ links: z.array(z.object({ label: text, href: linkSchema })).max(7), productsCta: text, menuLabel: text, closeMenuLabel: text }),
  hero: z.object({ ...visible, badge: text, titleFirst: text, titleSecond: text, text, productsCta: text, contactCta: text, cardTitle: text, cardText: text,
    desktopImage: imageUrlSchema.default("/og.jpg"), mobileImage: imageUrlSchema.default("/ogm.jpg"),
    productsHref: linkSchema.default("/products"), contactHref: linkSchema.default("/#contact"),
    overlayOpacity: z.number().min(0).max(0.7).default(0.52),
  }),
  benefits: z.object({ ...visible, kicker: text, title: text, text, items: z.array(z.object({ icon: z.string().max(30), title: text, description: text, isActive: z.boolean().default(true) })).max(12) }),
  products: z.object({ ...visible, label: text, title: text, description: text, showAll: text, modalFeaturesTitle: text, modalIngredientsTitle: text }),
  factory: z.object({ ...visible, label: text, title: text, description: optionalText.default({ ar: "", en: "" }), overlayTitle: text, imageAlt: text, imageUrl: imageUrlSchema,
    stats: z.array(z.object({ value: short, label: text })).max(6),
  }),
  contact: z.object({ ...visible, kicker: text, title: text, text, namePlaceholder: text, emailPlaceholder: text, phonePlaceholder: text,
    messagePlaceholder: text, submit: text, sending: text, success: text, error: text,
  }),
  footer: z.object({ company: text, products: text, branches: text, contact: text, about: text, factory: text, quality: text, allProducts: text,
    biscuits: text, cakes: text, whatsApp: text, copyright: text, origin: text }),
  settings: z.object({ factoryName: text, footerDescription: text, phone, whatsAppPhone: phone,
    email: z.string().trim().email().max(254), logoUrl: imageUrlSchema.or(z.literal("")).default(""),
    address: optionalText.default({ ar: "", en: "" }),
    seoTitle: optionalText.default({ ar: "", en: "" }), seoDescription: optionalText.default({ ar: "", en: "" }),
    defaultLocale: z.enum(["ar", "en"]).default("ar"),
  }),
  branches: z.object({ items: z.array(z.object({ name: text, address: text, phone: phone.default(""), url: linkSchema,
    isActive: z.boolean(), sortOrder: z.number().int().min(0).max(10000) })).max(50) }),
  socials: z.object({ items: z.array(z.object({ label: short, url: linkSchema.or(z.literal("")), isActive: z.boolean() })).max(20) }),
  layout: z.object({ sections: z.array(z.enum(["benefits", "products", "factory", "contact"])).length(4).refine((values) => new Set(values).size === 4) }),
};

export type SiteSection = keyof typeof siteSectionSchemas;
export type SiteDocument = { [K in SiteSection]: z.output<typeof siteSectionSchemas[K]> };
export const siteSectionNames = Object.keys(siteSectionSchemas) as SiteSection[];
export function isSiteSection(value: string): value is SiteSection { return value in siteSectionSchemas && Object.hasOwn(siteSectionSchemas, value); }
