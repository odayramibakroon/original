/* global self, clients */
self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (event) => event.waitUntil(clients.claim()));

self.addEventListener("push", (event) => {
  if (!event.data) return;
  const payload = event.data.json();
  event.waitUntil(self.registration.showNotification(payload.title, {
    body: payload.body,
    icon: "/icon-192.png",
    tag: payload.tag,
    lang: payload.lang,
    dir: payload.dir,
    data: { url: payload.url },
  }));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const target = new URL(event.notification.data?.url || "/admin/messages", self.location.origin);
  if (target.origin !== self.location.origin || !target.pathname.startsWith("/admin/messages")) return;
  event.waitUntil((async () => {
    const windows = await clients.matchAll({ type: "window", includeUncontrolled: true });
    const existing = windows.find((client) => new URL(client.url).origin === target.origin);
    if (existing) {
      await existing.navigate(target.href);
      return existing.focus();
    }
    return clients.openWindow(target.href);
  })());
});
