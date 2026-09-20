import { beforeEach, expect, it, vi } from "vitest";

const mock = vi.hoisted(() => ({
  getActiveSubscriptions: vi.fn(), sendPush: vi.fn(), update: vi.fn(), remove: vi.fn(),
  data: {} as Record<string, unknown>,
}));
vi.mock("server-only", () => ({}));
vi.mock("@/core/logger", () => ({ logger: { error: vi.fn() } }));
vi.mock("../infrastructure/web-push", () => ({ getActiveSubscriptions: mock.getActiveSubscriptions, sendPush: mock.sendPush }));
vi.mock("@/core/firebase/admin", () => ({ getAdminDb: () => {
  const document = { get: async () => ({ data: () => mock.data }), update: mock.update, delete: mock.remove };
  return {
    doc: () => document,
    runTransaction: (callback: (transaction: unknown) => Promise<unknown>) => callback({
      get: document.get, update: vi.fn(),
    }),
  };
} }));

import { deliverContactNotification } from "./deliver-contact-notification";

beforeEach(() => {
  vi.clearAllMocks();
  mock.data = { status: "pending", nextAttemptAt: { toMillis: () => 0 }, deliveredTo: [] };
  mock.getActiveSubscriptions.mockResolvedValue([{ id: "device-1", subscription: { uid: "admin" } }]);
  mock.sendPush.mockResolvedValue(undefined);
  mock.update.mockResolvedValue(undefined);
  mock.remove.mockResolvedValue(undefined);
});

it("delivers immediately and records completion", async () => {
  await deliverContactNotification("message-1");
  expect(mock.sendPush).toHaveBeenCalledWith({ uid: "admin" }, "message-1");
  expect(mock.update).toHaveBeenCalledWith(expect.objectContaining({ status: "sent" }));
});

it("notifies subscribed devices belonging to multiple admins", async () => {
  mock.getActiveSubscriptions.mockResolvedValue([
    { id: "device-1", subscription: { uid: "first-admin" } },
    { id: "device-2", subscription: { uid: "second-admin" } },
    { id: "device-3", subscription: { uid: "second-admin" } },
  ]);
  await deliverContactNotification("message-1");
  expect(mock.sendPush).toHaveBeenCalledTimes(3);
  expect(mock.sendPush).toHaveBeenCalledWith({ uid: "first-admin" }, "message-1");
  expect(mock.sendPush).toHaveBeenCalledWith({ uid: "second-admin" }, "message-1");
  expect(mock.update).toHaveBeenCalledWith(expect.objectContaining({ status: "sent" }));
});

it("retains transient failures for retry", async () => {
  mock.sendPush.mockRejectedValue({ statusCode: 503 });
  await deliverContactNotification("message-1");
  expect(mock.update).toHaveBeenCalledWith(expect.objectContaining({ status: "pending", lastResult: "retry" }));
  expect(mock.remove).not.toHaveBeenCalled();
});

it("removes expired device subscriptions", async () => {
  mock.sendPush.mockRejectedValue({ statusCode: 410 });
  await deliverContactNotification("message-1");
  expect(mock.remove).toHaveBeenCalledOnce();
});

it("does not resend to devices already delivered to", async () => {
  mock.data.deliveredTo = ["device-1"];
  await deliverContactNotification("message-1");
  expect(mock.sendPush).not.toHaveBeenCalled();
});

it("honors the job lease and completed status", async () => {
  mock.data.nextAttemptAt = { toMillis: () => Date.now() + 60000 };
  await deliverContactNotification("message-1");
  mock.data.status = "sent";
  await deliverContactNotification("message-1");
  expect(mock.getActiveSubscriptions).not.toHaveBeenCalled();
});

it("expires old notifications instead of sending a stale backlog", async () => {
  mock.data.createdAt = { toMillis: () => Date.now() - 25 * 60 * 60 * 1000 };
  await deliverContactNotification("message-1");
  expect(mock.getActiveSubscriptions).not.toHaveBeenCalled();
});
