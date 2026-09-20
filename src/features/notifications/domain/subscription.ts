import { z } from "zod";

export function isAllowedPushEndpoint(value: string) {
  try {
    const url = new URL(value);
    const host = url.hostname;
    const allowed = host === "fcm.googleapis.com" ||
      host === "updates.push.services.mozilla.com" ||
      host === "web.push.apple.com" || host.endsWith(".push.apple.com") ||
      host === "wns.windows.com" || host.endsWith(".notify.windows.com");
    return allowed && url.protocol === "https:" && !url.port && !url.username && !url.password;
  } catch {
    return false;
  }
}

export const subscriptionSchema = z.object({
  endpoint: z.string().url().max(2048).refine(isAllowedPushEndpoint),
  keys: z.object({
    p256dh: z.string().regex(/^[A-Za-z0-9_-]{87}=?$/),
    auth: z.string().regex(/^[A-Za-z0-9_-]{22}={0,2}$/),
  }),
});

export type AdminSubscription = z.infer<typeof subscriptionSchema> & {
  uid: string;
  locale: "ar" | "en";
};
