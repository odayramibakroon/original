import { expect, it } from "vitest";
import { isSameOrigin } from "./same-origin";

it("validates the browser Origin against the request host including local IP aliases", () => {
  const check = (origin: string, host: string, url = "https://company.example/api/admin/media") => isSameOrigin({ url, headers: new Headers({ origin, host }) });
  expect(check("https://company.example", "company.example")).toBe(true);
  expect(check("http://127.0.0.1:3101", "127.0.0.1:3101", "http://localhost:3101/api/admin/media")).toBe(true);
  for (const origin of ["", "null", "https://attacker.example", "http://company.example", "https://company.example:444", "https://company.example/path"]) {
    expect(check(origin, "company.example")).toBe(false);
  }
});
