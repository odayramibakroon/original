import { describe, expect, it } from "vitest";
import { contactFormSchema, createContactFormSchema } from "./contact";
import en from "../../../messages/en.json";

describe("contact form schema", () => {
  it("requires a valid email and normalizes surrounding whitespace and case", () => {
    const data = { name: "Visitor", phone: "0501234567", message: "Please contact me about an order." };
    for (const email of [undefined, "", "visitor", "visitor@", "@example.com"]) expect(contactFormSchema.safeParse({ ...data, email }).success).toBe(false);
    expect(contactFormSchema.parse({ ...data, email: " Visitor@Example.com " }).email).toBe("visitor@example.com");
  });
  it("accepts Arabic digits and rejects letters or punctuation-only phone numbers", () => {
    const data = { name: "Visitor", email: "visitor@example.com", message: "Please contact me about your products." };
    expect(contactFormSchema.safeParse({ ...data, phone: "٠٥٥١٢٣٤٥٦٧" }).success).toBe(true);
    expect(contactFormSchema.safeParse({ ...data, phone: "not-a-phone" }).success).toBe(false);
    expect(contactFormSchema.safeParse({ ...data, phone: "-------" }).success).toBe(false);
  });
  it("returns localized validation messages", () => {
    const result = createContactFormSchema(en.validation).safeParse({ name: "A", phone: "12345678", message: "Please contact me." });
    expect(result.error?.issues[0].message).toBe(en.validation.nameShort);
  });
  it("normalizes country-specific national numbers and international pasted numbers", () => {
    const data = { name: "Visitor", email: "visitor@example.com", message: "Please contact me about an order." };
    expect(contactFormSchema.parse({ ...data, country: "PS", phone: "٠٥٩٩١٢٣٤٥٦" }).phone).toBe("+970599123456");
    expect(contactFormSchema.parse({ ...data, country: "EG", phone: "01012345678" }).phone).toBe("+201012345678");
    expect(contactFormSchema.parse({ ...data, country: "GB", phone: "020 7946 0018" }).phone).toBe("+442079460018");
    expect(contactFormSchema.parse({ ...data, phone: "0044 20 7946 0018" }).phone).toBe("+442079460018");
    expect(contactFormSchema.parse({ ...data, country: "NU", phone: "1234" }).phone).toBe("+6831234");
    expect(contactFormSchema.safeParse({ ...data, country: "INVALID", phone: "123456789" }).success).toBe(false);
    expect(contactFormSchema.safeParse({ ...data, country: "SA", phone: "05012" }).success).toBe(false);
    expect(contactFormSchema.safeParse({ ...data, phone: "+999123456789" }).success).toBe(false);
  });
  it("accepts valid contact messages", () => {
    const result = contactFormSchema.safeParse({
      name: "محمد",
      email: "visitor@example.com",
      phone: "+966123456789",
      message: "أريد الاستفسار عن المنتجات المتاحة.",
    });

    expect(result.success).toBe(true);
  });

  it("rejects invalid short values", () => {
    const result = contactFormSchema.safeParse({
      name: "م",
      phone: "12",
      message: "قصير",
    });

    expect(result.success).toBe(false);
  });
});
