import { z } from "zod";
import ar from "../../../messages/ar.json";

type ValidationLabels = typeof ar.validation;

export function createContactFormSchema(labels: ValidationLabels) {
  return z.object({
  name: z
    .string()
    .trim()
    .min(2, labels.nameShort)
    .max(80, labels.nameLong),
  email: z.string({ error: labels.emailInvalid }).trim().toLowerCase().email(labels.emailInvalid).max(254, labels.emailLong),
  phone: z
    .string()
    .trim()
    .min(7, labels.phoneShort)
    .max(25, labels.phoneLong)
    .regex(/^[+\d\u0660-\u0669\u06f0-\u06f9\s().-]+$/, labels.phoneInvalid)
    .refine((value) => (value.match(/[\d\u0660-\u0669\u06f0-\u06f9]/g)?.length ?? 0) >= 7, labels.phoneShort),
  message: z
    .string()
    .trim()
    .min(10, labels.messageShort)
    .max(1000, labels.messageLong),
  });
}

export const contactFormSchema = createContactFormSchema(ar.validation);

export type ContactFormInput = z.infer<typeof contactFormSchema>;
