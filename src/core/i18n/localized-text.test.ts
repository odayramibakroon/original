import { describe, expect, it } from "vitest";
import { pickLocalized } from "./localized-text";

describe("pickLocalized", () => {
  it("selects the requested locale", () => {
    expect(pickLocalized({ ar: "مرحبا", en: "Hello" }, "en")).toBe("Hello");
  });

  it("falls back to Arabic", () => {
    expect(pickLocalized({ ar: "مرحبا", en: "" }, "en")).toBe("مرحبا");
  });
});
