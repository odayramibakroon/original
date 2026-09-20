// @vitest-environment node
import { readFileSync } from "node:fs";
import { runInNewContext } from "node:vm";
import { expect, it, vi } from "vitest";

it("shows a push without any open page and opens the message when clicked", async () => {
  const handlers: Record<string, (event: unknown) => void> = {};
  const showNotification = vi.fn().mockResolvedValue(undefined);
  const openWindow = vi.fn();
  const tasks: Promise<unknown>[] = [];
  runInNewContext(readFileSync("public/sw.js", "utf8"), {
    URL,
    self: {
      addEventListener: (type: string, handler: (event: unknown) => void) => { handlers[type] = handler; },
      registration: { showNotification }, location: { origin: "https://factory.example" },
    },
    clients: { matchAll: async () => [], openWindow },
  });
  handlers.push({ data: { json: () => ({ title: "New message", body: "Open inbox", url: "/admin/messages/abc", tag: "contact-abc", lang: "en", dir: "ltr" }) }, waitUntil: (task: Promise<unknown>) => tasks.push(task) });
  await Promise.all(tasks);
  expect(showNotification).toHaveBeenCalledWith("New message", expect.objectContaining({ data: { url: "/admin/messages/abc" } }));
  handlers.notificationclick({ notification: { close: vi.fn(), data: { url: "/admin/messages/abc" } }, waitUntil: (task: Promise<unknown>) => tasks.push(task) });
  await Promise.all(tasks);
  expect(openWindow).toHaveBeenCalledWith("https://factory.example/admin/messages/abc");
  handlers.notificationclick({ notification: { close: vi.fn(), data: { url: "https://evil.example/" } }, waitUntil: vi.fn() });
  expect(openWindow).toHaveBeenCalledTimes(1);
});
