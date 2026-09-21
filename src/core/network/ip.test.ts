// @vitest-environment node
import { expect, it } from "vitest";
import { normalizeIp, resolveClientIp } from "./ip";

it("normalizes IPv6 and IPv4-mapped addresses without accepting ports or legacy IPv4 notation", () => {
  expect(normalizeIp("::ffff:192.0.2.10")).toBe("192.0.2.10");
  expect(normalizeIp("2001:0db8:0000:0000:0000:0000:0000:0001")).toBe("2001:db8::1");
  for (const value of ["127.1", "0x7f000001", "192.0.2.1:80", "192.0.2.1, 192.0.2.2", "fe80::1%eth0", ""]) expect(normalizeIp(value)).toBeNull();
});
it("uses only trusted hosting headers and fails closed in production", () => {
  const headers = new Headers({ "x-forwarded-for": "192.0.2.10", "x-vercel-forwarded-for": "203.0.113.5" });
  expect(resolveClientIp(headers, { NODE_ENV: "production", VERCEL: "1" })).toBe("203.0.113.5");
  expect(resolveClientIp(headers, { NODE_ENV: "production" })).toBeNull();
  expect(resolveClientIp(headers, { NODE_ENV: "development" })).toBe("127.0.0.1");
  expect(resolveClientIp(new Headers(), { NODE_ENV: "production", VERCEL: "1" })).toBeNull();
  expect(resolveClientIp(headers, { NODE_ENV: "production", CONTACT_TRUSTED_IP_HEADER: "x-forwarded-for" })).toBe("192.0.2.10");
});
