import { expect, it } from "vitest";
import { deleteMessagesSchema, matchesMessage, messageListHref } from "./message-query";

const message = { name: "أحمد", email: "Admin@Example.com", phone: "+96612345", message: "A wholesale inquiry", ip: "192.0.2.10", status: "new" };
it("searches all contact fields with case-insensitive and Arabic-digit matching", () => {
  for (const q of ["أحمد", "admin@example", "٩٦٦١٢", "wholesale", "192.0.2.10"]) expect(matchesMessage(message, { q, status: "all" })).toBe(true);
  expect(matchesMessage(message, { q: "wholesale", status: "replied" })).toBe(false);
  expect(matchesMessage({ ...message, ip: "" }, { q: "192.0.2.10", status: "all" })).toBe(false);
});
it("preserves filters in paginated URLs and validates destructive selections", () => {
  expect(messageListHref({ q: "a+b", status: "new" }, "a".repeat(20))).toContain("q=a%2Bb&status=new&after=");
  expect(deleteMessagesSchema.safeParse({ mode: "selected", ids: [] }).success).toBe(false);
  expect(deleteMessagesSchema.safeParse({ mode: "selected", ids: ["../other"] }).success).toBe(false);
  expect(deleteMessagesSchema.safeParse({ mode: "all", before: Date.now() + 60000 }).success).toBe(false);
});
