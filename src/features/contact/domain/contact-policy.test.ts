import { expect, it } from "vitest";
import { contactDay, contactPolicySchema } from "./contact-policy";

it("defaults to three messages and rejects fractional, zero and excessive limits", () => {
  expect(contactPolicySchema.parse({})).toEqual({ dailyMessagesPerIp: 3 });
  for (const limit of [0, -1, 1.5, 1001, "3"]) expect(contactPolicySchema.safeParse({ dailyMessagesPerIp: limit }).success).toBe(false);
});
it("resets the daily quota at midnight in Riyadh rather than the server timezone", () => {
  expect(contactDay(Date.parse("2026-09-20T20:59:59.999Z"))).toBe("2026-09-20");
  expect(contactDay(Date.parse("2026-09-20T21:00:00Z"))).toBe("2026-09-21");
});
