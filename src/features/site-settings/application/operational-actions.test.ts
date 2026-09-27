import { beforeEach, expect, it, vi } from "vitest";
const mocks = vi.hoisted(() => ({ authorize: vi.fn(), save: vi.fn(), block: vi.fn(), media: vi.fn(), remove: vi.fn(), read: vi.fn() }));
vi.mock("server-only", () => ({}));
vi.mock("@/core/auth/session", () => ({ requireAdmin: mocks.authorize }));
vi.mock("@/core/firebase/admin", () => ({ getAdminDb: vi.fn() }));
vi.mock("next-intl/server", () => ({ getTranslations: async () => (key: string) => key }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("@/core/logger", () => ({ logger: { error: vi.fn(), info: vi.fn() } }));
vi.mock("@/features/contact/infrastructure/contact-policy-repository", () => ({ ContactPolicyRepository: class { save = mocks.save; setBlocked = mocks.block; } }));
vi.mock("@/features/media/infrastructure/media-policy-repository", () => ({ MediaPolicyRepository: class { saveLimit = mocks.media; } }));
vi.mock("@/features/admin/infrastructure/messages", () => ({ deleteContactMessages: mocks.remove, markContactMessagesRead: mocks.read, messageIdSchema: {} }));
import { saveContactPolicy, saveMediaLimit, setContactIpBlocked } from "./operational-actions";
import { deleteMessages, markMessagesRead } from "@/features/admin/application/message-actions";

beforeEach(() => vi.resetAllMocks());
it("rejects all new mutations before accessing storage when not authorized", async () => {
  mocks.authorize.mockRejectedValue(new Error("Forbidden"));
  for (const result of [
    await saveContactPolicy({ dailyMessagesPerIp: 10 }),
    await setContactIpBlocked({ ip: "203.0.113.2", blocked: true }),
    await saveMediaLimit({ maxImageKb: 250 }),
    await deleteMessages({ mode: "all", before: Date.now() }),
    await markMessagesRead(["abcdefghijklmnopqrst"]),
  ]) expect(result.ok).toBe(false);
  for (const mutation of [mocks.save, mocks.block, mocks.media, mocks.remove, mocks.read]) expect(mutation).not.toHaveBeenCalled();
});
it("audits policy changes with the verified admin and rejects invalid limits", async () => {
  mocks.authorize.mockResolvedValue({ uid: "verified-admin", email: "admin@example.test" });
  expect((await saveContactPolicy({ dailyMessagesPerIp: 0 })).ok).toBe(false);
  expect(mocks.save).not.toHaveBeenCalled();
  expect((await saveContactPolicy({ dailyMessagesPerIp: 8 })).ok).toBe(true);
  expect(mocks.save).toHaveBeenCalledWith({ dailyMessagesPerIp: 8 }, "verified-admin");
  expect((await setContactIpBlocked({ ip: "203.0.113.2", blocked: true })).ok).toBe(true);
  expect(mocks.block).toHaveBeenCalledWith("203.0.113.2", true, "verified-admin");
});
