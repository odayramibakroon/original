import { describe, expect, it } from "vitest";
import { resolveLocale } from "./resolve-locale";

describe("language preference", () => {
  it("detects device language and regional tags", () => {
    expect(resolveLocale(undefined, "en-US,en;q=0.9,ar;q=0.7")).toBe("en");
    expect(resolveLocale(undefined, "ar-JO,en;q=0.5")).toBe("ar");
  });
  it("honors quality weighting and saved preference", () => {
    expect(resolveLocale(undefined, "ar;q=0.2,en;q=0.9")).toBe("en");
    expect(resolveLocale("ar", "en-US")).toBe("ar");
    expect(resolveLocale("en", "ar-SA")).toBe("en");
  });
  it("ignores unsupported and disabled languages", () => {
    expect(resolveLocale("xx", "fr,en;q=0.5,ar;q=0")).toBe("en");
    expect(resolveLocale(undefined, "fr")).toBe("ar");
    expect(resolveLocale(undefined, null)).toBe("ar");
  });
});
