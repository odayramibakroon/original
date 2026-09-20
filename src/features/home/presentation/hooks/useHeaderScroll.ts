"use client";

import { useEffect, useState } from "react";

export function useHeaderScroll() {
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    function updateHeader() {
      setIsScrolled(window.scrollY > 16);
    }

    updateHeader();
    window.addEventListener("scroll", updateHeader, { passive: true });

    return () => window.removeEventListener("scroll", updateHeader);
  }, []);

  return isScrolled;
}
