import { expect, it } from "vitest";
import { isAllowedPushEndpoint, subscriptionSchema } from "./subscription";

it("restricts server push requests to known HTTPS push providers", () => {
  for (const value of ["https://fcm.googleapis.com/fcm/send/test", "https://updates.push.services.mozilla.com/wpush/v2/test", "https://web.push.apple.com/test"]) {
    expect(isAllowedPushEndpoint(value)).toBe(true);
  }
  for (const value of ["http://fcm.googleapis.com/test", "https://127.0.0.1/admin", "https://fcm.googleapis.com.evil.example/test", "https://evil.example/test", "https://user:pass@fcm.googleapis.com/test", "https://fcm.googleapis.com:8080/test"]) {
    expect(isAllowedPushEndpoint(value)).toBe(false);
  }
});

it("rejects malformed encryption keys", () => {
  expect(subscriptionSchema.safeParse({ endpoint: "https://fcm.googleapis.com/test", keys: { p256dh: "bad", auth: "bad" } }).success).toBe(false);
});
