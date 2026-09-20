import { timingSafeEqual } from "node:crypto";
import { retryPendingNotifications } from "@/features/notifications/application/deliver-contact-notification";
import { logger } from "@/core/logger";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(request: Request) {
  const secret = process.env.NOTIFICATION_CRON_SECRET;
  const supplied = Buffer.from(request.headers.get("authorization") ?? "");
  const expected = Buffer.from(`Bearer ${secret}`);
  if (!secret || supplied.length !== expected.length || !timingSafeEqual(supplied, expected)) {
    return new Response(null, { status: 401 });
  }
  try {
    return Response.json({ processed: await retryPendingNotifications() });
  } catch (error) {
    logger.error("Notification retry failed.", { error: error instanceof Error ? error.name : "unknown" });
    return Response.json({ error: "Retry unavailable" }, { status: 503 });
  }
}
