import { beforeEach, expect, it, vi } from "vitest";
const { authorize } = vi.hoisted(() => ({ authorize: vi.fn() }));
vi.mock("server-only", () => ({}));
vi.mock("./session", () => ({ requireAdmin: authorize }));
vi.mock("next-intl/server", () => ({ getTranslations: async () => (key: string) => key }));
vi.mock("@/core/logger", () => ({ logger: { error: vi.fn() } }));
import { adminAction } from "./admin-action";

beforeEach(() => vi.resetAllMocks());
it("never invokes a protected mutation before successful authorization", async () => {
  authorize.mockRejectedValue(new Error("Unauthenticated"));
  const mutate = vi.fn();
  expect((await adminAction(mutate)).ok).toBe(false);
  expect(mutate).not.toHaveBeenCalled();
});
it("passes the verified UID to the mutation", async () => {
  authorize.mockResolvedValue({ uid: "verified-admin", email: "admin@example.test" });
  const mutate = vi.fn().mockResolvedValue({ id: "product" });
  expect(await adminAction(mutate)).toMatchObject({ ok: true, data: { id: "product" } });
  expect(mutate).toHaveBeenCalledWith({ uid: "verified-admin", email: "admin@example.test" });
});
