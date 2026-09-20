import { z } from "zod";

export const localizedTextSchema = z.object({ ar: z.string().trim().min(1).max(2500), en: z.string().trim().min(1).max(2500) });
export const optionalLocalizedTextSchema = z.object({ ar: z.string().trim().max(2500), en: z.string().trim().max(2500) });
export const documentIdSchema = z.string().regex(/^[a-zA-Z0-9_-]{1,100}$/);

export function isSafeLink(value: string) {
  if (value.startsWith("/") && !value.startsWith("//") && !value.includes("\\")) return true;
  if (/^#[\w-]*$/.test(value)) return true;
  try { const url = new URL(value); return ["https:", "http:"].includes(url.protocol) && !url.username && !url.password; }
  catch { return false; }
}

export const linkSchema = z.string().trim().max(2000).refine(isSafeLink);
export const imageUrlSchema = z.string().trim().max(2000).refine((value) => {
  if (/^\/(?!\/)[\w/.-]+$/.test(value)) return true;
  try {
    const url = new URL(value);
    const hosts = ["images.unsplash.com", "i.ibb.co", ...(process.env.NEXT_PUBLIC_SUPABASE_URL ? [new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).hostname] : [])];
    return url.protocol === "https:" && hosts.includes(url.hostname) && !url.username && !url.password;
  }
  catch { return false; }
});
