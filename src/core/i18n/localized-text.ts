export type Locale = "ar" | "en";

export type LocalizedText = Record<Locale, string>;

export function pickLocalized(
  value: LocalizedText,
  locale: Locale,
  fallback: Locale = "ar",
) {
  return value[locale] || value[fallback] || "";
}
