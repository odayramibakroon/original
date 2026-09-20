"use server";

import { getLocale, getMessages, getTranslations } from "next-intl/server";
import { createContactFormSchema } from "@/core/validation/contact";
import { normalizeError, ErrorCode } from "@/core/errors";
import { deliverContactNotification } from "@/features/notifications/application/deliver-contact-notification";
import { logger } from "@/core/logger";
import { FirestoreContactRepository } from "@/features/contact/infrastructure/firestore-contact-repository";

export type ContactActionState = {
  ok: boolean;
  message: string;
};

export async function submitContactMessage(
  input: unknown,
): Promise<ContactActionState> {
  const [messages, t, locale] = await Promise.all([getMessages(), getTranslations(), getLocale()]);
  const schema = createContactFormSchema(messages.validation as Parameters<typeof createContactFormSchema>[0]);
  const parsed = schema.safeParse(input);

  if (!parsed.success) {
    return {
      ok: false,
      message:
        parsed.error.issues[0]?.message || t("common.error"),
    };
  }

  let id: string;
  try {
    const repository = new FirestoreContactRepository();
    id = await repository.create(parsed.data, locale);
  } catch (error) {
    const appError = normalizeError(error, ErrorCode.DATABASE_ERROR);
    logger.error("Failed to submit contact message.", {
      code: appError.code,
    });

    return {
      ok: false,
      message: t(appError.code === ErrorCode.RATE_LIMITED ? "contact.rateLimited" : "common.error"),
    };
  }

  // A delivery failure must not report an already-saved message as unsuccessful.
  try {
    await deliverContactNotification(id);
  } catch (error) {
    logger.error("Notification deferred for retry.", { messageId: id, code: normalizeError(error).code });
  }
  return { ok: true, message: t("contact.success") };
}
