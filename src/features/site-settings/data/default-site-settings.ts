import type { SiteSettings } from "@/features/site-settings/domain/SiteSettings";

export const defaultSiteSettings: SiteSettings = {
  factoryName: {
    ar: "مصنع الحلويات",
    en: "Sweets Factory",
  },
  footerDescription: {
    ar: "مصنع متخصص في إنتاج البسكويت والكوكيز والكيك والمنتجات المخبوزة بجودة عالية وطعم مميز.",
    en: "A specialized factory producing biscuits, cookies, cakes, and baked products with high quality and distinctive taste.",
  },
  phone: "+966123456789",
  whatsAppPhone: "966123456789",
  email: "info@factory.com",
  socials: [
    {
      label: "Instagram",
      url: "#",
      isActive: true,
    },
    {
      label: "Facebook",
      url: "#",
      isActive: true,
    },
    {
      label: "TikTok",
      url: "#",
      isActive: true,
    },
  ],
  branches: [
    {
      name: {
        ar: "الفرع الرئيسي",
        en: "Main branch",
      },
      address: {
        ar: "السعودية",
        en: "Saudi Arabia",
      },
      url: "#",
      isActive: true,
      sortOrder: 1,
    },
    {
      name: {
        ar: "فرع المدينة",
        en: "City branch",
      },
      address: {
        ar: "أضف الموقع",
        en: "Add location",
      },
      url: "#",
      isActive: true,
      sortOrder: 2,
    },
    {
      name: {
        ar: "فرع آخر",
        en: "Another branch",
      },
      address: {
        ar: "أضف الموقع",
        en: "Add location",
      },
      url: "#",
      isActive: true,
      sortOrder: 3,
    },
  ],
};
