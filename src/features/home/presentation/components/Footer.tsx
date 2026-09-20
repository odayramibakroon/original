import { Mail, Phone } from "lucide-react";
import { buildWhatsAppUrl } from "@/core/utils/whatsapp";
import Link from "next/link";

type FooterProps = {
  settings: {
    factoryName: string;
    footerDescription: string;
    phone: string;
    whatsAppPhone: string;
    email: string;
    address?: string;
    socials: Array<{
      label: string;
      url: string;
      isActive: boolean;
    }>;
    branches: Array<{
      name: string;
      address: string;
      url: string;
      isActive: boolean;
      sortOrder: number;
      phone?: string;
    }>;
  };
  footer: {
    company: string;
    products: string;
    branches: string;
    contact: string;
    about: string;
    factory: string;
    quality: string;
    allProducts: string;
    biscuits: string;
    cakes: string;
    whatsApp: string;
    copyright: string;
    origin: string;
  };
};

export function Footer({ settings, footer }: FooterProps) {
  const activeSocials = settings.socials.filter(
    (social) => social.isActive && social.url && social.url !== "#",
  );
  const activeBranches = settings.branches
    .filter((branch) => branch.isActive)
    .sort((a, b) => a.sortOrder - b.sortOrder);
  const whatsAppUrl = settings.whatsAppPhone ? buildWhatsAppUrl(settings.whatsAppPhone, footer.contact) : null;

  return (
    <footer className="footer">
      <div className="footer-grid">
        <div className="footer-brand">
          <h2>{settings.factoryName}</h2>
          <p>{settings.footerDescription}</p>

          {activeSocials.length > 0 ? (
            <div className="social-links">
              {activeSocials.map((social, index) => (
                <a
                  href={social.url}
                  key={`${index}-${social.label}`}
                  target={social.url === "#" ? undefined : "_blank"}
                  rel={social.url === "#" ? undefined : "noopener noreferrer"}
                >
                  {social.label}
                </a>
              ))}
            </div>
          ) : null}
        </div>

        <div className="footer-column">
          <h4>{footer.company}</h4>
          <Link href="/#benefits">{footer.about}</Link>
          <Link href="/#factory">{footer.factory}</Link>
          <Link href="/#benefits">{footer.quality}</Link>
        </div>

        <div className="footer-column">
          <h4>{footer.products}</h4>
          <Link href="/products">{footer.allProducts}</Link>
          <Link href="/products?category=Biscuits">{footer.biscuits}</Link>
          <Link href="/products?category=Cake">{footer.cakes}</Link>
        </div>

        <div className="footer-column">
          <h4>{footer.branches}</h4>
          {activeBranches.map((branch, index) => (
            <div key={`${index}-${branch.name}-${branch.address}`}><a href={branch.url}>
              {branch.name} — {branch.address}
            </a>{branch.phone && <a href={`tel:${branch.phone}`}><bdi dir="ltr">{branch.phone}</bdi></a>}</div>
          ))}
        </div>

        <div className="footer-column">
          <h4>{footer.contact}</h4>
          {settings.phone && <a href={`tel:${settings.phone}`}>
            <Phone size={15} />
            <bdi dir="ltr">{settings.phone}</bdi>
          </a>}
          {whatsAppUrl && <a href={whatsAppUrl} target="_blank" rel="noopener noreferrer">
            {footer.whatsApp}
          </a>}
          <a href={`mailto:${settings.email}`}>
            <Mail size={15} />
            {settings.email}
          </a>
          {settings.address && <p>{settings.address}</p>}
        </div>
      </div>

      <div className="footer-bottom">
        <span>{footer.copyright}</span>
        <span>{footer.origin}</span>
      </div>
    </footer>
  );
}
