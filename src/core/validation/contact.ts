import { z } from "zod";
import ar from "../../../messages/ar.json";
import { DEFAULT_PHONE_COUNTRY, PHONE_COUNTRIES, parseContactPhone } from "@/core/utils/phone";

type ValidationLabels = typeof ar.validation;

export function createContactFormSchema(labels: ValidationLabels) {
  return z.object({
  country: z.enum(PHONE_COUNTRIES, { error: labels.phoneInvalid }).default(DEFAULT_PHONE_COUNTRY),
  name: z
    .string()
    .trim()
    .min(2, labels.nameShort)
    .max(80, labels.nameLong),
  email: z.string({ error: labels.emailInvalid }).trim().toLowerCase().email(labels.emailInvalid).max(254, labels.emailLong),
  phone: z
    .string()
    .trim()
    .min(1, labels.phoneShort)
    .max(25, labels.phoneLong)
    .regex(/^[+\d\u0660-\u0669\u06f0-\u06f9\s().-]+$/, labels.phoneInvalid),
  message: z
    .string()
    .trim()
    .min(10, labels.messageShort)
    .max(1000, labels.messageLong),
  }).refine((value) => Boolean(parseContactPhone(value.phone, value.country)?.isPossible()), { path: ["phone"], message: labels.phoneInvalid })
    .transform(({ country, ...values }) => ({ ...values, phone: parseContactPhone(values.phone, country)!.number }));
}

export const contactFormSchema = createContactFormSchema(ar.validation);

export type ContactFormInput = z.infer<typeof contactFormSchema>;
export type ContactFormFields = z.input<typeof contactFormSchema>;
