import type { LocalizedText } from "@/core/i18n/localized-text";

export type SocialLink = {
  label: string;
  url: string;
  isActive: boolean;
};

export type Branch = {
  name: LocalizedText;
  address: LocalizedText;
  url: string;
  isActive: boolean;
  sortOrder: number;
};

export type SiteSettings = {
  factoryName: LocalizedText;
  footerDescription: LocalizedText;
  phone: string;
  whatsAppPhone: string;
  email: string;
  socials: SocialLink[];
  branches: Branch[];
};
