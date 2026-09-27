"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useState, useTransition } from "react";
import { useForm, useWatch } from "react-hook-form";
import { ChevronDown } from "lucide-react";
import { useLocale, useMessages, useTranslations } from "next-intl";
import {
  createContactFormSchema,
  type ContactFormInput,
  type ContactFormFields,
} from "@/core/validation/contact";
import { submitContactMessage } from "@/features/contact/application/submit-contact-message";
import { DEFAULT_PHONE_COUNTRY, parseContactPhone } from "@/core/utils/phone";
import type { CountryCode } from "libphonenumber-js/min";

type ContactFormProps = {
  countries: Array<{ code: CountryCode; name: string; dial: string }>;
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

export function ContactForm({ labels, countries }: ContactFormProps) {
  const locale = useLocale();
  const messages = useMessages();
  const t = useTranslations("common");
  const contact = useTranslations("contact");
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
    setValue,
    control,
    formState: { errors, isReady },
  } = useForm<ContactFormFields, unknown, ContactFormInput>({
    resolver: zodResolver(schema),
    mode: "onBlur",
    defaultValues: { country: DEFAULT_PHONE_COUNTRY, name: "", email: "", phone: "", message: "" },
  });
  const country = useWatch({ control, name: "country" });
  const selectedCountry = countries.find(({ code }) => code === country);

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
          disabled={!isReady || isPending}
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
        <input type="email" inputMode="email" autoComplete="email" dir="ltr" disabled={!isReady || isPending}
          placeholder={labels.emailPlaceholder} aria-invalid={Boolean(errors.email)}
          aria-describedby={errors.email ? "contact-email-error" : undefined} {...register("email")} />
        {errors.email && <small id="contact-email-error" className="form-error">{errors.email.message}</small>}
      </label>

      <div>
        <div className="contact-phone-fields">
        <label className="contact-country" title={selectedCountry && `${selectedCountry.name} (+${selectedCountry.dial})`}>
          <span className="sr-only">{contact("countryCode")}</span>
          <select autoComplete="tel-country-code" aria-label={contact("countryCode")} disabled={!isReady || isPending} {...register("country")}>
            {countries.map(({ code, name, dial }) => <option key={code} value={code}>{name} (+{dial})</option>)}
          </select>
          <span className="contact-country-value" aria-hidden="true" dir="ltr">
            <span>{selectedCountry?.code}</span>
            <strong>+{selectedCountry?.dial}</strong>
            <ChevronDown size={16} />
          </span>
        </label>
        <label className="contact-national-phone">
        <span className="sr-only">{labels.phonePlaceholder}</span>
        <input
          type="tel"
          disabled={!isReady || isPending}
          dir={locale === "ar" ? "rtl" : "ltr"}
          inputMode="tel"
          autoComplete="tel-national"
          placeholder={labels.phonePlaceholder}
          aria-invalid={Boolean(errors.phone)}
          aria-describedby={errors.phone ? "contact-phone-error" : undefined}
          {...register("phone", { onChange: (event) => {
            const value = String(event.target.value).trim();
            if (!/^(\+|00|٠٠|۰۰)/.test(value)) return;
            const parsed = parseContactPhone(value);
            if (parsed?.country && parsed.isPossible()) {
              setValue("country", parsed.country, { shouldDirty: true });
              setValue("phone", parsed.nationalNumber, { shouldDirty: true });
            }
          } })}
        />
        </label>
        </div>
        {errors.phone ? (
          <small id="contact-phone-error" className="form-error">{errors.phone.message}</small>
        ) : null}
        {errors.country && <small className="form-error">{errors.country.message}</small>}
      </div>

      <label>
        <span className="sr-only">{labels.messagePlaceholder}</span>
        <textarea
          disabled={!isReady || isPending}
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

      <button type="submit" className="primary-btn" disabled={!isReady || isPending}>
        {isPending ? labels.sending : labels.submit}
      </button>
    </form>
  );
}
