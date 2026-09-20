import { describe, expect, it } from "vitest";
import { buildWhatsAppUrl, normalizeWhatsAppPhone } from "./whatsapp";

describe("whatsapp helpers", () => {
  it("normalizes phone numbers", () => {
    expect(normalizeWhatsAppPhone("+966 12 345 6789")).toBe("966123456789");
  });

  it("builds an encoded WhatsApp URL", () => {
    expect(buildWhatsAppUrl("966123456789", "مرحبا")).toBe(
      "https://wa.me/966123456789?text=%D9%85%D8%B1%D8%AD%D8%A8%D8%A7",
    );
  });
});
