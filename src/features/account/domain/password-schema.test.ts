import { expect, it } from "vitest";
import { passwordSchema } from "./password-schema";

it("requires the current password, a different strong replacement, and matching confirmation", () => {
  const value = { currentPassword: "Old-password-123", newPassword: "New-password-456", confirmPassword: "New-password-456" };
  expect(passwordSchema.safeParse(value).success).toBe(true);
  for (const invalid of [
    { ...value, currentPassword: "" }, { ...value, newPassword: "123" }, { ...value, confirmPassword: "different" },
    { ...value, newPassword: value.currentPassword, confirmPassword: value.currentPassword },
  ]) expect(passwordSchema.safeParse(invalid).success).toBe(false);
});
