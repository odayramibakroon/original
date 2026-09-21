import { expect, it, vi } from "vitest";
const mocks = vi.hoisted(() => ({ requireAdmin: vi.fn(), revokeOthers: vi.fn() }));
vi.mock("server-only", () => ({}));
vi.mock("@/core/auth/session", () => ({ requireAdmin: mocks.requireAdmin }));
vi.mock("@/core/auth/session-registry", () => ({ SessionRegistry: class { revokeOthers = mocks.revokeOthers; } }));
vi.mock("next-intl/server", () => ({ getTranslations: async () => (key: string) => key }));
vi.mock("@/core/logger", () => ({ logger: { error: vi.fn() } }));
import { signOutOtherDevices } from "./account-actions";

it("cannot revoke sessions before authenticating the current device", async () => {
  mocks.requireAdmin.mockRejectedValueOnce(new Error("Unauthorized"));
  expect((await signOutOtherDevices()).ok).toBe(false);
  expect(mocks.revokeOthers).not.toHaveBeenCalled();
  const admin = { uid: "admin", email: "admin@example.test", sessionId: "current-device", version: 2 };
  mocks.requireAdmin.mockResolvedValueOnce(admin);
  expect((await signOutOtherDevices()).ok).toBe(true);
  expect(mocks.revokeOthers).toHaveBeenCalledWith(admin);
});
