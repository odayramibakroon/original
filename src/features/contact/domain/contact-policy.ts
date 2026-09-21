import { z } from "zod";

export const contactPolicySchema = z.object({ dailyMessagesPerIp: z.number().int().min(1).max(1000).default(3) });
export type ContactPolicy = z.infer<typeof contactPolicySchema>;
export type BlockedContactIp = { ip: string; createdAt: string };

export function contactDay(now: number) {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Riyadh", year: "numeric", month: "2-digit", day: "2-digit" }).format(now);
}
