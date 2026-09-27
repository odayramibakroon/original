import { ContactForm } from "@/features/contact/presentation/components/ContactForm";
import { getLocale } from "next-intl/server";
import { getCountryCallingCode } from "libphonenumber-js/min";
import { PHONE_COUNTRIES } from "@/core/utils/phone";

type ContactSectionProps = {
  contact: {
    kicker: string;
    title: string;
    text: string;
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

export async function ContactSection({ contact }: ContactSectionProps) {
  const locale = await getLocale();
  const names = new Intl.DisplayNames([locale], { type: "region" });
  const countries = PHONE_COUNTRIES.map((code) => ({ code, name: names.of(code) || code, dial: getCountryCallingCode(code) })).sort((a, b) => a.name.localeCompare(b.name, locale));
  return (
    <section className="contact" id="contact">
      <div className="contact-inner">
        <div className="reveal">
          <div className="section-kicker">{contact.kicker}</div>
          <h2>{contact.title}</h2>
          <p>{contact.text}</p>
        </div>

        <ContactForm labels={contact} countries={countries} />
      </div>
    </section>
  );
}
