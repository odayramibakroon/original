"use client";

import { useEffect } from "react";

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

export function useMobileHeroScroll() {
  useEffect(() => {
    const mobileQuery = window.matchMedia("(max-width: 760px)");
    const hero = document.querySelector<HTMLElement>(".hero");
    const imageStage = document.querySelector<HTMLElement>(
      ".hero-mobile-image-stage",
    );
    const heroContent = document.querySelector<HTMLElement>(".hero-content");
    const configuredAlpha = hero ? Number.parseFloat(getComputedStyle(hero).getPropertyValue("--hero-overlay-limit")) : NaN;
    const finalAlpha = Number.isFinite(configuredAlpha) ? clamp(configuredAlpha, 0, 0.7) : 0.52;

    if (!hero || !imageStage || !heroContent) {
      return;
    }

    const heroElement = hero;
    const imageStageElement = imageStage;
    const heroContentElement = heroContent;

    function updateMobileHero() {
      if (!mobileQuery.matches) {
        heroElement.style.setProperty("--hero-bg-alpha", "0");
        heroContentElement.style.setProperty("--hero-content-y", "0px");
        imageStageElement.style.setProperty("--hero-image-y", "0px");
        return;
      }

      const heroRect = heroElement.getBoundingClientRect();
      const viewportHeight = window.innerHeight || 1;
      const progress = clamp(-heroRect.top / (viewportHeight * 0.72), 0, 1);
      const eased = 1 - Math.pow(1 - progress, 2);
      const alpha = eased * finalAlpha;

      heroElement.style.setProperty("--hero-bg-alpha", alpha.toFixed(3));
      heroContentElement.style.setProperty(
        "--hero-content-y",
        `${Math.round(eased * -42)}px`,
      );
      imageStageElement.style.setProperty(
        "--hero-image-y",
        `${Math.round(eased * -28)}px`,
      );
    }

    updateMobileHero();
    window.addEventListener("scroll", updateMobileHero, { passive: true });
    window.addEventListener("resize", updateMobileHero);
    mobileQuery.addEventListener("change", updateMobileHero);

    return () => {
      window.removeEventListener("scroll", updateMobileHero);
      window.removeEventListener("resize", updateMobileHero);
      mobileQuery.removeEventListener("change", updateMobileHero);
    };
  }, []);
}
