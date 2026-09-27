import Image from "next/image";
import type { CSSProperties } from "react";
import Link from "next/link";

type HeroProps = {
  hero: {
    badge: string;
    titleFirst: string;
    titleSecond: string;
    text: string;
    productsCta: string;
    contactCta: string;
    cardTitle: string;
    cardText: string;
    desktopImage: string;
    mobileImage: string;
    productsHref: string;
    contactHref: string;
    overlayOpacity: number;
  };
};

export function Hero({ hero }: HeroProps) {
  return (
    <section className="hero" id="home" style={{ "--hero-desktop-image": `url(${JSON.stringify(hero.desktopImage)})`, "--hero-overlay-limit": hero.overlayOpacity } as CSSProperties}>
      <div className="hero-mobile-image-stage" aria-hidden="true">
        <div className="hero-mobile-image-frame">
        <Image
          className="hero-mobile-image"
          src={hero.mobileImage}
          alt=""
          fill
          priority
          sizes="(max-width: 760px) 100vw, 1px"
        />
        </div>
      </div>

      <div className="hero-content">
        <div className="hero-badge reveal">{hero.badge}</div>
        <h1 className="reveal">
          {hero.titleFirst}
          <br />
          <span>{hero.titleSecond}</span>
        </h1>
        <p className="hero-text reveal">{hero.text}</p>

        <div className="hero-actions reveal">
          <Link className="primary-btn" href={hero.productsHref}>
            {hero.productsCta}
          </Link>
          <Link className="secondary-btn" href={hero.contactHref}>
            {hero.contactCta}
          </Link>
        </div>
      </div>

      <div className="hero-card reveal">
        <div className="hero-card-title">{hero.cardTitle}</div>
        <div className="hero-card-text">{hero.cardText}</div>
      </div>
    </section>
  );
}
