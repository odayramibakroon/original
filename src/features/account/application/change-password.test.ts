import { beforeEach, expect, it, vi } from "vitest";
const mocks = vi.hoisted(() => ({ signIn: vi.fn(), update: vi.fn(), session: vi.fn(), signOut: vi.fn(), push: vi.fn() }));
vi.mock("firebase/auth", () => ({ inMemoryPersistence: {}, setPersistence: vi.fn(), signInWithEmailAndPassword: mocks.signIn, updatePassword: mocks.update, signOut: mocks.signOut }));
vi.mock("@/core/firebase/client", () => ({ getFirebaseAuth: () => ({}) }));
vi.mock("@/features/admin/application/auth-actions", () => ({ createAdminSession: mocks.session }));
vi.mock("@/features/notifications/presentation/sync-current-push", () => ({ syncCurrentPush: mocks.push }));
vi.mock("@/core/logger", () => ({ logger: { warn: vi.fn() } }));
import { changePassword } from "./change-password";
const input = { currentPassword: "Old-password-123", newPassword: "New-password-456", confirmPassword: "New-password-456" };
const account = { uid: "admin", email: "admin@example.test" };
beforeEach(() => {
  vi.resetAllMocks();
  mocks.signIn.mockResolvedValue({ user: { uid: "admin", getIdToken: async () => "fresh-id-token" } });
  mocks.session.mockResolvedValue({ ok: true }); mocks.push.mockResolvedValue(true); mocks.signOut.mockResolvedValue(undefined);
});
it("requires the current password before changing it", async () => {
  mocks.signIn.mockRejectedValue({ code: "auth/invalid-credential" });
  expect(await changePassword(input, account)).toMatchObject({ ok: false, changed: false, key: "currentInvalid" });
  expect(mocks.update).not.toHaveBeenCalled(); expect(mocks.signOut).toHaveBeenCalledOnce();
});
it("renews the current session and revokes others after password update", async () => {
  expect(await changePassword(input, account)).toMatchObject({ ok: true, changed: true });
  expect(mocks.signIn).toHaveBeenNthCalledWith(1, {}, account.email, input.currentPassword);
  expect(mocks.signIn).toHaveBeenNthCalledWith(2, {}, account.email, input.newPassword);
  expect(mocks.session).toHaveBeenCalledWith("fresh-id-token", true);
  expect(mocks.signOut).toHaveBeenCalledOnce();
});
it("does not report a changed password as unchanged when session renewal fails", async () => {
  mocks.session.mockResolvedValue({ ok: false });
  expect(await changePassword(input, account)).toMatchObject({ ok: false, changed: true, key: "passwordChangedSignIn" });
});
