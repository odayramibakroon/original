import "server-only";
import { ZodError } from "zod";
import { getTranslations } from "next-intl/server";
import { requireAdmin } from "./session";
import { AppError, normalizeError } from "@/core/errors";
import { logger } from "@/core/logger";

export type AdminResult<T = unknown> = { ok: true; message: string; data: T } | { ok: false; message: string; errors?: Record<string, string> };

export async function adminAction<T>(operation: (admin: { uid: string; email: string }) => Promise<T>, success = "saved"): Promise<AdminResult<T>> {
  const t = await getTranslations("cms");
  try { return { ok: true, message: t(success), data: await operation(await requireAdmin()) }; }
  catch (error) {
    if (error instanceof ZodError) return { ok: false, message: t("invalid"), errors: Object.fromEntries(error.issues.map((issue) => [issue.path.join("."), t("invalid")])) };
    logger.error("Admin operation failed.", { code: normalizeError(error).code });
    const known = error instanceof AppError && ["slugExists", "imageInUse", "invalidFile", "setupDone"].includes(error.message);
    return { ok: false, message: t(known ? (error as AppError).message : "error") };
  }
}
