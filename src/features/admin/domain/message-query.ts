import { z } from "zod";

export const messageIdSchema = z.string().regex(/^[A-Za-z0-9]{20}$/);
export const selectedMessagesSchema = z.array(messageIdSchema).min(1).max(100);
export const messageQuerySchema = z.object({
  q: z.string().trim().max(120).default(""),
  status: z.enum(["all", "new", "read", "replied"]).default("all"),
  after: messageIdSchema.optional(),
});
export type MessageQuery = z.infer<typeof messageQuerySchema>;
export const deleteMessagesSchema = z.discriminatedUnion("mode", [
  z.object({ mode: z.literal("selected"), ids: selectedMessagesSchema }),
  z.object({ mode: z.literal("all"), before: z.number().int().positive().refine((value) => value <= Date.now()) }),
]);

function searchable(value: string) {
  return value.normalize("NFKC").toLocaleLowerCase().replace(/[\u0660-\u0669\u06f0-\u06f9]/g, (digit) => String(digit.charCodeAt(0) % 16)).trim();
}
export function matchesMessage(message: { name: string; email: string; phone: string; message: string; ip: string; status: string }, query: Pick<MessageQuery, "q" | "status">) {
  return (query.status === "all" || message.status === query.status) && (!query.q ||
    [message.name, message.email, message.phone, message.message, message.ip].some((value) => searchable(value).includes(searchable(query.q))));
}
export function messageListHref(query: Pick<MessageQuery, "q" | "status">, after?: string) {
  const params = new URLSearchParams();
  if (query.q) params.set("q", query.q);
  if (query.status !== "all") params.set("status", query.status);
  if (after) params.set("after", after);
  return `/admin/messages${params.size ? `?${params}` : ""}`;
}
