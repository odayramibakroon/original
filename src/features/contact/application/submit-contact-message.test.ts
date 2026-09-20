import { beforeEach, expect, it, vi } from "vitest";
import en from "../../../../messages/en.json";

const { create, deliver } = vi.hoisted(() => ({ create: vi.fn(), deliver: vi.fn() }));
vi.mock("next-intl/server", () => ({
  getLocale: async () => "en",
  getMessages: async () => en,
  getTranslations: async () => (key: string) => key,
}));
vi.mock("../infrastructure/firestore-contact-repository", () => ({ FirestoreContactRepository: class { create = create; } }));
vi.mock("@/features/notifications/application/deliver-contact-notification", () => ({ deliverContactNotification: deliver }));
vi.mock("@/core/logger", () => ({ logger: { error: vi.fn() } }));

import { submitContactMessage } from "./submit-contact-message";

const valid = { name: "Visitor", email: "visitor@example.com", phone: "+966555123456", message: "Please contact me about an order." };
beforeEach(() => { vi.clearAllMocks(); create.mockResolvedValue("message-id"); deliver.mockResolvedValue(undefined); });

it("validates before saving or notifying", async () => {
  expect((await submitContactMessage({ ...valid, phone: "bad" })).ok).toBe(false);
  expect(create).not.toHaveBeenCalled();
  expect(deliver).not.toHaveBeenCalled();
});

it("notifies only after successful persistence", async () => {
  create.mockRejectedValue(new Error("Database offline"));
  expect((await submitContactMessage(valid)).ok).toBe(false);
  expect(deliver).not.toHaveBeenCalled();
});

it("reports success when saved even if push fails, avoiding duplicate submissions", async () => {
  deliver.mockRejectedValue(new Error("Push unavailable"));
  expect(await submitContactMessage(valid)).toEqual({ ok: true, message: "contact.success" });
  expect(create).toHaveBeenCalledWith(valid, "en");
  expect(deliver).toHaveBeenCalledWith("message-id");
});
