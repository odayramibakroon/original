import { pickLocalized, type Locale } from "./localized-text";

export type Localized<T> = T extends { ar: string; en: string } ? string
  : T extends Array<infer U> ? Localized<U>[]
  : T extends object ? { [K in keyof T]: Localized<T[K]> } : T;

export function localizeObject<T>(value: T, locale: Locale): Localized<T> {
  if (Array.isArray(value)) return value.map((item) => localizeObject(item, locale)) as Localized<T>;
  if (value && typeof value === "object") {
    if ("ar" in value && "en" in value && typeof value.ar === "string" && typeof value.en === "string") {
      return pickLocalized({ ar: value.ar, en: value.en }, locale) as Localized<T>;
    }
    return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, localizeObject(item, locale)])) as Localized<T>;
  }
  return value as Localized<T>;
}
