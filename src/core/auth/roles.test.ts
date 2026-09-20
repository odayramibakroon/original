import { expect, it } from "vitest";
import { isActiveAdmin } from "./roles";

it("requires an explicit active admin role", () => {
  expect(isActiveAdmin({ role: "admin", active: true })).toBe(true);
  for (const value of [null, {}, { role: "admin" }, { role: "admin", active: false }, { role: "user", active: true }, { role: "admin", active: "true" }]) {
    expect(isActiveAdmin(value)).toBe(false);
  }
});
