import Negotiator from "negotiator";
import type { Locale } from "./localized-text";

export function resolveLocale(saved: string | undefined, accepted: string | null, fallback: Locale = "ar"): Locale {
  if (saved === "ar" || saved === "en") return saved;
  const languages = new Negotiator({ headers: { "accept-language": accepted ?? "" } }).languages();
  for (const language of languages) {
    const base = language.toLowerCase().split("-")[0];
    if (base === "ar" || base === "en") return base;
  }
  return fallback;
}
