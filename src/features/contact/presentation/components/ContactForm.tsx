"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { useLocale, useMessages, useTranslations } from "next-intl";
import {
  createContactFormSchema,
  type ContactFormInput,
} from "@/core/validation/contact";
import { submitContactMessage } from "@/features/contact/application/submit-contact-message";

type ContactFormProps = {
  labels: {
    namePlaceholder: string;
    emailPlaceholder: string;
    phonePlaceholder: string;
    messagePlaceholder: string;
    submit: string;
    sending: string;
    success: string;
    error: string;
  };
};

export function ContactForm({ labels }: ContactFormProps) {
  const locale = useLocale();
  const messages = useMessages();
  const t = useTranslations("common");
  const schema = createContactFormSchema(messages.validation as Parameters<typeof createContactFormSchema>[0]);
  const [isPending, startTransition] = useTransition();
  const [resultMessage, setResultMessage] = useState<string | null>(null);
  const [resultType, setResultType] = useState<"success" | "error" | null>(
    null,
  );
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ContactFormInput>({
    resolver: zodResolver(schema),
    mode: "onBlur",
  });

  function onSubmit(values: ContactFormInput) {
    setResultMessage(null);
    setResultType(null);

    startTransition(async () => {
      try {
        const result = await submitContactMessage(values);
        setResultType(result.ok ? "success" : "error");
        setResultMessage(result.ok ? labels.success : result.message || labels.error);
        if (result.ok) reset();
      } catch {
        setResultType("error");
        setResultMessage(t("error"));
      }
    });
  }

  return (
    <form className="contact-form reveal" noValidate onSubmit={handleSubmit(onSubmit)}>
      <label>
        <span className="sr-only">{labels.namePlaceholder}</span>
        <input
          type="text"
          autoComplete="name"
          placeholder={labels.namePlaceholder}
          aria-invalid={Boolean(errors.name)}
          {...register("name")}
        />
        {errors.name ? (
          <small className="form-error">{errors.name.message}</small>
        ) : null}
      </label>

      <label>
        <span className="sr-only">{labels.emailPlaceholder}</span>
        <input type="email" inputMode="email" autoComplete="email" dir="ltr"
          placeholder={labels.emailPlaceholder} aria-invalid={Boolean(errors.email)}
          aria-describedby={errors.email ? "contact-email-error" : undefined} {...register("email")} />
        {errors.email && <small id="contact-email-error" className="form-error">{errors.email.message}</small>}
      </label>

      <label>
        <span className="sr-only">{labels.phonePlaceholder}</span>
        <input
          type="tel"
          dir={locale === "ar" ? "rtl" : "ltr"}
          inputMode="tel"
          autoComplete="tel"
          placeholder={labels.phonePlaceholder}
          aria-invalid={Boolean(errors.phone)}
          {...register("phone")}
        />
        {errors.phone ? (
          <small className="form-error">{errors.phone.message}</small>
        ) : null}
      </label>

      <label>
        <span className="sr-only">{labels.messagePlaceholder}</span>
        <textarea
          placeholder={labels.messagePlaceholder}
          aria-invalid={Boolean(errors.message)}
          {...register("message")}
        />
        {errors.message ? (
          <small className="form-error">{errors.message.message}</small>
        ) : null}
      </label>

      {resultMessage ? (
        <p role="status" className={`form-result ${resultType || ""}`}>{resultMessage}</p>
      ) : null}

      <button type="submit" className="primary-btn" disabled={isPending}>
        {isPending ? labels.sending : labels.submit}
      </button>
    </form>
  );
}
