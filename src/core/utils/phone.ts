import { getCountries, parsePhoneNumberFromString, type CountryCode } from "libphonenumber-js/min";

export const PHONE_COUNTRIES = getCountries();
export const DEFAULT_PHONE_COUNTRY: CountryCode = "SA";

export function parseContactPhone(value: string, country: CountryCode = DEFAULT_PHONE_COUNTRY) {
  const normalized = value.trim().replace(/[\u0660-\u0669\u06f0-\u06f9]/g, (digit) => String(digit.charCodeAt(0) % 16)).replace(/^00/, "+");
  if (!/^[+\d\s().-]+$/.test(normalized)) return undefined;
  return parsePhoneNumberFromString(normalized, { defaultCountry: country, extract: false });
}
