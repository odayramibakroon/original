import { ContactForm } from "@/features/contact/presentation/components/ContactForm";

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

export function ContactSection({ contact }: ContactSectionProps) {
  return (
    <section className="contact" id="contact">
      <div className="contact-inner">
        <div className="reveal">
          <div className="section-kicker">{contact.kicker}</div>
          <h2>{contact.title}</h2>
          <p>{contact.text}</p>
        </div>

        <ContactForm labels={contact} />
      </div>
    </section>
  );
}
